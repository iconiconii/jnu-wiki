import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CreateCategoryRequest, UpdateCategoryRequest, GetCategoriesParams } from '@/types/services'
import { SimpleAdminAuth } from '@/lib/simple-auth'

// 获取所有分类
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = SimpleAdminAuth.verifyToken(request)
    
    if (!authResult.isValid) {
      return SimpleAdminAuth.createUnauthorizedResponse(authResult.error)
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'campus' | 'section' | 'general' | null
    const parentId = searchParams.get('parent_id')
    const includeChildren = searchParams.get('include_children') === 'true'
    const includeServices = searchParams.get('include_services') === 'true'
    const treeView = searchParams.get('tree') === 'true'
    
    if (treeView) {
      // 使用视图获取树形结构
      const { data, error } = await supabaseAdmin
        .from('categories_with_services')
        .select('*')
        .is('parent_id', null) // 只获取根节点
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

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
    let query = supabaseAdmin.from('categories')
    
    if (includeChildren && includeServices) {
      query = query.select(`
        *,
        children:categories!parent_id(*),
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
      filters: { type, parentId, includeChildren, includeServices }
    })

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 创建分类
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = SimpleAdminAuth.verifyToken(request)
    
    if (!authResult.isValid) {
      return SimpleAdminAuth.createUnauthorizedResponse(authResult.error)
    }

    const body: CreateCategoryRequest = await request.json()
    const { name, icon, description, color = 'blue', type, parent_id, featured = false, sort_order = 0 } = body

    // 基础验证
    if (!name?.trim()) {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      )
    }
    
    if (!type || !['campus', 'section', 'general'].includes(type)) {
      return NextResponse.json(
        { error: '分类类型必须是 campus、section 或 general' },
        { status: 400 }
      )
    }
    
    // 验证层级关系
    if (type === 'campus' && parent_id) {
      return NextResponse.json(
        { error: '校区类型不能有父分类' },
        { status: 400 }
      )
    }
    
    if (type === 'section' && !parent_id) {
      return NextResponse.json(
        { error: '篇章类型必须指定父分类（校区）' },
        { status: 400 }
      )
    }
    
    if (type === 'general' && parent_id) {
      return NextResponse.json(
        { error: '通用类型不能有父分类' },
        { status: 400 }
      )
    }
    
    // 如果有父分类，验证父分类是否存在且为校区类型
    if (parent_id) {
      const { data: parentCategory, error: parentError } = await supabaseAdmin
        .from('categories')
        .select('id, type')
        .eq('id', parent_id)
        .single()
        
      if (parentError || !parentCategory) {
        return NextResponse.json(
          { error: '父分类不存在' },
          { status: 400 }
        )
      }
      
      if (parentCategory.type !== 'campus') {
        return NextResponse.json(
          { error: '父分类必须是校区类型' },
          { status: 400 }
        )
      }
    }

    // 检查名称是否重复（在同一层级内）
    let duplicateQuery = supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', name.trim())
      
    if (parent_id) {
      duplicateQuery = duplicateQuery.eq('parent_id', parent_id)
    } else {
      duplicateQuery = duplicateQuery.is('parent_id', null)
    }
    
    const { data: existing } = await duplicateQuery.limit(1)

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
        type: type,
        parent_id: parent_id || null,
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
    // 验证管理员权限
    const authResult = SimpleAdminAuth.verifyToken(request)
    
    if (!authResult.isValid) {
      return SimpleAdminAuth.createUnauthorizedResponse(authResult.error)
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
      Object.entries(updates).filter(([, value]) => value !== undefined)
    )

    if (cleanUpdates.name && typeof cleanUpdates.name === 'string') {
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
    // 验证管理员权限
    const authResult = SimpleAdminAuth.verifyToken(request)
    
    if (!authResult.isValid) {
      return SimpleAdminAuth.createUnauthorizedResponse(authResult.error)
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

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
    
    // 检查是否有子分类
    const { data: children } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('parent_id', categoryId)
      .limit(1)

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: '该分类下还有子分类，请先删除所有子分类' },
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