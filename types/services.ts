// Database types
export interface DatabaseService {
  id: string
  category_id: string
  title: string
  description: string | null
  tags: string[]
  image: string | null
  href: string | null
  status: 'active' | 'coming-soon' | 'maintenance'
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DatabaseCategory {
  id: string
  name: string
  icon: string | null
  description: string | null
  color: string
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
  services?: DatabaseService[]
}

// Frontend types (for compatibility)
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
  image?: string
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

// API types for CRUD operations
export interface CreateCategoryRequest {
  name: string
  icon?: string
  description?: string
  color?: string
  featured?: boolean
  sort_order?: number
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string
}

export interface CreateServiceRequest {
  category_id: string
  title: string
  description?: string
  tags?: string[]
  image?: string
  href?: string
  status?: 'active' | 'coming-soon' | 'maintenance'
  featured?: boolean
  sort_order?: number
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  id: string
}