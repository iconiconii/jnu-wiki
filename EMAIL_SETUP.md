# 📧 邮件通知系统配置指南

## 概述

投稿系统支持两种邮件通知方式：
1. **Next.js API 集成** - 简单直接，推荐使用
2. **Supabase Edge Functions** - 服务器端触发，更高级

## 🚀 快速配置（推荐）

### 1. 注册 Resend 邮件服务

1. 访问 https://resend.com 注册账号
2. 验证域名（可选，免费版可用 resend.dev 域名）
3. 获取 API Key

### 2. 配置环境变量

在 `.env.local` 中添加：

```bash
# 邮件配置
RESEND_API_KEY=re_your_api_key_here
ADMIN_EMAIL=your-email@example.com
EMAIL_FROM=Jnu Wiki <noreply@yourdomain.com>
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 3. 测试邮件功能

```bash
# 启动开发服务器
npm run dev

# 提交一个测试投稿
# 检查控制台是否有邮件发送日志
```

## ✨ 功能特性

### 自动通知场景
- ✅ **新投稿提醒** - 用户提交投稿时立即通知管理员
- 🔄 **状态更新** - 投稿审核结果通知（可选）
- 📊 **批量通知** - 定期汇总报告（可扩展）

### 邮件模板
- **响应式设计** - 在各种邮件客户端正常显示
- **品牌一致性** - 使用项目配色和样式
- **信息完整** - 包含投稿详情和快捷操作链接

## 🛠️ 高级配置

### 方案1：Next.js API 集成（当前实现）

**工作流程**：
```
用户提交投稿 → API 验证 → 存储到数据库 → 异步发送邮件 → 返回成功
```

**优势**：
- 实现简单，易于调试
- 支持自定义邮件模板
- 不阻塞用户响应
- 错误处理灵活

### 方案2：Supabase Edge Functions

**工作流程**：
```
数据库插入 → 触发器 → Edge Function → 发送邮件
```

**优势**：
- 完全服务器端执行
- 与数据库深度集成
- 支持复杂业务逻辑
- 高并发处理能力

#### Edge Functions 部署步骤

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接项目
supabase link --project-ref your-project-id

# 部署函数
supabase functions deploy send-notification

# 设置环境变量
supabase secrets set RESEND_API_KEY=your_key
supabase secrets set ADMIN_EMAIL=your_email
```

## 📧 邮件服务商选择

### Resend（推荐）
- **免费额度**: 3000 邮件/月
- **特点**: 专为开发者设计，API 简单
- **价格**: $20/月起
- **域名**: 支持自定义域名

### 其他选择
- **SendGrid**: 企业级，100 邮件/天免费
- **Mailgun**: 灵活定价，5000 邮件/月免费
- **Amazon SES**: 按量付费，成本最低

## 🔧 自定义配置

### 邮件模板自定义

编辑 `/lib/email.ts` 中的模板函数：

```typescript
export function generateSubmissionNotificationEmail(data: SubmissionEmailData) {
  return `
    <!-- 自定义HTML模板 -->
    <div style="your-custom-styles">
      <!-- 邮件内容 -->
    </div>
  `
}
```

### 添加更多通知类型

```typescript
// 新增通知类型
export function generateWeeklyReportEmail(stats: WeeklyStats) {
  // 周报邮件模板
}

// 在API中调用
if (shouldSendWeeklyReport()) {
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: '投稿系统周报',
    html: generateWeeklyReportEmail(weeklyStats)
  })
}
```

### 多收件人配置

```bash
# 支持多个管理员邮箱
ADMIN_EMAIL=admin1@example.com,admin2@example.com,admin3@example.com
```

```typescript
// 解析多个邮箱
const adminEmails = process.env.ADMIN_EMAIL?.split(',') || []
for (const email of adminEmails) {
  await sendEmail({ to: email.trim(), subject, html })
}
```

## 🚨 故障排除

### 常见问题

1. **邮件发送失败**
   ```bash
   # 检查 API Key 是否有效
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"from":"test@resend.dev","to":"test@example.com","subject":"Test","html":"Hello"}'
   ```

2. **邮件进入垃圾箱**
   - 验证发送域名
   - 添加 SPF/DKIM 记录
   - 避免垃圾邮件关键词

3. **发送频率限制**
   - Resend: 10 邮件/秒
   - 实现发送队列避免限制

### 调试模式

```bash
# 开发环境详细日志
DEBUG_EMAIL=true npm run dev

# 邮件预览模式（不实际发送）
EMAIL_PREVIEW_MODE=true npm run dev
```

## 📊 监控和分析

### 发送统计
- 在 Resend Dashboard 查看发送统计
- 监控邮件打开率和点击率
- 设置送达失败告警

### 日志记录
```typescript
// 扩展日志记录
console.log(`📧 Email sent: ${result.id} to ${to}`)
console.log(`📊 Stats: ${stats.sent}/${stats.total} emails sent today`)
```

## 🔒 安全考虑

### API Key 安全
- 使用环境变量存储
- 定期轮换 API Key
- 限制 API Key 权限

### 邮件内容安全
- 过滤用户输入内容
- 防止 XSS 攻击
- 验证收件人邮箱格式

### 频率控制
```typescript
// 防止邮件轰炸
const emailRateLimit = new Map()
const canSendEmail = (ip: string) => {
  const now = Date.now()
  const lastSent = emailRateLimit.get(ip) || 0
  if (now - lastSent < 60000) { // 1分钟限制
    return false
  }
  emailRateLimit.set(ip, now)
  return true
}
```

## 📈 性能优化

### 异步处理
- 邮件发送不阻塞用户响应
- 使用队列处理大量邮件
- 错误重试机制

### 批量发送
```typescript
// 批量发送优化
const batchSendEmails = async (emails: EmailData[]) => {
  const chunks = chunkArray(emails, 10) // 每次10封
  for (const chunk of chunks) {
    await Promise.all(chunk.map(sendEmail))
    await new Promise(resolve => setTimeout(resolve, 1000)) // 防止频率限制
  }
}
```

---

配置完成后，你的投稿系统将具备完整的邮件通知功能！🎉