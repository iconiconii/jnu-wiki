'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useDebouncedSubmit } from '@/hooks/useDebounce'
import { CategorySelector } from '@/components/CategorySelector'

interface SubmissionFormCoreProps {
  onSubmitSuccess?: () => void
  onSubmitError?: (error: string) => void
}

export function SubmissionFormCore({ onSubmitSuccess, onSubmitError }: SubmissionFormCoreProps) {
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
          const error = '数学验证错误，请重新计算'
          setErrorMessage(error)
          onSubmitError?.(error)
          return
        }

        // 基础验证
        if (!formData.category || !formData.title || !formData.description || !formData.url) {
          const error = '请填写所有必填字段'
          setErrorMessage(error)
          onSubmitError?.(error)
          return
        }

        // URL 验证
        try {
          new URL(formData.url)
        } catch {
          const error = '请输入有效的 URL 地址'
          setErrorMessage(error)
          onSubmitError?.(error)
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
          onSubmitSuccess?.()
        } else {
          const error = result.error || '提交失败，请稍后重试'
          setSubmitStatus('error')
          setErrorMessage(error)
          onSubmitError?.(error)
        }
      } catch {
        const error = '网络错误，请稍后重试'
        setSubmitStatus('error')
        setErrorMessage(error)
        onSubmitError?.(error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      formData,
      mathChallenge.answer,
      mathChallenge.a,
      mathChallenge.b,
      onSubmitSuccess,
      onSubmitError,
    ]
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
        const error = `请等待 ${Math.ceil((2000 - (now - lastSubmitAttempt)) / 1000)} 秒后再次提交`
        setErrorMessage(error)

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

  if (submitStatus === 'success') {
    return (
      <div className="flex flex-col items-center space-y-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <div className="text-center">
          <h3 className="text-xl font-semibold text-green-700">投稿成功！</h3>
          <p className="text-sm text-slate-600 mt-2">感谢你的投稿，我们会尽快审核并反馈</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* 分类选择 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">选择分类</h3>
        <CategorySelector
          selectedCategoryId={formData.category}
          onCategorySelect={handleCategorySelect}
          error={!formData.category ? '请选择一个分类' : undefined}
        />
        {formData.categoryPath && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-700 font-medium">已选择：{formData.categoryPath}</span>
          </div>
        )}
      </div>

      {/* 基本信息 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">基本信息</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="title" className="text-base font-medium">
              资源标题 *
            </Label>
            <Input
              id="title"
              placeholder="请输入资源标题"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              maxLength={100}
              className="mt-2 h-11 focus:border-slate-400 focus:ring-slate-400"
            />
            <p className="text-xs text-slate-500 mt-1">{formData.title.length}/100</p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="url" className="text-base font-medium">
              链接地址 *
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="mt-2 h-11 focus:border-slate-400 focus:ring-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="submittedBy" className="text-base font-medium">
              联系方式 <span className="text-slate-400">(可选)</span>
            </Label>
            <Input
              id="submittedBy"
              placeholder="昵称或邮箱"
              value={formData.submittedBy}
              onChange={e => setFormData(prev => ({ ...prev, submittedBy: e.target.value }))}
              maxLength={50}
              className="mt-2 h-11 focus:border-slate-400 focus:ring-slate-400"
            />
            <p className="text-xs text-slate-500 mt-1">方便我们联系反馈</p>
          </div>

          <div>
            <Label htmlFor="mathAnswer" className="text-base font-medium">
              人机验证 *
            </Label>
            <div className="flex items-center space-x-3 mt-2">
              <span className="text-base font-mono bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 select-none">
                {mathChallenge.a} + {mathChallenge.b} = ?
              </span>
              <Input
                id="mathAnswer"
                type="number"
                placeholder="答案"
                value={mathChallenge.answer}
                onChange={e => setMathChallenge(prev => ({ ...prev, answer: e.target.value }))}
                className="w-20 h-11 text-center focus:border-slate-400 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 详细描述 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">详细描述</h3>
        <div>
          <Label htmlFor="description" className="text-base font-medium">
            资源描述 *
          </Label>
          <textarea
            id="description"
            placeholder="请详细描述这个资源的特点、用途和优势，帮助其他同学了解"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-2 w-full h-32 px-4 py-3 border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-1 focus:ring-slate-400 resize-none"
            maxLength={500}
          />
          <p className="text-xs text-slate-500 mt-1">{formData.description.length}/500</p>
        </div>
      </div>

      {/* 投稿指南和错误信息 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-6 rounded-xl border border-blue-100">
          <h3 className="text-base font-semibold text-slate-900 mb-3">💡 投稿指南</h3>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>• 选择准确的分类便于查找</li>
            <li>• 标题简洁明了突出特点</li>
            <li>• 详细描述用途和优势</li>
            <li>• 确保链接有效内容优质</li>
          </ul>
        </div>

        {errorMessage && (
          <div
            className={`flex items-center space-x-3 p-6 rounded-xl ${
              submitStatus === 'debouncing'
                ? 'text-amber-700 bg-amber-50 border border-amber-200'
                : 'text-red-700 bg-red-50 border border-red-200'
            }`}
          >
            {submitStatus === 'debouncing' ? (
              <Clock className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-center space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
          disabled={isSubmitting}
          className="px-8"
        >
          重置表单
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || submitStatus === 'debouncing'}
          size="lg"
          className={`px-12 text-white font-medium ${
            submitStatus === 'debouncing'
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              提交中...
            </>
          ) : submitStatus === 'debouncing' ? (
            <>
              <Clock className="h-5 w-5 mr-2" />
              请等待...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              提交投稿
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
