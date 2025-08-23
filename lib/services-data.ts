import { supabase } from './supabase'
import { DatabaseCategory, DatabaseService, ServiceCategory, CategoryConfig } from '@/types/services'

// 数据转换函数：将数据库格式转换为前端格式
export function transformDatabaseToFrontend(dbCategories: DatabaseCategory[]): CategoryConfig {
  const categories: ServiceCategory[] = dbCategories.map(dbCategory => ({
    id: dbCategory.id,
    name: dbCategory.name,
    icon: dbCategory.icon || '📦',
    description: dbCategory.description || '',
    color: dbCategory.color,
    featured: dbCategory.featured,
    services: (dbCategory.services || []).map(dbService => ({
      id: dbService.id,
      title: dbService.title,
      description: dbService.description || '',
      tags: dbService.tags || [],
      image: dbService.image || undefined,
      href: dbService.href || undefined,
      status: dbService.status,
      featured: dbService.featured
    }))
  }))

  return { categories }
}

// 获取所有分类和服务（主要用于前端显示）
export async function getCategoriesWithServices(): Promise<CategoryConfig> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        services (*)
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取分类数据失败:', error)
      throw new Error('获取分类数据失败')
    }

    // 对每个分类的服务进行排序
    const categoriesWithSortedServices = data.map(category => ({
      ...category,
      services: (category.services || []).sort((a: DatabaseService, b: DatabaseService) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
    }))

    return transformDatabaseToFrontend(categoriesWithSortedServices as DatabaseCategory[])
  } catch (error) {
    console.error('getCategoriesWithServices error:', error)
    // 返回空数据而不是抛出错误，保证前端不崩溃
    return { categories: [] }
  }
}

// 获取所有分类（不包含服务）
export async function getCategories(): Promise<DatabaseCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error('获取分类失败: ' + error.message)
  }

  return data || []
}

// 获取单个分类
export async function getCategoryById(id: string): Promise<DatabaseCategory | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 未找到
    }
    throw new Error('获取分类失败: ' + error.message)
  }

  return data
}

// 获取分类下的所有服务
export async function getServicesByCategory(categoryId: string): Promise<DatabaseService[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error('获取服务失败: ' + error.message)
  }

  return data || []
}

// 获取单个服务
export async function getServiceById(id: string): Promise<DatabaseService | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 未找到
    }
    throw new Error('获取服务失败: ' + error.message)
  }

  return data
}

// 搜索服务
export async function searchServices(query: string): Promise<DatabaseService[]> {
  if (!query.trim()) {
    return []
  }

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error('搜索服务失败: ' + error.message)
  }

  return data || []
}

// 获取推荐服务
export async function getFeaturedServices(limit: number = 6): Promise<DatabaseService[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('featured', true)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error('获取推荐服务失败: ' + error.message)
  }

  return data || []
}

// 获取服务统计信息
export async function getServiceStats() {
  try {
    const [categoriesResult, servicesResult, featuredResult] = await Promise.all([
      supabase.from('categories').select('id', { count: 'exact' }),
      supabase.from('services').select('id', { count: 'exact' }),
      supabase.from('services').select('id', { count: 'exact' }).eq('featured', true)
    ])

    return {
      categoriesCount: categoriesResult.count || 0,
      servicesCount: servicesResult.count || 0,
      featuredCount: featuredResult.count || 0
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return {
      categoriesCount: 0,
      servicesCount: 0,
      featuredCount: 0
    }
  }
}