import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CreateCategoryRequest, UpdateCategoryRequest } from '@/types/services'

// 获取所有分类
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

    const includeServices = searchParams.get('include_services') === 'true'
    
    let query = supabaseAdmin
      .from('categories')
      .select(includeServices ? '*, services(*)' : '*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '数据库错误' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      categories: data || [],
      total: data?.length || 0
    })

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 创建分类
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

    const body: CreateCategoryRequest = await request.json()
    const { name, icon, description, color = 'blue', featured = false, sort_order = 0 } = body

    // 基础验证
    if (!name?.trim()) {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      )
    }

    // 检查名称是否重复
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', name.trim())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: '分类名称已存在' },
        { status: 409 }
      )
    }

    // 插入新分类
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: name.trim(),
        icon: icon || null,
        description: description || null,
        color: color,
        featured: featured,
        sort_order: sort_order
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '创建分类失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      category: data
    })

  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 更新分类
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

    const body: UpdateCategoryRequest = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: '缺少分类ID' },
        { status: 400 }
      )
    }

    // 如果更新名称，检查是否重复
    if (updates.name) {
      const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('name', updates.name.trim())
        .neq('id', id)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: '分类名称已存在' },
          { status: 409 }
        )
      }
    }

    // 清理更新数据
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )

    if (cleanUpdates.name) {
      cleanUpdates.name = cleanUpdates.name.trim()
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '更新分类失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      category: data
    })

  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 删除分类
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    const categoryId = searchParams.get('id')
    
    // 验证管理员权限
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: '无访问权限' },
        { status: 403 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: '缺少分类ID' },
        { status: 400 }
      )
    }

    // 检查分类下是否还有服务
    const { data: services } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1)

    if (services && services.length > 0) {
      return NextResponse.json(
        { error: '该分类下还有服务，请先删除所有服务' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '删除分类失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '分类删除成功'
    })

  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}