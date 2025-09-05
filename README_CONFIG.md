# 📋 服务配置说明

## 数据配置文件位置

`/data/services.ts` - 主要的服务配置文件

## 配置结构说明

### 1. 分类配置 (ServiceCategory)

```typescript
{
  id: 'category-id',           // 唯一标识符
  name: '分类名称',             // 显示名称
  icon: '🎓',                 // emoji图标
  description: '分类描述',      // 描述文字
  color: 'blue',              // 颜色主题（已废弃，保留兼容性）
  featured?: true,            // 可选：是否为推荐分类
  services: [...]             // 该分类下的服务列表
}
```

### 2. 服务配置 (Service)

```typescript
{
  id: 'service-id',           // 唯一标识符
  title: '服务名称',           // 显示名称
  description: '服务描述',     // 描述文字
  tags: ['标签1', '标签2'],    // 标签数组
  image: '/path/to/image',    // 图片路径
  href: 'https://...',       // 外部链接
  status: 'active',          // 状态：'active' | 'coming-soon' | 'maintenance'
  featured?: true            // 可选：是否为推荐服务
}
```

## 配置示例

```typescript
export const servicesConfig: CategoryConfig = {
  categories: [
    {
      id: 'academic',
      name: '学术工具',
      icon: '🎓',
      description: '学习和研究相关的智能工具',
      color: 'blue',
      featured: true,
      services: [
        {
          id: 'ai-assistant',
          title: 'AI助手',
          description: '智能学术支持系统，帮助学习和研究',
          tags: ['AI', '学术', '辅助'],
          image: '/images/ai-assistant.png',
          href: 'https://ai.example.com',
          status: 'active',
          featured: true,
        },
        {
          id: 'course-planner',
          title: '课程规划',
          description: '帮助规划和安排学术课程',
          tags: ['课程', '规划', '学习'],
          // image: '/images/course-planner.png', // 可以省略，会使用默认图片
          href: 'https://courses.example.com',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'resources',
      name: '学习资源',
      icon: '📚',
      description: '图书馆和学习资源平台',
      color: 'green',
      services: [
        {
          id: 'library',
          title: '数字图书馆',
          description: '访问数字图书和研究资源',
          tags: ['图书馆', '书籍', '研究'],
          image: '/images/library.png',
          href: 'https://library.example.com',
          status: 'active',
        },
      ],
    },
  ],
}
```

## 状态说明

- `active`: 正常运行，显示"访问服务"按钮
- `coming-soon`: 即将推出，显示"即将上线"按钮
- `maintenance`: 维护中，显示"系统维护中"按钮，卡片变灰

## 图片配置

1. 将图片放在 `public/images/` 目录下
2. 在配置中使用相对路径：`/images/your-image.png`
3. 推荐图片尺寸：320x160px 或 2:1 比例
4. 支持格式：PNG, JPG, SVG

### 默认图片

- 如果服务没有配置 `image` 字段或字段为空，系统会自动使用默认图片
- 默认图片路径：`/images/default-service.svg`
- 你可以替换这个文件来自定义默认图片，或在组件中配置其他默认图片

## 图标选择

建议使用合适的 emoji 图标：

- 学术：🎓 📚 🔬 📖 ✏️
- 工具：🛠️ ⚙️ 🔧 💻 📱
- 资源：📁 📋 📊 💾 🗂️
- 社交：👥 💬 🤝 📢 🌐

## 配置完成后

修改 `/data/services.ts` 文件后，开发服务器会自动重新加载，无需手动重启。

## 注意事项

1. 所有 `id` 必须唯一
2. `href` 为空或 `#` 时点击无效果
3. 描述建议控制在 50 字以内，避免换行影响布局
4. 标签建议 2-4 个，过多会影响显示效果
