"use client"

import { useState } from 'react'
import { MessageSquare, Bug, Lightbulb, Zap, MessageCircle } from 'lucide-react'
import { FeedbackForm } from './FeedbackForm'

interface FeedbackButtonProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function FeedbackButton({ 
  className = '', 
  position = 'bottom-right' 
}: FeedbackButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<'bug' | 'feature' | 'improvement' | 'other'>('other')

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  }

  const feedbackTypes = [
    { 
      key: 'bug' as const, 
      label: 'Bug报告', 
      icon: <Bug className="h-4 w-4" />, 
      color: 'bg-red-500 hover:bg-red-600',
      description: '报告系统错误'
    },
    { 
      key: 'feature' as const, 
      label: '功能建议', 
      icon: <Lightbulb className="h-4 w-4" />, 
      color: 'bg-blue-500 hover:bg-blue-600',
      description: '提出新功能想法'
    },
    { 
      key: 'improvement' as const, 
      label: '体验改进', 
      icon: <Zap className="h-4 w-4" />, 
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: '改进现有功能'
    },
    { 
      key: 'other' as const, 
      label: '其他反馈', 
      icon: <MessageCircle className="h-4 w-4" />, 
      color: 'bg-gray-500 hover:bg-gray-600',
      description: '其他意见建议'
    }
  ]

  const openFeedbackForm = (type: 'bug' | 'feature' | 'improvement' | 'other') => {
    setSelectedType(type)
    setIsFormOpen(true)
    setIsMenuOpen(false)
  }

  return (
    <>
      <div className={`${positionClasses[position]} z-50 ${className}`}>
        {/* 快捷菜单 */}
        {isMenuOpen && (
          <div className="mb-3 space-y-2">
            {feedbackTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => openFeedbackForm(type.key)}
                className={`flex items-center space-x-3 ${type.color} text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl group w-full text-left`}
                title={type.description}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  {type.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-white/80">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* 主按钮 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl group ${
            isMenuOpen ? 'rotate-45' : 'hover:rotate-12'
          }`}
          title="反馈建议"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
        
        {/* 标签提示 */}
        {!isMenuOpen && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            反馈建议
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* 背景遮罩 */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 反馈表单 */}
      <FeedbackForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialType={selectedType}
      />
    </>
  )
}

// 简单版本的反馈按钮（只有一个主按钮）
export function SimpleFeedbackButton({ 
  className = '', 
  position = 'bottom-right' 
}: FeedbackButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  }

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        className={`${positionClasses[position]} z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl group ${className}`}
        title="提交反馈"
      >
        <MessageSquare className="h-6 w-6" />
        
        {/* 标签提示 */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          提交反馈
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>

      <FeedbackForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </>
  )
}