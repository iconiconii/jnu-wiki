'use client'

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ServiceCard, ServiceCardSkeleton } from './ServiceCardNew'
import { ServiceToolbar } from './ServiceToolbar'
import { Service } from '@/types/services'
import { SearchX, AlertCircle, Plus } from 'lucide-react'

interface ServiceListPageProps {
  services: Service[]
  isLoading?: boolean
  error?: Error | null
  onServiceAccess?: (service: Service) => void
  onRetry?: () => void
  onCreateService?: () => void
  className?: string
}

interface EmptyStateProps {
  searchQuery?: string
  onClearSearch?: () => void
  onCreateService?: () => void
}

function EmptyState({ searchQuery, onClearSearch, onCreateService }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* 图标 */}
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <SearchX className="w-10 h-10 text-gray-400" />
      </div>

      {/* 文案 */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {searchQuery ? '未找到相关服务' : '暂无服务'}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
        {searchQuery
          ? `没有找到包含"${searchQuery}"的服务，试试其他关键词`
          : '还没有添加任何服务，快来创建第一个服务吧'}
      </p>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {searchQuery ? (
          <>
            <button
              onClick={onClearSearch}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              清空筛选
            </button>
            <button
              onClick={onCreateService}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              提交新服务
            </button>
          </>
        ) : (
          <button
            onClick={onCreateService}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建服务
          </button>
        )}
      </div>
    </div>
  )
}

interface ErrorStateProps {
  error: Error
  onRetry?: () => void
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* 错误图标 */}
      <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>

      {/* 错误信息 */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">加载失败</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        网络连接出现问题，请检查网络后重试
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mb-8">
        错误信息: {error.message || 'NETWORK_ERROR'}
      </p>

      {/* 重试按钮 */}
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-w-24"
      >
        重新加载
      </button>
    </div>
  )
}

export function ServiceListPage({
  services = [],
  isLoading = false,
  error = null,
  onServiceAccess,
  onRetry,
  onCreateService,
  className,
}: ServiceListPageProps) {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'list' | 'grid-2' | 'grid-3'>('grid-2')
  const [density, setDensity] = useState<'compact' | 'cozy'>('cozy')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // 提取分类
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>()

    services.forEach(service => {
      const category = service.tags[0] || '未分类'
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })

    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      id: name,
      name,
      count,
    }))
  }, [services])

  // 过滤和排序服务
  const filteredAndSortedServices = useMemo(() => {
    let filtered = services

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        service =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => (service.tags[0] || '未分类') === selectedCategory)
    }

    // 排序
    const sortedServices = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title)
        case 'updated':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'featured':
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
        default:
          return 0
      }
    })

    return sortedServices
  }, [services, searchQuery, selectedCategory, sortBy])

  // 网格类名
  const gridClassName = useMemo(() => {
    switch (viewMode) {
      case 'list':
        return 'space-y-4'
      case 'grid-2':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch'
      case 'grid-3':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 items-stretch'
      default:
        return 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch'
    }
  }, [viewMode])

  // 骨架屏数量
  const skeletonCount = viewMode === 'grid-3' ? 9 : viewMode === 'grid-2' ? 6 : 5

  if (error) {
    return (
      <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* 工具条 */}
      <ServiceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalResults={filteredAndSortedServices.length}
        showMobileFilters={showMobileFilters}
        onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
      />

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 密度切换（可选，隐藏在桌面端） */}
        <div className="hidden lg:flex justify-end mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">密度:</span>
            <button
              className={cn(
                'px-2 py-1 rounded transition-colors',
                density === 'cozy'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
              onClick={() => setDensity('cozy')}
            >
              舒适
            </button>
            <button
              className={cn(
                'px-2 py-1 rounded transition-colors',
                density === 'compact'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
              onClick={() => setDensity('compact')}
            >
              紧凑
            </button>
          </div>
        </div>

        {/* 服务列表 */}
        {isLoading ? (
          <div className={gridClassName}>
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <ServiceCardSkeleton key={index} variant={viewMode} density={density} />
            ))}
          </div>
        ) : filteredAndSortedServices.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onCreateService={onCreateService}
          />
        ) : (
          <div className={gridClassName}>
            {filteredAndSortedServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onServiceAccess={onServiceAccess}
                variant={viewMode}
                density={density}
                className="min-w-80 h-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
