import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here'

export class SimpleAdminAuth {
  /**
   * 验证管理员 token
   */
  static verifyToken(request: NextRequest): { isValid: boolean; admin?: unknown; error?: string } {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader) {
        return { isValid: false, error: '缺少认证头' }
      }

      const token = authHeader.replace('Bearer ', '')
      
      const decoded = jwt.verify(token, JWT_SECRET)
      
      return { isValid: true, admin: decoded }
    } catch {
      return { isValid: false, error: '无效的 token' }
    }
  }

  /**
   * 创建未授权响应
   */
  static createUnauthorizedResponse(message = '无访问权限') {
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}