import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, generateFeedbackNotificationEmail } from '@/lib/email'
import { CreateFeedbackRequest, UpdateFeedbackRequest } from '@/types/feedback'
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

// 验证管理员权限
const verifyAdminAccess = (request: NextRequest): { authorized: boolean; error?: string } => {
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const jwtResult = verifyJWT(token)
    if (jwtResult.valid) {
      return { authorized: true }
    }
  }

  const { searchParams } = new URL(request.url)
  const adminKey = searchParams.get('admin_key')
  if (adminKey === process.env.ADMIN_SECRET_KEY) {
    return { authorized: true }
  }

  return { authorized: false, error: '无访问权限' }
}

// Rate limiting storage (生产环境应使用 Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const duplicateFeedbackMap = new Map<string, { timestamp: number; ip: string }>()

// 清理过期的限流记录
const cleanupRateLimit = () => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// 清理过期的防重复记录
const cleanupDuplicateFeedback = () => {
  const now = Date.now()
  const expirationTime = 10 * 60 * 1000 // 10分钟过期
  
  for (const [key, value] of duplicateFeedbackMap.entries()) {
    if (now - value.timestamp > expirationTime) {
      duplicateFeedbackMap.delete(key)
    }
  }
}

// 生成反馈指纹
const generateFeedbackFingerprint = (title: string, content: string, type: string): string => {
  return `${type}_${title.toLowerCase().trim()}_${content.toLowerCase().trim().slice(0, 200)}`
}

// 检查重复反馈
const checkDuplicateFeedback = (fingerprint: string): { isDuplicate: boolean; remainingTime?: number } => {
  cleanupDuplicateFeedback()
  
  const existing = duplicateFeedbackMap.get(fingerprint)
  if (!existing) {
    return { isDuplicate: false }
  }
  
  const now = Date.now()
  const timeSinceSubmission = now - existing.timestamp
  const cooldownTime = 10 * 60 * 1000 // 10分钟冷却时间
  
  if (timeSinceSubmission < cooldownTime) {
    return { 
      isDuplicate: true, 
      remainingTime: Math.ceil((cooldownTime - timeSinceSubmission) / 1000)
    }
  }
  
  return { isDuplicate: false }
}

// 检查频率限制 - 更严格的限流
const checkRateLimit = (ip: string): { allowed: boolean; resetTime?: number } => {
  cleanupRateLimit()
  
  const maxRequests = parseInt(process.env.FEEDBACK_RATE_LIMIT_MAX || '5') // 每小时最多5次
  const windowMs = parseInt(process.env.FEEDBACK_RATE_LIMIT_WINDOW || '3600000') // 1小时
  
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

// 内容验证和清理 - 更严格的安全防护
const sanitizeContent = (content: string): string => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim()
}

// 敏感词检查
const containsSensitiveWords = (text: string): boolean => {
  const sensitiveWords = [
    // 基础垃圾内容
    'spam', 'test123', 'aaaaaa', '测试测试测试',
    // 恶意内容标识
    'hack', 'crack', 'exploit', 'vulnerability',
    // 广告相关
    'promotion', 'discount', 'sale', 'buy now'
  ]
  
  const lowerText = text.toLowerCase()
  return sensitiveWords.some(word => lowerText.includes(word))
}

// 获取客户端 IP
const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIp) return cfConnectingIp
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  
  return 'unknown'
}

