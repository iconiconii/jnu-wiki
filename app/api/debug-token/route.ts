import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({
        error: '请提供token',
        debug: {
          JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
          JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
          JWT_SECRET_PREVIEW: process.env.JWT_SECRET?.substring(0, 10) + '...'
        }
      }, { status: 400 })
    }

    try {
      // 尝试解码token（不验证签名）
      const decoded = jwt.decode(token, { complete: true })
      
      // 尝试验证token
      const verified = jwt.verify(token, JWT_SECRET)
      
      return NextResponse.json({
        success: true,
        token_info: {
          header: decoded?.header,
          payload: decoded?.payload,
          verified: !!verified,
          current_time: Math.floor(Date.now() / 1000),
          exp: decoded?.payload && typeof decoded.payload === 'object' && 'exp' in decoded.payload ? decoded.payload.exp : null
        },
        debug: {
          JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
          JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
          JWT_SECRET_PREVIEW: process.env.JWT_SECRET?.substring(0, 10) + '...'
        }
      })
      
    } catch (verifyError) {
      // 只解码，不验证
      const decoded = jwt.decode(token, { complete: true })
      
      return NextResponse.json({
        success: false,
        error: verifyError instanceof Error ? verifyError.message : '验证失败',
        token_info: {
          header: decoded?.header,
          payload: decoded?.payload,
          verified: false,
          current_time: Math.floor(Date.now() / 1000),
          exp: decoded?.payload && typeof decoded.payload === 'object' && 'exp' in decoded.payload ? decoded.payload.exp : null
        },
        debug: {
          JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
          JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
          JWT_SECRET_PREVIEW: process.env.JWT_SECRET?.substring(0, 10) + '...'
        }
      })
    }
    
  } catch (error) {
    return NextResponse.json({
      error: '服务器错误',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
        JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
        JWT_SECRET_PREVIEW: process.env.JWT_SECRET?.substring(0, 10) + '...'
      }
    }, { status: 500 })
  }
}