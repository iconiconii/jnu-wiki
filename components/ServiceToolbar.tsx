'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Search, X, Filter, List, Grid3X3, ChevronDown } from 'lucide-react'

interface Category {
  id: string
  name: string
  count?: number
}

interface ServiceToolbarProps {
  // 搜索相关
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearchSubmit?: () => void

  // 分类筛选
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void

  // 排序
  sortBy: string
  onSortChange: (sortBy: string) => void
  sortOptions?: { value: string; label: string }[]

  // 视图模式
  viewMode: 'list' | 'grid-2' | 'grid-3'
  onViewModeChange: (mode: 'list' | 'grid-2' | 'grid-3') => void

  // 结果统计
  totalResults: number

  // 移动端筛选抽屉
  showMobileFilters?: boolean
  onToggleMobileFilters?: () => void

  className?: string
}

interface ChipProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  active?: boolean
  onClick?: () => void
  className?: string
}

function Chip({ children, variant = 'secondary', active, onClick, className }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border transition-colors whitespace-nowrap',
        {
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800':
            active && variant === 'primary',
          'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700':
            !active && variant === 'secondary',
          'bg-blue-600 text-white border-blue-600 hover:bg-blue-700': active,
          'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700':
            !active,
        },
        className
      )}
    >
      {children}
    </button>
  )
}

export function ServiceToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  sortOptions = [
    { value: 'name', label: '名称' },
    { value: 'updated', label: '最新' },
    { value: 'rating', label: '评分' },
    { value: 'featured', label: '推荐' },
  ],
  viewMode,
  onViewModeChange,
  totalResults,
  showMobileFilters = false,
  onToggleMobileFilters,
  className,
}: ServiceToolbarProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        {/* 桌面端布局 */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* 左侧：结果数 + 搜索 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              找到 {totalResults} 个服务
            </span>

            <div className="relative w-80 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="搜索服务..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onSearchSubmit?.()
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* 中间：分类筛选 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <Chip active={selectedCategory === 'all'} onClick={() => onCategoryChange('all')}>
                全部 {totalResults > 0 && `(${totalResults})`}
              </Chip>
              {categories.map(category => (
                <Chip
                  key={category.id}
                  active={selectedCategory === category.id}
                  onClick={() => onCategoryChange(category.id)}
                >
                  {category.name} {category.count && `(${category.count})`}
                </Chip>
              ))}
            </div>
          </div>

          {/* 右侧：排序 + 视图切换 */}
          <div className="flex items-center gap-3">
            {/* 排序下拉 */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => onSortChange(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* 视图切换 */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-800">
              <button
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                onClick={() => onViewModeChange('list')}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid-2'
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                onClick={() => onViewModeChange('grid-2')}
                title="两列网格"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid-3'
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                onClick={() => onViewModeChange('grid-3')}
                title="三列网格"
              >
                <Grid3X3 className="w-4 h-4 scale-75" />
              </button>
            </div>
          </div>
        </div>

        {/* 移动端布局 */}
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">{totalResults} 个服务</span>

            <button
              onClick={onToggleMobileFilters}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>

          {/* 移动端搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-8 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="搜索服务..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onSearchSubmit?.()
                }
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* 移动端筛选面板（可展开） */}
        {showMobileFilters && (
          <div className="md:hidden mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* 分类筛选 */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">分类</h3>
                <div className="flex flex-wrap gap-2">
                  <Chip active={selectedCategory === 'all'} onClick={() => onCategoryChange('all')}>
                    全部
                  </Chip>
                  {categories.map(category => (
                    <Chip
                      key={category.id}
                      active={selectedCategory === category.id}
                      onClick={() => onCategoryChange(category.id)}
                    >
                      {category.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* 排序和视图 */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">排序:</span>
                  <select
                    value={sortBy}
                    onChange={e => onSortChange(e.target.value)}
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-1">
                  <button
                    className={cn(
                      'p-2 rounded',
                      viewMode === 'list'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                        : 'text-gray-400'
                    )}
                    onClick={() => onViewModeChange('list')}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    className={cn(
                      'p-2 rounded',
                      viewMode === 'grid-2'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                        : 'text-gray-400'
                    )}
                    onClick={() => onViewModeChange('grid-2')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