// POST 处理反馈提交
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    // 检查频率限制
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: '反馈提交过于频繁，请稍后再试',
          resetTime: rateLimitResult.resetTime 
        },
        { status: 429 }
      )
    }
    
    const body: CreateFeedbackRequest = await request.json()
    const { type, title, content, contact_info, page_url, browser_info } = body
    
    // 基础验证
    if (!type || !title || !content) {
      return NextResponse.json(
        { error: '请填写完整的反馈信息' },
        { status: 400 }
      )
    }
    
    // 长度验证
    if (title.length > 100) {
      return NextResponse.json(
        { error: '标题长度不能超过100字符' },
        { status: 400 }
      )
    }
    
    if (content.length > 1000) {
      return NextResponse.json(
        { error: '反馈内容长度不能超过1000字符' },
        { status: 400 }
      )
    }
    
    // 内容清理
    const cleanTitle = sanitizeContent(title)
    const cleanContent = sanitizeContent(content)
    const cleanContactInfo = contact_info ? sanitizeContent(contact_info) : null
    
    // 敏感词检查
    if (containsSensitiveWords(cleanTitle) || containsSensitiveWords(cleanContent)) {
      return NextResponse.json(
        { error: '反馈内容包含不当信息，请修改后重试' },
        { status: 400 }
      )
    }
    
    // 最小长度验证
    if (cleanTitle.length < 5 || cleanContent.length < 10) {
      return NextResponse.json(
        { error: '标题至少5个字符，内容至少10个字符' },
        { status: 400 }
      )
    }
    
    // 生成内容指纹用于防重复提交
    const contentFingerprint = generateFeedbackFingerprint(cleanTitle, cleanContent, type)
    
    // 检查重复提交
    const duplicateCheck = checkDuplicateFeedback(contentFingerprint)
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        { 
          error: `相似反馈已提交，请等待 ${duplicateCheck.remainingTime} 秒后再试`,
          remainingTime: duplicateCheck.remainingTime
        },
        { status: 429 }
      )
    }
    
    // 插入反馈数据
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        type,
        title: cleanTitle,
        content: cleanContent,
        contact_info: cleanContactInfo,
        user_agent: request.headers.get('user-agent'),
        page_url: page_url || null,
        browser_info: browser_info || null,
        priority: type === 'bug' ? 'high' : 'normal', // Bug默认高优先级
        submitted_ip: clientIP,
        status: 'open'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '提交失败，请稍后重试' },
        { status: 500 }
      )
    }
    
    // 记录成功提交的指纹
    duplicateFeedbackMap.set(contentFingerprint, {
      timestamp: Date.now(),
      ip: clientIP
    })
    
    // 异步发送邮件通知（不阻塞响应）
    if (process.env.ADMIN_EMAIL && process.env.RESEND_API_KEY) {
      // 开发测试：所有反馈都发邮件
      // 生产环境可改为条件判断
      if (true) {
        const emailHtml = generateFeedbackNotificationEmail({
          id: data.id,
          type: data.type,
          title: cleanTitle,
          content: cleanContent,
          priority: data.priority,
          contact_info: cleanContactInfo || undefined,
          page_url: page_url,
          created_at: data.created_at
        })

        console.log('Attempting to send email to:', process.env.ADMIN_EMAIL)
        sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `📝 新反馈 - ${cleanTitle}`,
          html: emailHtml
        }).then(result => {
          console.log('Email send result:', result)
        }).catch(error => {
          console.error('Email sending failed:', error)
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '反馈提交成功，我们会尽快处理',
      feedbackId: data.id
    })
    
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}

// GET 获取反馈列表（管理员用）
export async function GET(request: NextRequest) {
  try {
    const authResult = verifyAdminAccess(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabaseAdmin
      .from('feedback')
      .select('*', { count: 'exact' })
      .order('priority', { ascending: true }) // 按优先级排序
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '数据库错误' },
        { status: 500 }
      )
    }
    
    // 获取统计数据
    const { data: statsData } = await supabaseAdmin
      .rpc('get_feedback_stats')
    
    return NextResponse.json({
      feedback: data || [],
      total: count,
      limit,
      offset,
      stats: statsData
    })
    
  } catch (error) {
    console.error('Get feedback error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// PUT 更新反馈状态（管理员用）
export async function PUT(request: NextRequest) {
  try {
    const authResult = verifyAdminAccess(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      )
    }
    
    const body: UpdateFeedbackRequest = await request.json()
    const { id, status, priority, admin_reply, tags } = body
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少反馈ID' },
        { status: 400 }
      )
    }
    
    const updates: Partial<{
      status: string;
      priority: string;
      admin_reply: string | null;
      tags: string[];
      updated_at: string;
    }> = {}
    
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      updates.status = status
    }
    if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) {
      updates.priority = priority
    }
    if (admin_reply !== undefined) {
      updates.admin_reply = admin_reply ? sanitizeContent(admin_reply) : null
    }
    if (tags) {
      updates.tags = tags
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '没有有效的更新字段' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: '更新失败' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      feedback: data
    })
    
  } catch (error) {
    console.error('Update feedback error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}