// 邮件服务集成

interface EmailData {
  to: string
  subject: string
  html: string
}

interface SubmissionEmailData {
  title: string
  description: string
  url: string
  category: string
  submittedBy?: string
  createdAt: string
}

// 使用 Resend 发送邮件
export async function sendEmail({ to, subject, html }: EmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Jnu Wiki <noreply@yourdomain.com>',
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Email API error: ${errorText}`)
    }

    const result = await response.json()
    return { success: true, id: result.id }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 新投稿通知模板
export function generateSubmissionNotificationEmail(data: SubmissionEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #1f2937; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📝 新投稿提醒</h1>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">${data.title}</h2>
          
          <div style="margin: 15px 0;">
            <p style="margin: 8px 0; color: #4b5563;">
              <strong style="color: #374151;">分类：</strong> 
              <span style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${data.category}</span>
            </p>
            <p style="margin: 8px 0; color: #4b5563;"><strong style="color: #374151;">描述：</strong> ${data.description}</p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong style="color: #374151;">链接：</strong> 
              <a href="${data.url}" target="_blank" style="color: #3b82f6; text-decoration: none;">${data.url}</a>
            </p>
            ${data.submittedBy ? `<p style="margin: 8px 0; color: #4b5563;"><strong style="color: #374151;">提交者：</strong> ${data.submittedBy}</p>` : ''}
            <p style="margin: 8px 0; color: #4b5563;"><strong style="color: #374151;">提交时间：</strong> ${new Date(data.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin" 
             style="background: #1f2937; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            🔍 前往审核
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
            这是来自 <strong>Jnu Wiki 投稿系统</strong> 的自动通知<br>
            如需取消通知，请联系系统管理员
          </p>
        </div>
      </div>
    </div>
  `
}

// 投稿状态更新通知模板
export function generateStatusUpdateEmail(data: SubmissionEmailData & { status: 'approved' | 'rejected', submitterEmail?: string }) {
  const statusText = data.status === 'approved' ? '已通过审核' : '审核未通过'
  const statusColor = data.status === 'approved' ? '#16a34a' : '#dc2626'
  const statusIcon = data.status === 'approved' ? '✅' : '❌'
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: ${statusColor}; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${statusIcon} 投稿审核结果</h1>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #f8fafc; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin-top: 0;">${data.title}</h2>
          <p style="color: ${statusColor}; font-weight: 500; font-size: 16px;">状态：${statusText}</p>
          
          ${data.status === 'approved' ? 
            '<p style="color: #16a34a;">🎉 恭喜！你的投稿已通过审核，将很快在平台上展示。</p>' :
            '<p style="color: #dc2626;">很抱歉，你的投稿未能通过审核。你可以修改后重新提交。</p>'
          }
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
            感谢你对 <strong>Jnu Wiki</strong> 的贡献！
          </p>
        </div>
      </div>
    </div>
  `
}