import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 公共接口：获取分类和服务（无需管理员权限）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'campus' | 'section' | 'general' | null
    const parentId = searchParams.get('parent_id')
    const includeChildren = searchParams.get('include_children') === 'true'
    const includeServices = searchParams.get('include_services') === 'true'
    const treeView = searchParams.get('tree') === 'true'
    const featuredOnly = searchParams.get('featured') === 'true'
    
    if (treeView) {
      // 使用视图获取完整的树形结构
      let query = supabase
        .from('categories_with_services')
        .select('*')
        .is('parent_id', null) // 只获取根节点
        
      if (featuredOnly) {
        query = query.eq('featured', true)
      }
      
      query = query
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: '数据库错误' }, { status: 500 })
      }

      return NextResponse.json({
        categories: data || [],
        total: data?.length || 0,
        view: 'tree'
      })
    }
    
    // 构建查询
    let query = supabase.from('categories')
    
    if (includeChildren && includeServices) {
      query = query.select(`
        *,
        children:categories!parent_id(
          *,
          services(*)
        ),
        services(*)
      `)
    } else if (includeChildren) {
      query = query.select(`
        *,
        children:categories!parent_id(*)
      `)
    } else if (includeServices) {
      query = query.select('*, services(*)')
    } else {
      query = query.select('*')
    }
    
    // 添加筛选条件
    if (type) {
      query = query.eq('type', type)
    }
    
    if (parentId) {
      if (parentId === 'null') {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parentId)
      }
    }
    
    if (featuredOnly) {
      query = query.eq('featured', true)
    }
    
    query = query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: '数据库错误' }, { status: 500 })
    }

    // 如果是获取顶级分类且包含子级，构建完整的层级结构
    if (!parentId && !type && includeChildren) {
      const topLevel = (data || []).filter(cat => !cat.parent_id)
      return NextResponse.json({
        categories: topLevel,
        total: topLevel.length,
        structure: 'hierarchical'
      })
    }

    return NextResponse.json({
      categories: data || [],
      total: data?.length || 0,
      filters: { type, parentId, includeChildren, includeServices, featuredOnly }
    })

  } catch (error) {
    console.error('Get public categories error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 获取分类统计信息
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'stats') {
      // 获取统计数据
      const [categoriesResult, servicesResult] = await Promise.all([
        supabase
          .from('categories')
          .select('type')
          .then(({ data }) => {
            const stats = data?.reduce((acc, cat) => {
              acc[cat.type] = (acc[cat.type] || 0) + 1
              return acc
            }, {} as Record<string, number>) || {}
            
            return {
              total: data?.length || 0,
              campus: stats.campus || 0,
              section: stats.section || 0,
              general: stats.general || 0
            }
          }),
        supabase
          .from('services')
          .select('category_id, categories!inner(type)')
          .then(({ data }) => {
            return data?.reduce((acc, service) => {
              const type = (service as any).categories.type
              acc[type] = (acc[type] || 0) + 1
              return acc
            }, {} as Record<string, number>) || {}
          })
      ])

      return NextResponse.json({
        categories: categoriesResult,
        services_by_category_type: servicesResult
      })
    }
    
    return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    
  } catch (error) {
    console.error('Categories stats error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}