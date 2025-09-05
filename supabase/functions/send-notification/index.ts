import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@example.com'

interface SubmissionNotification {
  id: string
  title: string
  description: string
  url: string
  category: string
  submitted_by?: string
  created_at: string
}

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { record, type } = (await req.json()) as {
      record: SubmissionNotification
      type: 'INSERT' | 'UPDATE'
    }

    // 只处理新投稿和状态更新
    if (type !== 'INSERT' && type !== 'UPDATE') {
      return new Response('OK', { status: 200 })
    }

    let emailContent: string
    let subject: string

    if (type === 'INSERT') {
      // 新投稿通知管理员
      subject = `新投稿提醒 - ${record.title}`
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">📝 新投稿提醒</h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">${record.title}</h3>
            <p style="color: #6b7280;"><strong>分类：</strong> ${record.category}</p>
            <p style="color: #6b7280;"><strong>描述：</strong> ${record.description}</p>
            <p style="color: #6b7280;"><strong>链接：</strong> <a href="${record.url}" target="_blank">${record.url}</a></p>
            ${record.submitted_by ? `<p style="color: #6b7280;"><strong>提交者：</strong> ${record.submitted_by}</p>` : ''}
            <p style="color: #6b7280;"><strong>提交时间：</strong> ${new Date(record.created_at).toLocaleString('zh-CN')}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL')}/admin" 
               style="background: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              前往审核
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center;">
            这是来自 Jnu Wiki 投稿系统的自动通知
          </p>
        </div>
      `
    } else {
      // 状态更新暂时不发送邮件，可根据需要开启
      return new Response('OK', { status: 200 })
    }

    // 使用 Resend 发送邮件
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Jnu Wiki <noreply@yourdomain.com>',
        to: [ADMIN_EMAIL],
        subject: subject,
        html: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Email sending failed:', errorText)
      return new Response('Email sending failed', { status: 500 })
    }

    const result = await emailResponse.json()
    console.log('Email sent successfully:', result)

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
