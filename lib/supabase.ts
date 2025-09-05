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

// 服务查询相关函数
export async function getServices(query: import('@/types/services').ServiceQuery) {
  try {
    const response = await fetch(
      `/api/services?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(query)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        )
      )}`
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch services:', error)
    throw error
  }
}

// 获取所有分类（用于筛选选项）
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, color, type')
      .eq('type', 'general')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    throw error
  }
}

// 获取所有可用的标签（从服务中提取）
export async function getAvailableTags() {
  try {
    const { data, error } = await supabase.from('services').select('tags').eq('status', 'active')

    if (error) {
      throw error
    }

    // 提取并去重所有标签
    const allTags = data?.flatMap(item => item.tags || []) || []
    const uniqueTags = Array.from(new Set(allTags)).sort()

    return uniqueTags
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    throw error
  }
}
