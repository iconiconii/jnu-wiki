# Vercel 部署 + CI/CD 指南

## 🚀 部署步骤

### 1. 准备工作

**环境要求：**
- GitHub 账号
- Vercel 账号
- Supabase 生产环境项目

**文件检查：**
```bash
✅ vercel.json           # Vercel 配置
✅ .env.example          # 环境变量模板
✅ .github/workflows/    # CI/CD 工作流
✅ package.json         # 项目配置
```

### 2. Supabase 生产环境设置

1. **创建生产环境项目**：
   - 访问 https://app.supabase.com
   - 创建新项目（建议命名：`jnu-wiki-prod`）
   - 执行 `/supabase/schema.sql` 脚本创建表结构

2. **获取生产环境密钥**：
   - Project URL: `https://your-prod-id.supabase.co`
   - Anon Key: 从 Settings → API 获取
   - Service Role Key: 从 Settings → API 获取

### 3. Vercel 项目设置

1. **连接 GitHub**：
   - 访问 https://vercel.com
   - Import Git Repository
   - 选择你的 GitHub 仓库

2. **配置环境变量**：
   在 Vercel Dashboard → Settings → Environment Variables 添加：

   ```bash
   # 生产环境变量
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
   ADMIN_SECRET_KEY=YourSuperSecureProductionAdminKey2024!
   RATE_LIMIT_MAX_REQUESTS=2
   RATE_LIMIT_WINDOW_MS=1800000
   ```

3. **获取 Vercel 集成信息**：
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel
   
   # 登录并链接项目
   vercel login
   vercel link
   
   # 获取项目信息
   cat .vercel/project.json
   ```

### 4. GitHub Secrets 配置

在 GitHub 仓库 → Settings → Secrets and variables → Actions 添加：

```bash
# Vercel 集成
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id  
VERCEL_PROJECT_ID=your_project_id

# 可选：通知集成
DISCORD_WEBHOOK=your_discord_webhook_url
SLACK_WEBHOOK=your_slack_webhook_url
```

**获取 Vercel Token**：
1. 访问 https://vercel.com/account/tokens
2. 创建新 Token
3. 复制并添加到 GitHub Secrets

### 5. CI/CD 工作流详解

#### 开发环境检查 (`development.yml`)
**触发条件：**
- 推送到非主分支
- 创建 Pull Request

**执行内容：**
- ✅ ESLint 代码规范检查
- ✅ TypeScript 类型检查
- ✅ 构建测试
- ✅ Prettier 格式检查
- ✅ 安全漏洞扫描
- ✅ 依赖检查

#### 生产部署 (`deploy.yml`)
**触发条件：**
- 推送到 main/master 分支
- Pull Request 合并

**执行流程：**
1. **测试阶段**：运行所有质量检查
2. **预览部署**：PR 自动生成预览链接
3. **生产部署**：主分支自动部署到生产环境
4. **健康检查**：验证部署是否成功

### 6. 部署后验证

#### 自动验证
```bash
# API 健康检查
curl https://your-domain.vercel.app/api/submissions

# 预期响应: 405 Method Not Allowed (正常)
```

#### 手动验证清单
- [ ] 主页加载正常
- [ ] 投稿功能正常工作
- [ ] 管理员页面可访问
- [ ] 数据库连接正常
- [ ] 环境变量配置正确

### 7. 监控和维护

#### 内置监控
- **Vercel Analytics**: 自动启用
- **Function 日志**: Vercel Dashboard 查看
- **错误追踪**: 控制台日志

#### 建议的监控工具
```bash
# 可选集成
- Sentry (错误监控)
- LogRocket (用户行为)
- UptimeRobot (可用性监控)
```

#### 日常维护任务
- 定期检查 Vercel Function 日志
- 监控投稿数量和频率
- 定期备份 Supabase 数据
- 更新依赖包安全补丁

### 8. 故障排除

#### 常见问题

**1. 部署失败**
```bash
# 检查构建日志
vercel logs your-deployment-url

# 本地模拟生产构建
npm run build
```

**2. 环境变量问题**
```bash
# 验证环境变量
vercel env ls

# 添加缺失的变量
vercel env add VARIABLE_NAME
```

**3. API 路由问题**
```bash
# 检查 Function 日志
vercel functions logs

# 本地测试 API
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**4. 数据库连接问题**
- 检查 Supabase 项目状态
- 验证 RLS 策略配置
- 确认 API 密钥有效性

#### 回滚策略
```bash
# Vercel 快速回滚
vercel rollback

# 或通过 Dashboard 回滚到之前版本
```

### 9. 性能优化

#### Vercel 配置优化
```json
// vercel.json 优化选项
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10,        // 减少超时时间
      "memory": 1024           // 调整内存分配
    }
  }
}
```

#### 缓存策略
```javascript
// next.config.ts 缓存配置
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate' }
        ]
      }
    ]
  }
}
```

### 10. 扩展功能

#### 多环境部署
- **开发环境**: `dev-jnu-wiki.vercel.app`
- **预发布环境**: `staging-jnu-wiki.vercel.app`  
- **生产环境**: `jnu-wiki.vercel.app`

#### 自定义域名
1. Vercel Dashboard → Domains
2. 添加自定义域名
3. 配置 DNS 解析

#### 团队协作
- 邀请团队成员到 Vercel 项目
- 设置分支保护规则
- 配置代码审查流程

---

## 🔧 快速命令参考

```bash
# 本地开发
npm run dev

# 构建测试
npm run build

# 部署到 Vercel
vercel --prod

# 查看部署日志
vercel logs

# 环境变量管理
vercel env ls
vercel env add
vercel env rm

# 回滚部署
vercel rollback
```

## 📞 支持联系

如果遇到部署问题：
1. 查看 Vercel Dashboard 日志
2. 检查 GitHub Actions 执行状态
3. 参考本文档故障排除部分