"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  MessageSquare, 
  Send, 
  Loader2,
  CheckCircle,
  X
} from 'lucide-react'
import { FeedbackFormData, FEEDBACK_TYPES } from '@/types/feedback'

interface FeedbackFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialType?: 'bug' | 'feature' | 'improvement' | 'other'
  currentPageUrl?: string
}

export function FeedbackForm({ 
  isOpen, 
  onOpenChange, 
  initialType = 'other',
  currentPageUrl 
}: FeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: initialType,
    title: '',
    content: '',
    contact_info: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [errors, setErrors] = useState<Partial<FeedbackFormData>>({})

  // 收集浏览器信息
  const getBrowserInfo = () => {
    if (typeof window === 'undefined') return null
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    }
  }

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({
      type: initialType,
      title: '',
      content: '',
      contact_info: ''
    })
    setErrors({})
    setSubmitResult(null)
  }, [initialType])

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Partial<FeedbackFormData> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = '请填写标题'
    } else if (formData.title.length < 5) {
      newErrors.title = '标题至少需要5个字符'
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '请填写反馈内容'
    } else if (formData.content.length < 10) {
      newErrors.content = '内容至少需要10个字符'
    } else if (formData.content.length > 1000) {
      newErrors.content = '内容不能超过1000个字符'
    }
    
    if (formData.contact_info && formData.contact_info.length > 100) {
      newErrors.contact_info = '联系方式不能超过100个字符'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交反馈
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitResult(null)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          page_url: currentPageUrl || window.location.href,
          browser_info: getBrowserInfo()
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setSubmitResult({
          success: true,
          message: data.message
        })
        // 3秒后自动关闭
        setTimeout(() => {
          onOpenChange(false)
          resetForm()
        }, 3000)
      } else {
        setSubmitResult({
          success: false,
          message: data.error || '提交失败，请重试'
        })
      }
    } catch (error) {
      console.error('Submit feedback error:', error)
      setSubmitResult({
        success: false,
        message: '网络错误，请检查连接后重试'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 重置状态当对话框关闭时
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])


  // 成功状态
  if (submitResult?.success) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              反馈提交成功！
            </h3>
            <p className="text-gray-600 mb-6">
              {submitResult.message}
            </p>
            <Button 
              onClick={() => onOpenChange(false)} 
              className="bg-green-600 hover:bg-green-700"
            >
              完成
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>提交反馈</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 反馈类型选择 */}
          <div>
            <Label className="text-sm font-medium text-gray-700">反馈类型</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {Object.entries(FEEDBACK_TYPES).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: key as FeedbackFormData['type'] })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.type === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{config.icon}</span>
                    <span className="font-medium text-sm">{config.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{config.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 标题 */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              标题 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="简要描述您的反馈..."
              className={`mt-1 ${errors.title ? 'border-red-500' : ''}`}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.title.length}/100
            </p>
          </div>

          {/* 详细内容 */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
              详细描述 <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="请详细描述您遇到的问题或建议..."
              rows={6}
              className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                errors.content ? 'border-red-500' : ''
              }`}
              maxLength={1000}
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.content.length}/1000
            </p>
          </div>

          {/* 联系方式（可选） */}
          <div>
            <Label htmlFor="contact" className="text-sm font-medium text-gray-700">
              联系方式 <span className="text-gray-500">(可选)</span>
            </Label>
            <Input
              id="contact"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              placeholder="邮箱或其他联系方式，用于回复您的反馈"
              className={`mt-1 ${errors.contact_info ? 'border-red-500' : ''}`}
              maxLength={100}
            />
            {errors.contact_info && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_info}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              提供联系方式可以让我们更好地回复您的反馈
            </p>
          </div>

          {/* 错误信息 */}
          {submitResult && !submitResult.success && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <X className="h-4 w-4 text-red-500" />
                <p className="text-red-700 text-sm">{submitResult.message}</p>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  提交反馈
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}