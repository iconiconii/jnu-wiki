'use client'

import React from 'react'
import { X, Search, Tag, MapPin, Star, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FilterState } from '@/types/services'
import { cn } from '@/lib/utils'

interface FilterChipsProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  categories?: Array<{ id: string; name: string; icon: string }>
  className?: string
}

interface FilterChip {
  id: string
  type: 'search' | 'category' | 'tag' | 'rating'
  label: string
  value: string | number | boolean | { min: number | null; max: number | null }
  icon: React.ComponentType<{ className?: string }>
  onRemove: () => void
}

export function FilterChips({
  filters,
  onFiltersChange,
  categories = [],
  className,
}: FilterChipsProps) {
  // 生成筛选条件芯片列表
  const generateChips = (): FilterChip[] => {
    const chips: FilterChip[] = []

    // 搜索条件
    if (filters.search.trim()) {
      chips.push({
        id: 'search',
        type: 'search',
        label: `搜索: ${filters.search}`,
        value: filters.search,
        icon: Search,
        onRemove: () => updateFilters({ search: '' }),
      })
    }

    // 分类筛选
    if (filters.category) {
      const category = categories.find(c => c.id === filters.category)
      chips.push({
        id: 'category',
        type: 'category',
        label: category ? `${category.icon} ${category.name}` : `分类: ${filters.category}`,
        value: filters.category,
        icon: MapPin,
        onRemove: () => updateFilters({ category: '' }),
      })
    }

    // 标签筛选
    filters.tags.forEach((tag, index) => {
      chips.push({
        id: `tag-${index}`,
        type: 'tag',
        label: tag,
        value: tag,
        icon: Tag,
        onRemove: () =>
          updateFilters({
            tags: filters.tags.filter(t => t !== tag),
          }),
      })
    })

    // A 路线：移除价格与免费筛选芯片

    // 评分筛选
    if (filters.ratingMin !== null) {
      chips.push({
        id: 'rating',
        type: 'rating',
        label: `评分: ≥${filters.ratingMin}星`,
        value: filters.ratingMin,
        icon: Star,
        onRemove: () => updateFilters({ ratingMin: null }),
      })
    }

    return chips
  }

  // 更新筛选条件
  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({
      ...filters,
      ...updates,
      page: 1, // 筛选条件变化时重置到第一页
    })
  }

  // 清空所有筛选条件
  const clearAllFilters = () => {
    updateFilters({
      search: '',
      category: '',
      tags: [],
      ratingMin: null,
    })
  }

  // 处理键盘事件
  const handleChipKeyDown = (e: React.KeyboardEvent, onRemove: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onRemove()
    }
  }

  const chips = generateChips()
  const hasFilters = chips.length > 0

  if (!hasFilters) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* 筛选条件芯片 */}
      {chips.map(chip => {
        const Icon = chip.icon

        return (
          <Badge
            key={chip.id}
            variant="secondary"
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-xs',
              'bg-primary/10 text-primary hover:bg-primary/20',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'transition-colors cursor-pointer'
            )}
            tabIndex={0}
            role="button"
            aria-label={`移除筛选条件: ${chip.label}`}
            onClick={chip.onRemove}
            onKeyDown={e => handleChipKeyDown(e, chip.onRemove)}
          >
            <Icon className="h-3 w-3" />
            <span className="max-w-[120px] truncate">{chip.label}</span>
            <X className="h-3 w-3 hover:text-destructive transition-colors" aria-hidden="true" />
          </Badge>
        )
      })}

      {/* 分隔线 */}
      {chips.length > 1 && <div className="h-4 border-l border-border mx-1" aria-hidden="true" />}

      {/* 清空所有按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAllFilters}
        className={cn(
          'h-7 px-2 text-xs text-muted-foreground',
          'hover:text-destructive hover:bg-destructive/10',
          'focus:text-destructive focus:bg-destructive/10'
        )}
        aria-label="清空所有筛选条件"
      >
        <Trash2 className="h-3 w-3 mr-1" />
        清空全部
      </Button>
    </div>
  )
}

// 用于显示当前筛选状态的紧凑版本
interface FilterSummaryProps {
  filters: FilterState
  className?: string
}

export function FilterSummary({ filters, className }: FilterSummaryProps) {
  const activeFilterCount = [
    filters.search.trim(),
    filters.category,
    filters.tags.length > 0,
    filters.ratingMin !== null,
  ].filter(Boolean).length

  if (activeFilterCount === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <span className="font-medium">已应用 {activeFilterCount} 个筛选条件</span>
      <div className="flex gap-1">
        {Array.from({ length: activeFilterCount }, (_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full" />
        ))}
      </div>
    </div>
  )
}
