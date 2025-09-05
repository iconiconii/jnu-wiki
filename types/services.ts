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
  rating: number | null // 评分字段，1-5星
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
  type: 'campus' | 'section' | 'general'
  parent_id: string | null
  level?: number
  path?: string[]
  created_at: string
  updated_at: string
  children?: DatabaseCategory[]
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
  rating?: number | null // 评分字段，1-5星
  category_id?: string
  created_at?: string
}

export interface ServiceCategory {
  id: string
  name: string
  icon: string
  description: string
  color: string
  type?: 'campus' | 'section' | 'general'
  parent_id?: string | null
  level?: number
  children?: ServiceCategory[]
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
  type: 'campus' | 'section' | 'general'
  parent_id?: string | null
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

// Hierarchy-related types
export interface CategoryTree extends DatabaseCategory {
  children: CategoryTree[]
}

export interface CategoryWithPath {
  category: DatabaseCategory
  path: DatabaseCategory[]
  fullPath: string
}

// API query parameters
export interface GetCategoriesParams {
  type?: 'campus' | 'section' | 'general'
  parent_id?: string | null
  include_children?: boolean
  include_services?: boolean
}

// Category hierarchy validation
export interface CategoryValidation {
  isValid: boolean
  errors: string[]
}

// Statistics types
export interface CategoryStats {
  total_categories: number
  campus_count: number
  section_count: number
  general_count: number
  services_by_category: Record<string, number>
}

// 筛选和排序相关类型
export type SortOption = 'newest' | 'rating_desc'

export interface ServiceQuery {
  // 搜索
  search?: string
  // 分类筛选
  category?: string
  // 标签筛选（逗号分隔）
  tags?: string
  // 评分下限
  ratingMin?: number
  // 排序方式
  sort?: SortOption
  // 分页参数
  page?: number
  limit?: number
}

export interface ServiceQueryParams {
  search?: string
  category?: string
  tags?: string
  ratingMin?: string
  sort?: SortOption
  page?: string
  limit?: string
}

export interface ServiceListResponse {
  items: Service[]
  page: number
  limit: number
  total: number
}

export interface FilterState {
  search: string
  category: string
  tags: string[]
  ratingMin: number | null
  sort: SortOption
  page: number
  limit: number
}
