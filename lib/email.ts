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

interface FeedbackEmailData {
  id: string
  type: 'bug' | 'feature' | 'improvement' | 'other'
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  contact_info?: string
  page_url?: string
  created_at: string
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
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
export function generateStatusUpdateEmail(
  data: SubmissionEmailData & { status: 'approved' | 'rejected'; submitterEmail?: string }
) {
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
          
          ${
            data.status === 'approved'
              ? '<p style="color: #16a34a;">🎉 恭喜！你的投稿已通过审核，将很快在平台上展示。</p>'
              : '<p style="color: #dc2626;">很抱歉，你的投稿未能通过审核。你可以修改后重新提交。</p>'
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

// 反馈通知邮件模板
export function generateFeedbackNotificationEmail(data: FeedbackEmailData) {
  const typeConfig = {
    bug: { label: 'Bug报告', icon: '🐛', color: '#dc2626' },
    feature: { label: '功能建议', icon: '💡', color: '#3b82f6' },
    improvement: { label: '体验改进', icon: '⚡', color: '#f59e0b' },
    other: { label: '其他反馈', icon: '💭', color: '#6b7280' },
  }

  const priorityConfig = {
    low: { label: '低优先级', color: '#6b7280' },
    normal: { label: '普通', color: '#3b82f6' },
    high: { label: '高优先级', color: '#f59e0b' },
    urgent: { label: '紧急', color: '#dc2626' },
  }

  const type = typeConfig[data.type]
  const priority = priorityConfig[data.priority]

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: ${type.color}; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${type.icon} 新的${type.label}</h1>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #f8fafc; border-left: 4px solid ${type.color}; padding: 20px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">${data.title}</h2>
          
          <div style="margin: 15px 0;">
            <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
              <span style="background: ${type.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                ${type.label}
              </span>
              <span style="background: ${priority.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                ${priority.label}
              </span>
            </div>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0;">
              <p style="margin: 0; color: #374151; line-height: 1.6;">${data.content}</p>
            </div>
            
            ${
              data.page_url
                ? `
            <p style="margin: 8px 0; color: #4b5563;">
              <strong style="color: #374151;">页面：</strong> 
              <a href="${data.page_url}" target="_blank" style="color: #3b82f6; text-decoration: none;">${data.page_url}</a>
            </p>
            `
                : ''
            }
            
            ${
              data.contact_info
                ? `
            <p style="margin: 8px 0; color: #4b5563;">
              <strong style="color: #374151;">联系方式：</strong> ${data.contact_info}
            </p>
            `
                : ''
            }
            
            <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">
              <strong>反馈时间：</strong> ${new Date(data.created_at).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/feedback" 
             style="background: ${type.color}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            🔍 查看反馈详情
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
            这是来自 <strong>Jnu Wiki 反馈系统</strong> 的自动通知<br>
            反馈ID: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${data.id}</code>
          </p>
        </div>
      </div>
    </div>
  `
}

// 批量反馈汇总邮件模板
export function generateFeedbackBatchEmail(feedbacks: FeedbackEmailData[]) {
  const byType = feedbacks.reduce(
    (acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const urgentCount = feedbacks.filter(f => f.priority === 'urgent' || f.priority === 'high').length

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #1f2937; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 反馈汇总报告</h1>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin-top: 0;">本次汇总统计</h2>
          
          <div style="margin: 15px 0;">
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>总反馈数：</strong> ${feedbacks.length} 条
            </p>
            ${
              urgentCount > 0
                ? `
            <p style="margin: 8px 0; color: #dc2626;">
              <strong>⚠️ 高优先级：</strong> ${urgentCount} 条
            </p>
            `
                : ''
            }
            
            <div style="margin-top: 15px;">
              <strong style="color: #374151;">分类统计：</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${Object.entries(byType)
                  .map(([type, count]) => {
                    const typeLabels = {
                      bug: '🐛 Bug报告',
                      feature: '💡 功能建议',
                      improvement: '⚡ 体验改进',
                      other: '💭 其他反馈',
                    }
                    return `<li style="margin: 5px 0; color: #4b5563;">${typeLabels[type as keyof typeof typeLabels] || type}: ${count} 条</li>`
                  })
                  .join('')}
              </ul>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/feedback" 
             style="background: #1f2937; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            📋 查看所有反馈
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
            这是来自 <strong>Jnu Wiki 反馈系统</strong> 的定期汇总报告<br>
            汇总时间: ${new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      </div>
    </div>
  `
}
