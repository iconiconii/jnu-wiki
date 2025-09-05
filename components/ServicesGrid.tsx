import React, { useState, useMemo } from 'react'
import { Service, ServiceCategory } from '@/types/services'
import { CategoryCard } from './CategoryCard'
import { ServiceCard } from './ServiceCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Grid3X3, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServicesGridProps {
  categories: ServiceCategory[]
  searchTerm?: string
  onServiceAccess?: (service: Service) => void
  defaultImage?: string
}

type ViewMode = 'categories' | 'services'
type LayoutMode = 'grid' | 'list'

export function ServicesGrid({ 
  categories, 
  searchTerm = '', 
  onServiceAccess,
  defaultImage
}: ServicesGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('categories')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid')
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)

  // Filter categories and services based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return { categories, services: [] }
    }

    const searchLower = searchTerm.toLowerCase()
    const filteredCategories = categories.map(category => ({
      ...category,
      services: category.services.filter(service =>
        service.title.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        service.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    })).filter(category => category.services.length > 0)

    const allFilteredServices = filteredCategories.flatMap(category => 
      category.services.map(service => ({ ...service, categoryName: category.name }))
    )

    return {
      categories: filteredCategories,
      services: allFilteredServices
    }
  }, [categories, searchTerm])

  const handleCategoryClick = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setViewMode('services')
  }

  const handleBackToCategories = () => {
    setViewMode('categories')
    setSelectedCategory(null)
  }

  // Get current services to display
  const currentServices = viewMode === 'categories' 
    ? []
    : selectedCategory 
      ? selectedCategory.services 
      : filteredData.services

  const currentCategories = viewMode === 'categories' 
    ? (searchTerm ? filteredData.categories : categories)
    : []

  // Show search results as services if searching
  const showingSearchResults = searchTerm.trim() !== '' && viewMode === 'categories'

  return (
    <div className="space-y-6">
      {/* View controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {viewMode === 'services' && !showingSearchResults && (
            <Button
              variant="ghost"
              onClick={handleBackToCategories}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回分类
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {showingSearchResults ? (
                `搜索结果 (${filteredData.services.length})`
              ) : viewMode === 'categories' ? (
                `分类 (${currentCategories.length})`
              ) : selectedCategory ? (
                `${selectedCategory.name} (${currentServices.length})`
              ) : (
                `服务 (${currentServices.length})`
              )}
            </span>
          </div>
        </div>

        {(viewMode === 'services' || showingSearchResults) && (
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

      {/* Content area */}
      {showingSearchResults ? (
        // Search results view
        filteredData.services.length > 0 ? (
          <div className={cn(
            layoutMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch"
              : "space-y-4"
          )}>
            {filteredData.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onServiceAccess={onServiceAccess}
                defaultImage={defaultImage}
                className={layoutMode === 'list' ? 'flex flex-row items-center max-w-none' : 'h-full'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              没有找到相关服务
            </h3>
            <p className="text-gray-600">
              试试调整搜索关键词或浏览所有分类
            </p>
          </div>
        )
      ) : viewMode === 'categories' ? (
        // Categories view
        currentCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => handleCategoryClick(category)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              暂无分类
            </h3>
            <p className="text-gray-600">
              分类配置可能尚未加载，请稍后再试
            </p>
          </div>
        )
      ) : (
        // Services view
        currentServices.length > 0 ? (
          <div className={cn(
            layoutMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch"
              : "space-y-4"
          )}>
            {currentServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onServiceAccess={onServiceAccess}
                defaultImage={defaultImage}
                className={layoutMode === 'list' ? 'flex flex-row items-center max-w-none' : 'h-full'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              该分类下暂无服务
            </h3>
            <p className="text-gray-600">
              更多服务正在开发中，敬请期待！
            </p>
          </div>
        )
      )}
    </div>
  )
}
