"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Bug, 
  Lightbulb, 
  Zap, 
  MessageCircle,
  Clock, 
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCw,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  AlertTriangle,
  Mail,
  Calendar,
  ExternalLink,
  MessageSquare,
  Reply
} from 'lucide-react'
import { Feedback, FeedbackStats, FEEDBACK_TYPES, FEEDBACK_STATUS, FEEDBACK_PRIORITY } from '@/types/feedback'

export default function FeedbackManagementPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all'
  })

  // 使用认证的API请求
  const authenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token')
    
    if (!token) {
      throw new Error('未认证')
    }

    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${token}`)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '服务器错误' }))
        throw new Error(errorData.error || '请求失败')
      }

      return response.json()
    } catch (error) {
      console.error('Authenticated request error:', error)
      throw error
    }
  }

  // 检查认证状态
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }
    setIsAuthenticated(true)
    loadFeedbacks()
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  // 加载反馈列表
  const loadFeedbacks = useCallback(async () => {
    if (!isAuthenticated) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.type !== 'all') params.append('type', filters.type)
      if (filters.priority !== 'all') params.append('priority', filters.priority)
      
      const queryString = params.toString()
      const url = `/api/feedback${queryString ? `?${queryString}` : ''}`
      
      const data = await authenticatedRequest(url)
      
      setFeedbacks(data.feedback)
      setStats(data.stats)
    } catch (error) {
      console.error('Load feedbacks error:', error)
      if (error instanceof Error && (error.message.includes('未认证') || error.message.includes('认证失败'))) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, router, filters.status, filters.type, filters.priority])

  // 更新反馈状态
  const updateFeedbackStatus = async (id: string, status: Feedback['status']) => {
    try {
      await authenticatedRequest('/api/feedback', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })

      loadFeedbacks()
      setSelectedFeedback(null)
    } catch (error) {
      console.error('Update status error:', error)
      alert(error instanceof Error ? error.message : '更新失败')
    }
  }

  // 更新优先级
  const updateFeedbackPriority = async (id: string, priority: Feedback['priority']) => {
    try {
      await authenticatedRequest('/api/feedback', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, priority }),
      })

      loadFeedbacks()
      setSelectedFeedback(null)
    } catch (error) {
      console.error('Update priority error:', error)
      alert(error instanceof Error ? error.message : '更新失败')
    }
  }

  // 回复反馈
  const replyToFeedback = async (id: string) => {
    if (!replyText.trim()) return
    
    setIsReplying(true)
    try {
      await authenticatedRequest('/api/feedback', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id, 
          admin_reply: replyText.trim(),
          status: 'resolved' // 回复后自动标记为已解决
        }),
      })

      setReplyText('')
      loadFeedbacks()
      setSelectedFeedback(null)
      alert('回复发送成功！')
    } catch (error) {
      console.error('Reply error:', error)
      alert(error instanceof Error ? error.message : '回复失败')
    } finally {
      setIsReplying(false)
    }
  }

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    const icons = {
      bug: <Bug className="h-4 w-4 text-red-500" />,
      feature: <Lightbulb className="h-4 w-4 text-blue-500" />,
      improvement: <Zap className="h-4 w-4 text-yellow-500" />,
      other: <MessageCircle className="h-4 w-4 text-gray-500" />
    }
    return icons[type as keyof typeof icons] || icons.other
  }


  // 获取优先级图标
  const getPriorityIcon = (priority?: string) => {
    const icons = {
      low: <ArrowDownCircle className="h-4 w-4 text-gray-500" />,
      normal: <ArrowRightCircle className="h-4 w-4 text-blue-500" />,
      high: <ArrowUpCircle className="h-4 w-4 text-orange-500" />,
      urgent: <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    return icons[priority as keyof typeof icons] || icons.normal
  }

  // 获取状态标签
  const getStatusBadge = (status?: string) => {
    const config = FEEDBACK_STATUS[status as keyof typeof FEEDBACK_STATUS] || FEEDBACK_STATUS.open
    const colorClasses = {
      yellow: 'text-yellow-600 border-yellow-600 bg-yellow-50',
      blue: 'text-blue-600 border-blue-600 bg-blue-50',
      green: 'text-green-600 border-green-600 bg-green-50',
      gray: 'text-gray-600 border-gray-600 bg-gray-50'
    }
    
    return (
      <Badge variant="outline" className={colorClasses[config.color as keyof typeof colorClasses]}>
        {config.label}
      </Badge>
    )
  }

  // 获取优先级标签
  const getPriorityBadge = (priority?: string) => {
    const config = FEEDBACK_PRIORITY[priority as keyof typeof FEEDBACK_PRIORITY] || FEEDBACK_PRIORITY.normal
    const colorClasses = {
      gray: 'text-gray-600 border-gray-600 bg-gray-50',
      blue: 'text-blue-600 border-blue-600 bg-blue-50',
      orange: 'text-orange-600 border-orange-600 bg-orange-50',
      red: 'text-red-600 border-red-600 bg-red-50'
    }
    
    return (
      <Badge variant="outline" className={colorClasses[config.color as keyof typeof colorClasses]}>
        {config.label}
      </Badge>
    )
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadFeedbacks()
    }
  }, [isAuthenticated, filters, loadFeedbacks])

  // 未认证时显示加载状态
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">正在验证身份...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin')}
                className="text-slate-600 hover:text-slate-900"
              >
                ← 返回管理后台
              </Button>
              <h1 className="text-xl font-bold text-slate-900">反馈管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadFeedbacks}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                刷新
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">总反馈</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-slate-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">待处理</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.open}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">已解决</p>
                    <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Bug报告</p>
                    <p className="text-3xl font-bold text-red-600">{stats.by_type.bug}</p>
                  </div>
                  <Bug className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 过滤器 */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">状态:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="open">待处理</option>
                <option value="in_progress">处理中</option>
                <option value="resolved">已解决</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">类型:</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部类型</option>
                <option value="bug">Bug报告</option>
                <option value="feature">功能建议</option>
                <option value="improvement">体验改进</option>
                <option value="other">其他反馈</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">优先级:</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部优先级</option>
                <option value="urgent">紧急</option>
                <option value="high">高优先级</option>
                <option value="normal">普通</option>
                <option value="low">低优先级</option>
              </select>
            </div>
          </div>
        </div>

        {/* 反馈列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">暂无反馈数据</p>
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getTypeIcon(feedback.type)}
                        {getPriorityIcon(feedback.priority)}
                        <h3 className="text-lg font-semibold text-slate-900">
                          {feedback.title}
                        </h3>
                        {getStatusBadge(feedback.status)}
                        {getPriorityBadge(feedback.priority)}
                        <Badge variant="secondary">
                          {FEEDBACK_TYPES[feedback.type]?.label || feedback.type}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-600 mb-4 line-clamp-2">
                        {feedback.content}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-slate-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(feedback.created_at || '').toLocaleString('zh-CN')}
                        </span>
                        {feedback.contact_info && (
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            有联系方式
                          </span>
                        )}
                        {feedback.page_url && (
                          <a
                            href={feedback.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            来源页面
                          </a>
                        )}
                      </div>
                      
                      {feedback.admin_reply && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm text-blue-800">
                            <strong>管理员回复：</strong> {feedback.admin_reply}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFeedback(feedback)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        详情
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* 详情弹窗 */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>反馈详情</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">状态</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    {getStatusBadge(selectedFeedback.status)}
                    <select
                      value={selectedFeedback.status || 'open'}
                      onChange={(e) => updateFeedbackStatus(selectedFeedback.id!, e.target.value as Feedback['status'])}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="open">待处理</option>
                      <option value="in_progress">处理中</option>
                      <option value="resolved">已解决</option>
                      <option value="closed">已关闭</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">优先级</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    {getPriorityBadge(selectedFeedback.priority)}
                    <select
                      value={selectedFeedback.priority || 'normal'}
                      onChange={(e) => updateFeedbackPriority(selectedFeedback.id!, e.target.value as Feedback['priority'])}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="low">低优先级</option>
                      <option value="normal">普通</option>
                      <option value="high">高优先级</option>
                      <option value="urgent">紧急</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* 反馈内容 */}
              <div>
                <Label className="text-sm font-medium text-slate-600">标题</Label>
                <p className="mt-1 text-slate-900 font-medium">{selectedFeedback.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-slate-600">详细描述</Label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedFeedback.content}</p>
                </div>
              </div>
              
              {/* 附加信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">反馈类型</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    {getTypeIcon(selectedFeedback.type)}
                    <Badge variant="secondary">
                      {FEEDBACK_TYPES[selectedFeedback.type]?.label || selectedFeedback.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">提交时间</Label>
                  <p className="mt-1 text-slate-700">
                    {new Date(selectedFeedback.created_at || '').toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              
              {selectedFeedback.contact_info && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">联系方式</Label>
                  <p className="mt-1 text-slate-700">{selectedFeedback.contact_info}</p>
                </div>
              )}
              
              {selectedFeedback.page_url && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">来源页面</Label>
                  <a
                    href={selectedFeedback.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    {selectedFeedback.page_url} <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </div>
              )}
              
              {/* 浏览器信息 */}
              {selectedFeedback.browser_info && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">浏览器信息</Label>
                  <div className="mt-1 text-sm text-slate-600 space-y-1">
                    <p><strong>用户代理:</strong> {selectedFeedback.browser_info.userAgent}</p>
                    <p><strong>屏幕分辨率:</strong> {selectedFeedback.browser_info.screenResolution}</p>
                    <p><strong>视窗大小:</strong> {selectedFeedback.browser_info.viewport}</p>
                  </div>
                </div>
              )}
              
              {/* 管理员回复 */}
              <div>
                <Label className="text-sm font-medium text-slate-600">管理员回复</Label>
                {selectedFeedback.admin_reply ? (
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-blue-800">{selectedFeedback.admin_reply}</p>
                  </div>
                ) : (
                  <div className="mt-1 space-y-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="输入回复内容..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={() => replyToFeedback(selectedFeedback.id!)}
                      disabled={!replyText.trim() || isReplying}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isReplying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          发送中...
                        </>
                      ) : (
                        <>
                          <Reply className="h-4 w-4 mr-2" />
                          发送回复
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}