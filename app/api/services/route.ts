import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceListResponse,
  ServiceQuery,
  SortOption,
} from '@/types/services'

// 获取服务列表（支持公开访问的筛选和排序）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')

    // 管理员模式
    if (adminKey === process.env.ADMIN_SECRET_KEY) {
      return getServicesAdmin(searchParams)
    }

    // 公开模式：支持筛选和排序
    return getServicesPublic(searchParams)
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 公开访问的服务列表（支持筛选和排序）
async function getServicesPublic(searchParams: URLSearchParams) {
  try {
    // 解析查询参数
    const query: ServiceQuery = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags') || undefined,
      ratingMin: searchParams.get('ratingMin') ? Number(searchParams.get('ratingMin')) : undefined,
      sort: (searchParams.get('sort') as SortOption) || 'newest',
      page: Math.max(1, Number(searchParams.get('page')) || 1),
      limit: Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20)),
    }

    // 参数验证
    if (query.ratingMin && (isNaN(query.ratingMin) || query.ratingMin < 1 || query.ratingMin > 5)) {
      query.ratingMin = undefined
    }

    let dbQuery = supabaseAdmin
      .from('services')
      .select(
        `
        id,
        title,
        description,
        tags,
        image,
        href,
        status,
        featured,
        rating,
        category_id,
        created_at,
        categories!inner(id, name, icon, color)
      `,
        { count: 'exact' }
      )
      .eq('status', 'active') // 只显示活跃服务

    // 搜索功能
    if (query.search) {
      dbQuery = dbQuery.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`)
    }

    // 分类筛选
    if (query.category) {
      dbQuery = dbQuery.eq('category_id', query.category)
    }

    // 标签筛选（包含任一标签）
    if (query.tags) {
      const tagArray = query.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
      if (tagArray.length > 0) {
        const tagConditions = tagArray.map(tag => `tags.cs.{${tag}}`).join(',')
        dbQuery = dbQuery.or(tagConditions)
      }
    }

    // A 路线：不涉及价格过滤

    // 评分筛选
    if (query.ratingMin !== undefined) {
      dbQuery = dbQuery.gte('rating', query.ratingMin)
    }

    // 排序
    switch (query.sort) {
      case 'newest':
        dbQuery = dbQuery.order('created_at', { ascending: false })
        break
      case 'rating_desc':
        // 评分从高到低，空值靠后
        dbQuery = dbQuery.order('rating', { ascending: false, nullsFirst: false })
        break
      default:
        dbQuery = dbQuery.order('created_at', { ascending: false })
    }

    // 分页
    const page = query.page || 1
    const limit = query.limit || 20
    const offset = (page - 1) * limit
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    const { data, error, count } = await dbQuery

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: '数据库查询失败' }, { status: 500 })
    }

    const response: ServiceListResponse = {
      items: data || [],
      page: page,
      limit: limit,
      total: count || 0,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get public services error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 管理员模式的服务列表
async function getServicesAdmin(searchParams: URLSearchParams) {
  const categoryId = searchParams.get('category_id')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('services')
    .select(
      `
      *,
      categories!inner(name, icon)
    `
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  // 添加过滤条件
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: '数据库错误' }, { status: 500 })
  }

  return NextResponse.json({
    services: data || [],
    total: count,
    limit,
    offset,
  })
}

// 创建服务
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')

    // 验证管理员权限
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: '无访问权限' }, { status: 403 })
    }

    const body: CreateServiceRequest = await request.json()
    const {
      category_id,
      title,
      description,
      tags = [],
      image,
      href,
      status = 'active',
      featured = false,
      sort_order = 0,
    } = body

    // 基础验证
    if (!category_id || !title?.trim()) {
      return NextResponse.json({ error: '分类ID和标题不能为空' }, { status: 400 })
    }

    // 验证分类是否存在
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single()

    if (!category) {
      return NextResponse.json({ error: '指定的分类不存在' }, { status: 400 })
    }

    // 验证URL格式（如果提供）
    if (href && href.trim()) {
      try {
        new URL(href.trim())
      } catch {
        return NextResponse.json({ error: '无效的URL格式' }, { status: 400 })
      }
    }

    // 插入新服务
    const { data, error } = await supabaseAdmin
      .from('services')
      .insert({
        category_id,
        title: title.trim(),
        description: description?.trim() || null,
        tags: tags || [],
        image: image?.trim() || null,
        href: href?.trim() || null,
        status,
        featured,
        sort_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: '创建服务失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      service: data,
    })
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新服务
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')

    // 验证管理员权限
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: '无访问权限' }, { status: 403 })
    }

    const body: UpdateServiceRequest = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: '缺少服务ID' }, { status: 400 })
    }

    // 如果更新分类，验证分类是否存在
    if (updates.category_id) {
      const { data: category } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('id', updates.category_id)
        .single()

      if (!category) {
        return NextResponse.json({ error: '指定的分类不存在' }, { status: 400 })
      }
    }

    // 如果更新URL，验证格式
    if (updates.href && updates.href.trim()) {
      try {
        new URL(updates.href.trim())
      } catch {
        return NextResponse.json({ error: '无效的URL格式' }, { status: 400 })
      }
    }

    // 清理更新数据
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    )

    if (cleanUpdates.title && typeof cleanUpdates.title === 'string') {
      cleanUpdates.title = cleanUpdates.title.trim()
    }
    if (cleanUpdates.description && typeof cleanUpdates.description === 'string') {
      const trimmed = cleanUpdates.description.trim()
      if (trimmed) cleanUpdates.description = trimmed
    }
    if (cleanUpdates.href && typeof cleanUpdates.href === 'string') {
      const trimmed = cleanUpdates.href.trim()
      if (trimmed) cleanUpdates.href = trimmed
    }
    if (cleanUpdates.image && typeof cleanUpdates.image === 'string') {
      const trimmed = cleanUpdates.image.trim()
      if (trimmed) cleanUpdates.image = trimmed
    }

    const { data, error } = await supabaseAdmin
      .from('services')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: '更新服务失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      service: data,
    })
  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 删除服务
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    const serviceId = searchParams.get('id')

    // 验证管理员权限
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: '无访问权限' }, { status: 403 })
    }

    if (!serviceId) {
      return NextResponse.json({ error: '缺少服务ID' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('services').delete().eq('id', serviceId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: '删除服务失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '服务删除成功',
    })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
