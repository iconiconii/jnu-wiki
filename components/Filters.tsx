'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FilterState } from '@/types/services'
import { getCategories, getAvailableTags } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface FiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  className?: string
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export function Filters({ filters, onFiltersChange, className }: FiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // 加载分类和标签数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([getCategories(), getAvailableTags()])
        setCategories(categoriesData)
        setAvailableTags(tagsData)
      } catch (error) {
        console.error('Failed to load filter options:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 更新筛选条件
  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({
      ...filters,
      ...updates,
      page: 1, // 筛选条件变化时重置到第一页
    })
  }

  // 搜索框变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value })
  }

  // 分类选择
  const handleCategoryChange = (categoryId: string) => {
    updateFilters({
      category: filters.category === categoryId ? '' : categoryId,
    })
  }

  // 标签选择
  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    updateFilters({ tags: newTags })
  }

  // A 路线：无价格/免费筛选

  // 评分筛选
  const handleRatingChange = (rating: number | null) => {
    updateFilters({
      ratingMin: filters.ratingMin === rating ? null : rating,
    })
  }

  // 重置所有筛选条件
  const handleReset = () => {
    updateFilters({
      search: '',
      category: '',
      tags: [],
      ratingMin: null,
    })
  }

  // 检查是否有活跃的筛选条件
  const hasActiveFilters =
    filters.search || filters.category || filters.tags.length > 0 || filters.ratingMin !== null

  if (loading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-9 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4 space-y-4', className)}>
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="搜索服务名称或描述..."
          value={filters.search}
          onChange={handleSearchChange}
          className="pl-10 pr-4"
          aria-label="搜索服务"
        />
      </div>

      {/* 快速筛选和展开按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 分类快选 */}
          {categories.slice(0, 3).map(category => (
            <Button
              key={category.id}
              variant={filters.category === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(category.id)}
              className="h-7 text-xs"
              aria-pressed={filters.category === category.id}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}

          {/* A 路线：移除免费快选 */}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              aria-label="重置筛选条件"
            >
              <X className="h-3 w-3 mr-1" />
              重置
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 text-xs"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '收起筛选选项' : '展开筛选选项'}
          >
            <Filter className="h-3 w-3 mr-1" />
            筛选
            <ChevronDown
              className={cn('h-3 w-3 ml-1 transition-transform', isExpanded && 'rotate-180')}
            />
          </Button>
        </div>
      </div>

      {/* 展开的筛选选项 */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t">
          {/* 所有分类 */}
          {categories.length > 3 && (
            <div>
              <label className="text-sm font-medium mb-2 block">分类</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={filters.category === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange(category.id)}
                    className="h-8 text-xs"
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 标签选择 */}
          {availableTags.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">标签</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* A 路线：移除价格区间与免费开关 */}

          {/* 评分筛选 */}
          <div>
            <label className="text-sm font-medium mb-2 block">最低评分</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <Button
                  key={rating}
                  variant={filters.ratingMin === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRatingChange(rating)}
                  className="px-3"
                >
                  {rating}星+
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
