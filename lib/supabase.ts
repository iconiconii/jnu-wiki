import { createClient } from '@supabase/supabase-js'

// 公共 Supabase 客户端 (用于前端，权限有限)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端 Supabase 客户端 (用于 API 路由，具有更高权限)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
)

// 投稿数据类型
export interface Submission {
  id?: string
  category: string
  title: string
  description: string
  url: string
  status?: 'pending' | 'approved' | 'rejected'
  submitted_by?: string
  submitted_ip?: string
  created_at?: string
  updated_at?: string
}

// 投稿统计类型
export interface SubmissionStats {
  total: number
  pending: number
  approved: number
  rejected: number
}