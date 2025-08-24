import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, generateSubmissionNotificationEmail } from '@/lib/email'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here'

// JWT 验证函数
const verifyJWT = (token: string): { valid: boolean; payload?: jwt.JwtPayload | string } => {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}

// 验证管理员权限（支持两种方式：JWT token 或 admin_key）
const verifyAdminAccess = (request: NextRequest): { authorized: boolean; error?: string } => {
  // 首先检查 Authorization header 中的 JWT token
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const jwtResult = verifyJWT(token)
    if (jwtResult.valid) {
      return { authorized: true }
    }
  }

  // 然后检查 URL 参数中的 admin_key（向后兼容）
  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('admin_key')
  if (adminKey === process.env.ADMIN_SECRET_KEY) {
    return { authorized: true }
  }

  return { authorized: false, error: '无访问权限' }
}

// Rate limiting storage (在生产环境中应该使用 Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// 防重复提交存储 - 基于内容指纹
const duplicateSubmissionMap = new Map<string, { timestamp: number; ip: string }>()

// 清理过期的限流记录
const cleanupRateLimit = () => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// 清理过期的防重复提交记录
const cleanupDuplicateSubmissions = () => {
  const now = Date.now()
  const expirationTime = 5 * 60 * 1000 // 5分钟过期
  
  for (const [key, value] of duplicateSubmissionMap.entries()) {
    if (now - value.timestamp > expirationTime) {
      duplicateSubmissionMap.delete(key)
    }
  }
}

// 生成提交指纹
const generateSubmissionFingerprint = (title: string, url: string, description: string): string => {
  return `${title.toLowerCase().trim()}_${url.toLowerCase().trim()}_${description.toLowerCase().trim().slice(0, 100)}`
}

// 检查重复提交
const checkDuplicateSubmission = (fingerprint: string): { isDuplicate: boolean; remainingTime?: number } => {
  cleanupDuplicateSubmissions()
  
  const existing = duplicateSubmissionMap.get(fingerprint)
  if (!existing) {
    return { isDuplicate: false }
  }
  
  const now = Date.now()
  const timeSinceSubmission = now - existing.timestamp
  const cooldownTime = 5 * 60 * 1000 // 5分钟冷却时间
  
  if (timeSinceSubmission < cooldownTime) {
    return { 
      isDuplicate: true, 
      remainingTime: Math.ceil((cooldownTime - timeSinceSubmission) / 1000)
    }
  }
  
  return { isDuplicate: false }
}

// 检查频率限制
const checkRateLimit = (ip: string): { allowed: boolean; resetTime?: number } => {
  cleanupRateLimit()
  
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5')
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') // 15 minutes
  
  const now = Date.now()
  const existing = rateLimitMap.get(ip)
  
  if (!existing) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }
  
  if (now > existing.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }
  
  if (existing.count >= maxRequests) {
    return { allowed: false, resetTime: existing.resetTime }
  }
  
  existing.count++
  return { allowed: true }
}

// 内容验证和清理
const sanitizeContent = (content: string): string => {
  // 移除潜在的 XSS 内容
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// URL 验证
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

// 敏感词检查（基础版本）
const containsSensitiveWords = (text: string): boolean => {
  const sensitiveWords = [
    // 这里可以添加需要过滤的敏感词
    'spam', 'test123', 'example.com'
  ]
  
  const lowerText = text.toLowerCase()
  return sensitiveWords.some(word => lowerText.includes(word))
}

// 获取客户端 IP
const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  
  // NextRequest doesn't have ip property, fallback to unknown
  return 'unknown'
}

// POST 处理投稿
export async function POST(request: NextRequest) {
  try {
    // 获取客户端 IP
    const clientIP = getClientIP(request)
    
    // 检查频率限制
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: '提交过于频繁，请稍后再试',
          resetTime: rateLimitResult.resetTime 
        },
        { status: 429 }
      )
    }
    
    // 解析请求数据
    const body = await request.json()
    const { category, title, description, url, submittedBy } = body
    
    // 基础验证
    if (!category || !title || !description || !url) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }
    
    // URL 验证
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: '无效的 URL 地址' },
        { status: 400 }
      )
    }
    
    // 长度验证
    if (title.length > 100 || description.length > 500) {
      return NextResponse.json(
        { error: '内容长度超出限制' },
        { status: 400 }
      )
    }
    
    // 内容清理
    const cleanTitle = sanitizeContent(title)
    const cleanDescription = sanitizeContent(description)
    const cleanSubmittedBy = submittedBy ? sanitizeContent(submittedBy) : null
    
    // 敏感词检查
    if (containsSensitiveWords(cleanTitle) || containsSensitiveWords(cleanDescription)) {
      return NextResponse.json(
        { error: '内容包含不当信息，请修改后重试' },
        { status: 400 }
      )
    }
    
    // 生成内容指纹用于防重复提交
    const contentFingerprint = generateSubmissionFingerprint(cleanTitle, url, cleanDescription)
    
    // 检查重复提交
    const duplicateCheck = checkDuplicateSubmission(contentFingerprint)
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        { 
          error: `相似内容已经提交，请等待 ${duplicateCheck.remainingTime} 秒后再试`,
          remainingTime: duplicateCheck.remainingTime
        },
        { status: 429 }
      )
    }
    
    // 检查重复提交（相同标题和URL）
    const { data: existing } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .or(`title.eq.${cleanTitle},url.eq.${url}`)
      .limit(1)
    
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: '该资源已经存在，请勿重复提交' },
        { status: 409 }
      )
    }
    
    // 插入投稿数据
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        category,
        title: cleanTitle,
        description: cleanDescription,
        url,
        submitted_by: cleanSubmittedBy,
        submitted_ip: clientIP,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '数据库错误，请稍后重试' },
        { status: 500 }
      )
    }
    
    // 记录成功提交的指纹，防止短时间内重复提交
    duplicateSubmissionMap.set(contentFingerprint, {
      timestamp: Date.now(),
      ip: clientIP
    })
    
    // 发送邮件通知管理员（异步，不阻塞响应）
    if (process.env.ADMIN_EMAIL && process.env.RESEND_API_KEY) {
      const emailHtml = generateSubmissionNotificationEmail({
        title: cleanTitle,
        description: cleanDescription,
        url: url,
        category: category,
        submittedBy: cleanSubmittedBy || undefined,
        createdAt: data.created_at
      })

      // 异步发送邮件，不等待结果
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `新投稿提醒 - ${cleanTitle}`,
        html: emailHtml
      }).catch(error => {
        console.error('邮件发送失败:', error)
      })
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '投稿提交成功，等待审核',
      submissionId: data.id
    })
    
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}

// GET 获取投稿列表（管理员用）
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = verifyAdminAccess(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabaseAdmin
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status !== 'all') {
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
      submissions: data || [],
      total: count,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// PUT 更新投稿状态（管理员用）
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = verifyAdminAccess(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { id, status } = body
    
    if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '无效的参数' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '数据库错误' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      submission: data
    })
    
  } catch (error) {
    console.error('Update submission error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}