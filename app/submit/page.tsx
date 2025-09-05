'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { SubmissionFormCore } from '@/components/SubmissionFormCore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SubmitPage() {
  const router = useRouter()
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmitSuccess = () => {
    setSubmitSuccess(true)
    setTimeout(() => {
      router.push('/')
    }, 3000)
  }

  const handleSubmitError = (error: string) => {
    // Error handling is managed by the core component
    console.log('Submission error:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="bg-slate-900 p-2 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">Jnu Wiki</span>
              </Link>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-lg font-medium text-slate-700">投稿新资源</h1>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">投稿新资源</h1>
          <p className="text-slate-600">分享优质学习资源和工具，审核通过后展示在平台上</p>
        </div>

        {/* Form Content */}
        <SubmissionFormCore
          onSubmitSuccess={handleSubmitSuccess}
          onSubmitError={handleSubmitError}
        />
        {submitSuccess && (
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">3秒后将自动返回首页...</p>
          </div>
        )}
      </main>
    </div>
  )
}
