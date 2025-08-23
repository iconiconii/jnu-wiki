export interface SubCard {
  id: string
  title: string
  description: string
  icon: string
  action?: () => void
  href?: string
  disabled?: boolean
  badge?: string
}

export interface Service {
  id: string
  title: string
  description: string
  tags: string[]
  image?: string // 可选字段，没有时使用默认图片
  href?: string
  children?: SubCard[]
  status?: 'active' | 'coming-soon' | 'maintenance'
  featured?: boolean
}

export interface ServiceCategory {
  id: string
  name: string
  icon: string
  description: string
  color: string
  services: Service[]
  featured?: boolean
}

export interface CategoryConfig {
  categories: ServiceCategory[]
}