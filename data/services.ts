import { CategoryConfig } from '@/types/services'

export const servicesConfig: CategoryConfig = {
  categories: [
    // 在这里添加你的分类数据
    // 参考下面的配置说明
    {
      id: '0',           // 唯一标识符
      name: '有关学习',             // 显示名称
      icon: '🎓',                 // emoji图标
      description: '学习内容、学习工具',      // 描述文字
      color: 'blue',              // 颜色主题（已废弃，保留兼容性）
      featured: true,            // 可选：是否为推荐分类
      services: [
        {
          id: '1',
          title: 'Ai-提效篇',
          description: '一些使用Ai提效的工具和个人心得',
          tags: ['Ai'],
          // image: '/path/to/image', // 使用默认图片
          href: 'https://example.com',
          status: 'active',
          featured: true
        },
      ]             // 该分类下的服务列表
    }
  ],
  
}