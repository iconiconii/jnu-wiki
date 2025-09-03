import React, { useState, useMemo, useEffect } from 'react'
import { DatabaseCategory, Service } from '@/types/services'
import { CategoryCard } from './CategoryCard'
import { ServiceCard } from './ServiceCard'
import { BreadcrumbNav, BreadcrumbItem, buildBreadcrumbPath } from './BreadcrumbNav'
import { Button } from '@/components/ui/button'
import { Grid3X3, List, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HierarchicalServicesGridProps {
  categories: DatabaseCategory[]
  searchTerm?: string
  onServiceAccess?: (service: Service) => void
  defaultImage?: string
  className?: string
}

type ViewLevel = 'top' | 'campus' | 'section' | 'services'
type LayoutMode = 'grid' | 'list'

interface NavigationState {
  level: ViewLevel
  currentCategory: DatabaseCategory | null
  breadcrumbPath: BreadcrumbItem[]
  displayCategories: DatabaseCategory[]
  displayServices: Service[]
}

export function HierarchicalServicesGrid({ 
  categories, 
  searchTerm = '', 
  onServiceAccess,
  defaultImage,
  className
}: HierarchicalServicesGridProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid')
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'campus' | 'general'>('all')
  
  // Navigation state
  const [navState, setNavState] = useState<NavigationState>({
    level: 'top',
    currentCategory: null,
    breadcrumbPath: [],
    displayCategories: [],
    displayServices: []
  })

  // Filter categories based on search and type filter
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories
    }

    const searchLower = searchTerm.toLowerCase()
    return categories.filter(category => {
      // Check category name and description
      const categoryMatch = 
        category.name.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower)
      
      // Check services within category
      const servicesMatch = category.services?.some(service =>
        service.title.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower) ||
        service.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
      
      return categoryMatch || servicesMatch
    })
  }, [categories, searchTerm])

  // Get top-level categories (campus + general)
  const topLevelCategories = useMemo(() => {
    const filtered = filteredCategories.filter(cat => !cat.parent_id)
    
    if (typeFilter === 'all') {
      return filtered
    } else if (typeFilter === 'campus') {
      return filtered.filter(cat => cat.type === 'campus')
    } else {
      return filtered.filter(cat => cat.type === 'general')
    }
  }, [filteredCategories, typeFilter])

  // Get child categories for current parent
  const getChildCategories = useMemo(() => {
    return (parentId: string) => {
      return filteredCategories.filter(cat => cat.parent_id === parentId)
    }
  }, [filteredCategories])

  // Get services for current category
  const getCurrentServices = useMemo(() => {
    return (categoryId: string) => {
      const category = categories.find(cat => cat.id === categoryId)
      return category?.services || []
    }
  }, [categories])

  // Update navigation state based on current level
  useEffect(() => {
    let displayCategories: DatabaseCategory[] = []
    let displayServices: Service[] = []

    switch (navState.level) {
      case 'top':
        displayCategories = topLevelCategories
        break
      case 'campus':
        if (navState.currentCategory) {
          displayCategories = getChildCategories(navState.currentCategory.id)
        }
        break
      case 'section':
      case 'services':
        if (navState.currentCategory) {
          displayServices = getCurrentServices(navState.currentCategory.id)
        }
        break
    }

    setNavState(prev => ({
      ...prev,
      displayCategories,
      displayServices
    }))
  }, [navState.level, navState.currentCategory, topLevelCategories, getChildCategories, getCurrentServices])

  // Handle navigation
  const handleCategoryClick = (category: DatabaseCategory) => {
    const newPath = buildBreadcrumbPath(category, categories)
    
    if (category.type === 'campus') {
      // Navigate to campus sections
      setNavState({
        level: 'campus',
        currentCategory: category,
        breadcrumbPath: newPath,
        displayCategories: [],
        displayServices: []
      })
    } else if (category.type === 'section') {
      // Navigate to section services
      setNavState({
        level: 'services',
        currentCategory: category,
        breadcrumbPath: newPath,
        displayCategories: [],
        displayServices: []
      })
    } else if (category.type === 'general') {
      // Navigate to general services
      setNavState({
        level: 'services',
        currentCategory: category,
        breadcrumbPath: newPath,
        displayCategories: [],
        displayServices: []
      })
    }
  }

  const handleBreadcrumbNavigate = (item: BreadcrumbItem | null) => {
    if (!item) {
      // Navigate to home
      setNavState({
        level: 'top',
        currentCategory: null,
        breadcrumbPath: [],
        displayCategories: [],
        displayServices: []
      })
    } else {
      const category = categories.find(cat => cat.id === item.id)
      if (category) {
        handleCategoryClick(category)
      }
    }
  }

  const getViewTitle = () => {
    switch (navState.level) {
      case 'top':
        return searchTerm ? `搜索结果 (${topLevelCategories.length})` : '选择校区或通用服务'
      case 'campus':
        return `${navState.currentCategory?.name} - 选择篇章`
      case 'services':
        return `${navState.currentCategory?.name} - 服务列表`
      default:
        return '浏览服务'
    }
  }

  const showLayoutToggle = navState.level === 'services' && navState.displayServices.length > 0

  return (
    <div className={cn("space-y-6", className)}>
      {/* Navigation and controls */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        {navState.breadcrumbPath.length > 0 && (
          <BreadcrumbNav 
            path={navState.breadcrumbPath}
            onNavigate={handleBreadcrumbNavigate}
          />
        )}

        {/* View controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getViewTitle()}
            </h2>
            
            {navState.level === 'top' && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTypeFilter(!showTypeFilter)}
                  className="text-sm"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  筛选
                </Button>
                
                {showTypeFilter && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">全部</option>
                    <option value="campus">校区</option>
                    <option value="general">通用服务</option>
                  </select>
                )}
              </div>
            )}
          </div>

          {showLayoutToggle && (
            <div className="flex items-center space-x-2">
              <Button
                variant={layoutMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('grid')}
                className="p-2"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={layoutMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('list')}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div>
        {navState.displayCategories.length > 0 ? (
          // Show categories
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navState.displayCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={{
                  id: category.id,
                  name: category.name,
                  icon: category.icon || '',
                  description: category.description || '',
                  color: category.color,
                  services: category.services || [],
                  type: category.type,
                  featured: category.featured
                }}
                onClick={() => handleCategoryClick(category)}
                showServiceCount={true}
              />
            ))}
          </div>
        ) : navState.displayServices.length > 0 ? (
          // Show services
          <div className={cn(
            layoutMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          )}>
            {navState.displayServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onServiceAccess={onServiceAccess}
                defaultImage={defaultImage}
                className={layoutMode === 'list' ? 'flex flex-row items-center max-w-none' : ''}
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {navState.level === 'top' ? '🏠' : navState.level === 'campus' ? '📂' : '📦'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {navState.level === 'top' && searchTerm ? '没有找到相关内容' : 
               navState.level === 'campus' ? '该校区暂无篇章' :
               '该分类下暂无服务'}
            </h3>
            <p className="text-gray-600">
              {navState.level === 'top' && searchTerm ? '试试调整搜索关键词' : 
               '更多内容正在添加中，敬请期待！'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}