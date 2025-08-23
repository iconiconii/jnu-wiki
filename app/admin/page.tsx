"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Eye,
  Shield,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Submission, SubmissionStats } from '@/lib/supabase'

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<SubmissionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // 认证检查
  const handleAuth = () => {
    if (adminKey === process.env.NEXT_PUBLIC_ADMIN_DEMO_KEY || adminKey) {
      setIsAuthenticated(true)
      loadSubmissions()
    }
  }

  // 加载投稿列表
  const loadSubmissions = async () => {
    if (!isAuthenticated || !adminKey) return
    
    setLoading(true)
    try {
      const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter}`
      const response = await fetch(`/api/submissions?admin_key=${adminKey}${statusParam}`)
      
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions)
        
        // 计算统计数据
        const stats = data.submissions.reduce((acc: SubmissionStats, sub: Submission) => {
          acc.total++
          const status = sub.status || 'pending'
          if (status === 'pending') acc.pending++
          else if (status === 'approved') acc.approved++
          else if (status === 'rejected') acc.rejected++
          return acc
        }, { total: 0, pending: 0, approved: 0, rejected: 0 })
        
        setStats(stats)
      }
    } catch (error) {
      console.error('Load submissions error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 更新投稿状态
  const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!adminKey) return
    
    try {
      const response = await fetch(`/api/submissions?admin_key=${adminKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        // 重新加载列表
        loadSubmissions()
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Update status error:', error)
    }
  }

  // 状态图标
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  // 状态标签
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">已通过</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">已拒绝</Badge>
      default:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">待审核</Badge>
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadSubmissions()
    }
  }, [isAuthenticated, statusFilter, adminKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // 未认证界面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-slate-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-slate-600" />
            </div>
            <CardTitle>管理员登录</CardTitle>
            <CardDescription>请输入管理员密钥访问审核系统</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key">管理员密钥</Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="请输入管理员密钥"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <Button onClick={handleAuth} className="w-full bg-slate-900 hover:bg-slate-800">
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-slate-900">投稿管理系统</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSubmissions}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                刷新
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAuthenticated(false)}
              >
                退出
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
                    <p className="text-sm font-medium text-slate-600">总投稿</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">待审核</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">已通过</p>
                    <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">已拒绝</p>
                    <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 过滤器 */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? '全部' : 
                 status === 'pending' ? '待审核' :
                 status === 'approved' ? '已通过' : '已拒绝'}
              </Button>
            ))}
          </div>
        </div>

        {/* 投稿列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">暂无投稿数据</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(submission.status)}
                        <h3 className="text-lg font-semibold text-slate-900">
                          {submission.title}
                        </h3>
                        {getStatusBadge(submission.status)}
                        <Badge variant="secondary">{submission.category}</Badge>
                      </div>
                      
                      <p className="text-slate-600 mb-3 line-clamp-2">
                        {submission.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>提交时间: {new Date(submission.created_at || '').toLocaleString()}</span>
                        {submission.submitted_by && (
                          <span>提交者: {submission.submitted_by}</span>
                        )}
                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          查看链接 <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        详情
                      </Button>
                      
                      {submission.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:border-green-600"
                            onClick={() => updateSubmissionStatus(submission.id!, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            通过
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:border-red-600"
                            onClick={() => updateSubmissionStatus(submission.id!, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒绝
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* 详情弹窗 */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>投稿详情</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">状态</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">分类</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{selectedSubmission.category}</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-slate-600">标题</Label>
                <p className="mt-1 text-slate-900">{selectedSubmission.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-slate-600">描述</Label>
                <p className="mt-1 text-slate-700">{selectedSubmission.description}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-slate-600">链接</Label>
                <a
                  href={selectedSubmission.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-blue-600 hover:text-blue-700 flex items-center"
                >
                  {selectedSubmission.url} <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-500">
                <div>
                  <Label className="text-sm font-medium text-slate-600">提交时间</Label>
                  <p className="mt-1">{new Date(selectedSubmission.created_at || '').toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">提交者</Label>
                  <p className="mt-1">{selectedSubmission.submitted_by || '匿名'}</p>
                </div>
              </div>
              
              {selectedSubmission.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:border-red-600"
                    onClick={() => updateSubmissionStatus(selectedSubmission.id!, 'rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    拒绝
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => updateSubmissionStatus(selectedSubmission.id!, 'approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    通过
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}