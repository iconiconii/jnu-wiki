import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 测试数据库连接和基本查询
export async function GET() {
  try {
    // 测试基本连接
    const { data: tables, error: tablesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1)

    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: tablesError
      }, { status: 500 })
    }

    // 获取表统计
    const [categoriesResult, servicesResult] = await Promise.allSettled([
      supabase.from('categories').select('*', { count: 'exact' }),
      supabase.from('services').select('*', { count: 'exact' })
    ])

    const categoriesCount = categoriesResult.status === 'fulfilled' ? categoriesResult.value.count : 0
    const servicesCount = servicesResult.status === 'fulfilled' ? servicesResult.value.count : 0

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      stats: {
        categories: categoriesCount,
        services: servicesCount,
        sampleData: tables
      }
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}