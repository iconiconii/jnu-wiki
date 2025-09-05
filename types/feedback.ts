// 反馈相关类型定义

export interface Feedback {
  id?: string
  type: 'bug' | 'feature' | 'improvement' | 'other'
  title: string
  content: string
  contact_info?: string
  user_agent?: string
  page_url?: string
  browser_info?: {
    userAgent: string
    language: string
    platform: string
    cookieEnabled: boolean
    screenResolution: string
    viewport: string
    timestamp: string
  }
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  admin_reply?: string
  tags?: string[]
  submitted_ip?: string
  created_at?: string
  updated_at?: string
}

export interface FeedbackStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  by_type: {
    bug: number
    feature: number
    improvement: number
    other: number
  }
  by_priority: {
    low: number
    normal: number
    high: number
    urgent: number
  }
}

export interface CreateFeedbackRequest {
  type: Feedback['type']
  title: string
  content: string
  contact_info?: string
  page_url?: string
  browser_info?: Feedback['browser_info']
}

export interface UpdateFeedbackRequest {
  id: string
  status?: Feedback['status']
  priority?: Feedback['priority']
  admin_reply?: string
  tags?: string[]
}

export interface FeedbackSubmissionResponse {
  success: boolean
  message: string
  feedbackId?: string
  error?: string
}

export interface FeedbackListResponse {
  feedback: Feedback[]
  total: number
  limit: number
  offset: number
  stats?: FeedbackStats
}

// 前端表单数据类型
export interface FeedbackFormData {
  type: Feedback['type']
  title: string
  content: string
  contact_info: string
}

// 反馈类型配置
export const FEEDBACK_TYPES = {
  bug: {
    label: 'Bug报告',
    description: '发现了系统错误或异常',
    icon: '🐛',
    priority: 'high' as const,
  },
  feature: {
    label: '功能建议',
    description: '希望添加新的功能',
    icon: '💡',
    priority: 'normal' as const,
  },
  improvement: {
    label: '体验改进',
    description: '现有功能的改进建议',
    icon: '⚡',
    priority: 'normal' as const,
  },
  other: {
    label: '其他反馈',
    description: '其他意见或建议',
    icon: '💭',
    priority: 'normal' as const,
  },
} as const

export const FEEDBACK_STATUS = {
  open: {
    label: '待处理',
    color: 'yellow',
    icon: '📝',
  },
  in_progress: {
    label: '处理中',
    color: 'blue',
    icon: '⚡',
  },
  resolved: {
    label: '已解决',
    color: 'green',
    icon: '✅',
  },
  closed: {
    label: '已关闭',
    color: 'gray',
    icon: '📁',
  },
} as const

export const FEEDBACK_PRIORITY = {
  low: {
    label: '低优先级',
    color: 'gray',
    icon: '⬇️',
  },
  normal: {
    label: '普通',
    color: 'blue',
    icon: '➡️',
  },
  high: {
    label: '高优先级',
    color: 'orange',
    icon: '⬆️',
  },
  urgent: {
    label: '紧急',
    color: 'red',
    icon: '🚨',
  },
} as const
