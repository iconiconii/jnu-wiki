# 投稿系统使用指南

## 功能概述

投稿系统让用户可以提交新的学习资源和工具，经管理员审核后展示在平台上。

### 主要功能

- **用户投稿**: 简单的4字段表单 (分类、标题、描述、URL)
- **安全防护**: 频率限制、内容过滤、人机验证
- **管理审核**: 管理员界面审核投稿
- **状态追踪**: 待审核、已通过、已拒绝状态

## 配置步骤

### 1. Supabase 配置

1. 创建 Supabase 项目: https://app.supabase.com
2. 在 SQL Editor 中执行 `/supabase/schema.sql` 中的 SQL 脚本
3. 获取项目 URL 和 API 密钥

### 2. 环境变量配置

在 `.env.local` 文件中配置以下变量:

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# 频率限制 (可选，有默认值)
RATE_LIMIT_MAX_REQUESTS=5          # 15分钟内最多5次投稿
RATE_LIMIT_WINDOW_MS=900000        # 15分钟窗口期

# 管理员密钥
ADMIN_SECRET_KEY=your_admin_secret_key_here
```

### 3. 安装依赖

```bash
npm install @supabase/supabase-js
```

## 使用说明

### 用户投稿流程

1. 点击导航栏的 "投稿" 按钮
2. 填写表单:
   - **分类**: 从现有分类中选择
   - **标题**: 资源名称 (最多100字符)
   - **描述**: 简要介绍 (最多500字符)
   - **URL**: 资源链接地址
   - **提交者信息**: 可选的联系方式
3. 完成人机验证 (简单数学题)
4. 提交等待审核

### 管理员审核流程

1. 访问 `/admin` 页面
2. 输入管理员密钥登录
3. 查看投稿列表和统计数据
4. 对每个投稿进行审核:
   - **通过**: 投稿将被标记为已通过
   - **拒绝**: 投稿将被标记为已拒绝
5. 可按状态过滤查看不同类型的投稿

## 安全特性

### 频率限制

- 同一IP地址30分钟内最多提交5次投稿
- 可通过环境变量调整限制参数

### 内容过滤

- 自动过滤 XSS 攻击脚本
- 移除潜在危险的 HTML 标签
- 基础敏感词检查

### URL 验证

- 验证URL格式有效性
- 只允许 http/https 协议

### 重复检查

- 防止相同标题或URL的重复提交
- 数据库级别的重复检查

### 人机验证

- 简单数学题验证
- 防止自动化批量提交

## API 接口

### POST /api/submissions

提交新投稿

**请求体:**

```json
{
  "category": "分类名称",
  "title": "资源标题",
  "description": "资源描述",
  "url": "https://example.com",
  "submittedBy": "提交者信息(可选)"
}
```

### GET /api/submissions?admin_key=xxx

获取投稿列表 (管理员专用)

**参数:**

- `admin_key`: 管理员密钥 (必需)
- `status`: 状态过滤 (pending/approved/rejected/all)
- `limit`: 分页大小 (默认50)
- `offset`: 分页偏移 (默认0)

### PUT /api/submissions?admin_key=xxx

更新投稿状态 (管理员专用)

**请求体:**

```json
{
  "id": "投稿ID",
  "status": "approved" // approved/rejected
}
```

## 数据库表结构

### submissions 表

- `id`: UUID 主键
- `category`: 分类
- `title`: 标题
- `description`: 描述
- `url`: 链接地址
- `status`: 状态 (pending/approved/rejected)
- `submitted_by`: 提交者信息
- `submitted_ip`: 提交者IP
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 故障排除

### 常见问题

1. **投稿提交失败**
   - 检查 Supabase 连接配置
   - 验证环境变量是否正确设置
   - 查看浏览器控制台错误信息

2. **管理员页面无法访问**
   - 确认 `ADMIN_SECRET_KEY` 环境变量已设置
   - 检查密钥是否输入正确

3. **频率限制问题**
   - 调整 `RATE_LIMIT_MAX_REQUESTS` 和 `RATE_LIMIT_WINDOW_MS`
   - 在生产环境建议使用 Redis 替代内存存储

4. **Supabase 权限问题**
   - 确认 Row Level Security 策略配置正确
   - 检查 API 密钥权限设置

### 生产环境建议

1. **使用 Redis 进行频率限制**
2. **设置更强的管理员密钥**
3. **配置更严格的敏感词过滤**
4. **启用 HTTPS 强制跳转**
5. **配置监控和日志记录**

## 扩展功能

可以考虑的未来增强功能:

- 邮件通知系统
- 投稿分类建议
- 批量导入/导出
- 投稿统计分析
- 用户积分系统
