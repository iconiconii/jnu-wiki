import React, { useState, useMemo, useEffect } from 'react'
import { DatabaseCategory, Service } from '@/types/services'
import { CategoryCard } from './CategoryCard'
import { ServiceCard } from './ServiceCard'
import { BreadcrumbNav, BreadcrumbItem, buildBreadcrumbPath } from './BreadcrumbNav'
import { AnimatedPageTransition, AnimatedGrid, AnimatedBreadcrumb, AnimatedTitle } from './AnimatedPageTransition'
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

type NavigationDirection = 'forward' | 'backward'

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
  const [navigationDirection, setNavigationDirection] = useState<NavigationDirection>('forward')
  
  // Navigation state
  const [navState, setNavState] = useState<NavigationState>({
    level: 'top',
    currentCategory: null,
    breadcrumbPath: [],
    displayCategories: [],
    displayServices: []
  })

  // Enhanced search with cross-campus support and path display
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories
    }

    const searchLower = searchTerm.toLowerCase()
    const matchedCategories = categories.filter(category => {
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

    // For search results, also include parent categories to show full hierarchy
    const enrichedResults = [...matchedCategories]
    
    matchedCategories.forEach(category => {
      if (category.parent_id) {
        const parent = categories.find(cat => cat.id === category.parent_id)
        if (parent && !enrichedResults.some(cat => cat.id === parent.id)) {
          enrichedResults.push(parent)
        }
      }
    })

    return enrichedResults
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

  // Get category path for search results display
  const getCategoryPath = useMemo(() => {
    return (category: DatabaseCategory): string => {
      if (!category.parent_id) {
        return category.name
      }
      const parent = categories.find(cat => cat.id === category.parent_id)
      if (parent) {
        return `${parent.name} > ${category.name}`
      }
      return category.name
    }
  }, [categories])

  // Get all services matching search term across categories
  const getAllMatchingServices = useMemo(() => {
    if (!searchTerm.trim()) return []
    
    const searchLower = searchTerm.toLowerCase()
    const allServices: (Service & { categoryPath: string })[] = []
    
    categories.forEach(category => {
      if (category.services) {
        const matchingServices = category.services.filter(service =>
          service.title.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower) ||
          service.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        )
        
        matchingServices.forEach(service => {
          allServices.push({
            ...service,
            categoryPath: getCategoryPath(category)
          })
        })
      }
    })
    
    return allServices
  }, [categories, searchTerm, getCategoryPath])

  // Update navigation state based on current level
  useEffect(() => {
    let displayCategories: DatabaseCategory[] = []
    let displayServices: Service[] = []

    // In search mode, show global results at top level
    if (searchTerm && navState.level === 'top') {
      displayCategories = topLevelCategories
      // Don't show services at top level in search mode, let users navigate to categories
    } else {
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
    }

    setNavState(prev => ({
      ...prev,
      displayCategories,
      displayServices
    }))
  }, [navState.level, navState.currentCategory, topLevelCategories, getChildCategories, getCurrentServices, searchTerm])

  // Handle navigation
  const handleCategoryClick = (category: DatabaseCategory) => {
    const newPath = buildBreadcrumbPath(category, categories)
    setNavigationDirection('forward')
    
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
    setNavigationDirection('backward')
    
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
    if (searchTerm && navState.level === 'top') {
      const serviceCount = getAllMatchingServices.length
      const categoryCount = topLevelCategories.length
      return `搜索 "${searchTerm}" - 找到 ${categoryCount} 个分类, ${serviceCount} 个服务`
    }
    
    switch (navState.level) {
      case 'top':
        return '选择校区或通用服务'
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
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Navigation and controls */}
      <div className="space-y-3 sm:space-y-4">
        {/* Breadcrumb */}
        {navState.breadcrumbPath.length > 0 && (
          <AnimatedBreadcrumb>
            <BreadcrumbNav 
              path={navState.breadcrumbPath}
              onNavigate={handleBreadcrumbNavigate}
            />
          </AnimatedBreadcrumb>
        )}

        {/* View controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <AnimatedTitle>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                {getViewTitle()}
              </h2>
            </AnimatedTitle>
            
            {navState.level === 'top' && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTypeFilter(!showTypeFilter)}
                  className="text-xs sm:text-sm"
                >
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  筛选
                </Button>
                
                {showTypeFilter && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="text-xs sm:text-sm border rounded px-2 py-1"
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
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant={layoutMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('grid')}
                className="p-1.5 sm:p-2"
              >
                <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant={layoutMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('list')}
                className="p-1.5 sm:p-2"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content area with page transition animation */}
      <AnimatedPageTransition
        pageKey={`${navState.level}-${navState.currentCategory?.id || 'top'}-${searchTerm}`}
        direction={navigationDirection}
      >
        {/* Show all matching services in search mode at top level */}
        {searchTerm && navState.level === 'top' && getAllMatchingServices.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">🔍 所有匹配的服务</h3>
              <div className="text-sm text-muted-foreground">
                跨校区搜索结果
              </div>
            </div>
            <AnimatedGrid 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
              staggerDelay={0.05}
            >
              {getAllMatchingServices.map((service) => (
                <div key={service.id} className="space-y-2">
                  <div className="text-xs text-primary px-1 font-medium">
                    📍 {service.categoryPath}
                  </div>
                  <ServiceCard
                    service={service}
                    onServiceAccess={onServiceAccess}
                    defaultImage={defaultImage}
                  />
                </div>
              ))}
            </AnimatedGrid>
            {navState.displayCategories.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">📂 相关分类</h3>
              </div>
            )}
          </div>
        )}
        
        {navState.displayCategories.length > 0 ? (
          // Show categories with staggered animation
          <AnimatedGrid 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch"
            staggerDelay={0.1}
          >
            {navState.displayCategories.map((category) => (
              <div key={category.id} className="space-y-2 h-full flex flex-col">
                {/* Show path in search mode */}
                {searchTerm && category.parent_id && (
                  <div className="text-xs text-muted-foreground px-1">
                    📍 {getCategoryPath(category)}
                  </div>
                )}
                <div className="flex-grow">
                  <CategoryCard
                    category={{
                      id: category.id,
                      name: category.name,
                      icon: category.icon || '',
                      description: category.description || '',
                      color: category.color,
                      services: category.services || [],
                      type: category.type,
                      featured: category.featured,
                      children: category.children
                    }}
                    onClick={() => handleCategoryClick(category)}
                    showServiceCount={true}
                    showChildrenCount={category.type === 'campus'}
                  />
                </div>
              </div>
            ))}
          </AnimatedGrid>
        ) : navState.displayServices.length > 0 ? (
          // Show services with staggered animation
          <AnimatedGrid 
            className={cn(
              layoutMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
                : "space-y-3 sm:space-y-4"
            )}
            staggerDelay={0.05}
          >
            {navState.displayServices.map((service) => (
              <div key={service.id} className="space-y-2">
                {/* Show category path for services in search mode */}
                {searchTerm && navState.currentCategory && (
                  <div className="text-xs text-muted-foreground px-1">
                    📍 {getCategoryPath(navState.currentCategory)}
                  </div>
                )}
                <ServiceCard
                  service={service}
                  onServiceAccess={onServiceAccess}
                  defaultImage={defaultImage}
                  className={layoutMode === 'list' ? 'flex flex-row items-center max-w-none' : ''}
                />
              </div>
            ))}
          </AnimatedGrid>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {navState.level === 'top' ? '🏠' : navState.level === 'campus' ? '📂' : '📦'}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {navState.level === 'top' && searchTerm ? '没有找到相关内容' : 
               navState.level === 'campus' ? '该校区暂无篇章' :
               '该分类下暂无服务'}
            </h3>
            <p className="text-muted-foreground">
              {navState.level === 'top' && searchTerm ? '试试调整搜索关键词' : 
               '更多内容正在添加中，敬请期待！'}
            </p>
          </div>
        )}
      </AnimatedPageTransition>
    </div>
  )
}
