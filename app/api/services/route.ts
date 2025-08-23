import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CreateServiceRequest, UpdateServiceRequest } from '@/types/services'

// 获取所有服务
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    
    // 验证管理员权限
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: '无访问权限' },
        { status: 403 }
      )
    }

    const categoryId = searchParams.get('category_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('services')
      .select(`
        *,
        categories!inner(name, icon)
      `)
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
      return NextResponse.json(
        { error: '数据库错误' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      services: data || [],
      total: count,
      limit,
      offset
    })

  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 创建服务
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    
    // 验证管理员权限
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: '无访问权限' },
        { status: 403 }
      )
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
      sort_order = 0 
    } = body

    // 基础验证
    if (!category_id || !title?.trim()) {
      return NextResponse.json(
        { error: '分类ID和标题不能为空' },
        { status: 400 }
      )
    }

    // 验证分类是否存在
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single()

    if (!category) {
      return NextResponse.json(
        { error: '指定的分类不存在' },
        { status: 400 }
      )
    }

    // 验证URL格式（如果提供）
    if (href && href.trim()) {
      try {
        new URL(href.trim())
      } catch {
        return NextResponse.json(
          { error: '无效的URL格式' },
          { status: 400 }
        )
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
        sort_order
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '创建服务失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      service: data
    })

  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 更新服务
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    
    // 验证管理员权限
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: '无访问权限' },
        { status: 403 }
      )
    }

    const body: UpdateServiceRequest = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: '缺少服务ID' },
        { status: 400 }
      )
    }

    // 如果更新分类，验证分类是否存在
    if (updates.category_id) {
      const { data: category } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('id', updates.category_id)
        .single()

      if (!category) {
        return NextResponse.json(
          { error: '指定的分类不存在' },
          { status: 400 }
        )
      }
    }

    // 如果更新URL，验证格式
    if (updates.href && updates.href.trim()) {
      try {
        new URL(updates.href.trim())
      } catch {
        return NextResponse.json(
          { error: '无效的URL格式' },
          { status: 400 }
        )
      }
    }

    // 清理更新数据
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )

    if (cleanUpdates.title) {
      cleanUpdates.title = cleanUpdates.title.trim()
    }
    if (cleanUpdates.description) {
      cleanUpdates.description = cleanUpdates.description.trim() || null
    }
    if (cleanUpdates.href) {
      cleanUpdates.href = cleanUpdates.href.trim() || null
    }
    if (cleanUpdates.image) {
      cleanUpdates.image = cleanUpdates.image.trim() || null
    }

    const { data, error } = await supabaseAdmin
      .from('services')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '更新服务失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      service: data
    })

  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: '无访问权限' },
        { status: 403 }
      )
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: '缺少服务ID' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', serviceId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '删除服务失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '服务删除成功'
    })

  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}