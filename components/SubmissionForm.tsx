'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useDebouncedSubmit } from '@/hooks/useDebounce'
import { CategorySelector } from '@/components/CategorySelector'

interface SubmissionFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmissionForm({ isOpen, onOpenChange }: SubmissionFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    categoryPath: '',
    title: '',
    description: '',
    url: '',
    submittedBy: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'debouncing'>(
    'idle'
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [mathChallenge, setMathChallenge] = useState({ a: 0, b: 0, answer: '' })
  const [lastSubmitAttempt, setLastSubmitAttempt] = useState<number>(0)

  // 生成简单的数学验证
  const generateMathChallenge = useCallback(() => {
    const a = Math.floor(Math.random() * 10) + 1
    const b = Math.floor(Math.random() * 10) + 1
    setMathChallenge({ a, b, answer: '' })
  }, [])

  // 初始化数学验证
  useEffect(() => {
    generateMathChallenge()
  }, [generateMathChallenge])

  // 表单重置
  const resetForm = useCallback(() => {
    setFormData({
      category: '',
      categoryPath: '',
      title: '',
      description: '',
      url: '',
      submittedBy: '',
    })
    setSubmitStatus('idle')
    setErrorMessage('')
    generateMathChallenge()
  }, [generateMathChallenge])

  // 处理分类选择
  const handleCategorySelect = (categoryId: string, categoryPath: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      categoryPath: categoryPath,
    }))
  }

  // 实际的提交逻辑
  const performSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      setSubmitStatus('idle')
      setErrorMessage('')

      try {
        // 验证数学题
        if (parseInt(mathChallenge.answer) !== mathChallenge.a + mathChallenge.b) {
          setErrorMessage('数学验证错误，请重新计算')
          return
        }

        // 基础验证
        if (!formData.category || !formData.title || !formData.description || !formData.url) {
          setErrorMessage('请填写所有必填字段')
          return
        }

        // URL 验证
        try {
          new URL(formData.url)
        } catch {
          setErrorMessage('请输入有效的 URL 地址')
          return
        }

        // 添加提交时间戳和指纹
        const submitData = {
          ...formData,
          submitTimestamp: Date.now(),
          submitFingerprint: `${formData.title}_${formData.url}_${Date.now()}`,
        }

        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        })

        const result = await response.json()

        if (response.ok) {
          setSubmitStatus('success')
          setTimeout(() => {
            onOpenChange(false)
            resetForm()
          }, 2000)
        } else {
          setSubmitStatus('error')
          setErrorMessage(result.error || '提交失败，请稍后重试')
        }
      } catch {
        setSubmitStatus('error')
        setErrorMessage('网络错误，请稍后重试')
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, mathChallenge.answer, mathChallenge.a, mathChallenge.b, onOpenChange, resetForm]
  )

  // 使用防抖提交
  const { debouncedSubmit } = useDebouncedSubmit(
    performSubmit,
    2000 // 2秒防抖间隔
  )

  // 处理表单提交
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      const now = Date.now()

      // 检查是否在短时间内重复点击
      if (now - lastSubmitAttempt < 2000) {
        setSubmitStatus('debouncing')
        setErrorMessage(
          `请等待 ${Math.ceil((2000 - (now - lastSubmitAttempt)) / 1000)} 秒后再次提交`
        )

        // 清除防抖提示
        setTimeout(
          () => {
            if (submitStatus === 'debouncing') {
              setSubmitStatus('idle')
              setErrorMessage('')
            }
          },
          2000 - (now - lastSubmitAttempt)
        )

        return
      }

      setLastSubmitAttempt(now)
      debouncedSubmit(e)
    },
    [lastSubmitAttempt, debouncedSubmit, submitStatus]
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>投稿新资源</span>
          </DialogTitle>
          <DialogDescription>
            分享你发现的优质学习资源和工具，经审核通过后将展示在平台上
          </DialogDescription>
        </DialogHeader>

        {submitStatus === 'success' ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-700">投稿成功！</h3>
              <p className="text-sm text-slate-600 mt-1">感谢你的投稿，我们会尽快审核并反馈</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <form id="submission-form" onSubmit={handleSubmit} className="space-y-4 p-1">
                <div className="space-y-2">
                  <CategorySelector
                    selectedCategoryId={formData.category}
                    onCategorySelect={handleCategorySelect}
                    error={!formData.category ? '请选择一个分类' : undefined}
                  />
                  {formData.categoryPath && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <span className="text-blue-700">已选择：{formData.categoryPath}</span>
                    </div>
                  )}
                </div>

                {/* 标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title">标题 *</Label>
                  <Input
                    id="title"
                    placeholder="请输入资源标题"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                    className="focus:border-slate-400 focus:ring-slate-400"
                  />
                  <p className="text-xs text-slate-500">{formData.title.length}/100</p>
                </div>

                {/* 描述 */}
                <div className="space-y-2">
                  <Label htmlFor="description">描述 *</Label>
                  <textarea
                    id="description"
                    placeholder="请简要描述这个资源的特点和用途"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full min-h-[80px] px-3 py-2 border border-slate-200 rounded-md focus:border-slate-400 focus:ring-1 focus:ring-slate-400 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500">{formData.description.length}/500</p>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label htmlFor="url">链接地址 *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="focus:border-slate-400 focus:ring-slate-400"
                  />
                </div>

                {/* 提交者信息（可选） */}
                <div className="space-y-2">
                  <Label htmlFor="submittedBy">提交者信息（可选）</Label>
                  <Input
                    id="submittedBy"
                    placeholder="你的昵称或联系方式"
                    value={formData.submittedBy}
                    onChange={e => setFormData(prev => ({ ...prev, submittedBy: e.target.value }))}
                    maxLength={50}
                    className="focus:border-slate-400 focus:ring-slate-400"
                  />
                </div>

                {/* 数学验证 */}
                <div className="space-y-2">
                  <Label htmlFor="mathAnswer">人机验证 *</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {mathChallenge.a} + {mathChallenge.b} ={' '}
                    </span>
                    <Input
                      id="mathAnswer"
                      type="number"
                      placeholder="?"
                      value={mathChallenge.answer}
                      onChange={e =>
                        setMathChallenge(prev => ({ ...prev, answer: e.target.value }))
                      }
                      className="w-20 focus:border-slate-400 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {/* 错误信息和状态提示 */}
                {errorMessage && (
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg ${
                      submitStatus === 'debouncing'
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-red-600 bg-red-50'
                    }`}
                  >
                    {submitStatus === 'debouncing' ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm">{errorMessage}</span>
                  </div>
                )}
              </form>
            </div>

            <div className="border-t pt-4 mt-4 bg-white">
              <div className="flex justify-end space-x-3">
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
                  form="submission-form"
                  disabled={isSubmitting || submitStatus === 'debouncing'}
                  className={`text-white ${
                    submitStatus === 'debouncing'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : submitStatus === 'debouncing' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      请等待...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      提交投稿
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
