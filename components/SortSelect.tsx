'use client'

import React from 'react'
import { ArrowUpDown, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SortOption } from '@/types/services'
import { cn } from '@/lib/utils'

interface SortSelectProps {
  value: SortOption
  onChange: (sort: SortOption) => void
  className?: string
}

const SORT_OPTIONS = [
  {
    value: 'newest' as SortOption,
    label: '最新发布',
    icon: Clock,
    description: '按发布时间排序',
  },
  {
    value: 'rating_desc' as SortOption,
    label: '评分最高',
    icon: Star,
    description: '按评分从高到低排序',
  },
]

export function SortSelect({ value, onChange, className }: SortSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const currentOption = SORT_OPTIONS.find(option => option.value === value) || SORT_OPTIONS[0]

  const handleSelect = (sortValue: SortOption) => {
    onChange(sortValue)
    setIsOpen(false)
  }

  // 键盘导航处理
  const handleKeyDown = (e: React.KeyboardEvent, sortValue: SortOption) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(sortValue)
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* 触发按钮 */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[140px] justify-between"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`当前排序：${currentOption.label}`}
      >
        <div className="flex items-center gap-2">
          <currentOption.icon className="h-4 w-4" />
          <span className="text-sm">{currentOption.label}</span>
        </div>
        <ArrowUpDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {/* 下拉选项 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />

          {/* 选项列表 */}
          <div
            className="absolute top-full mt-1 w-full min-w-[200px] bg-background border rounded-md shadow-lg z-50 py-1"
            role="listbox"
            aria-label="排序选项"
          >
            {SORT_OPTIONS.map(option => {
              const isSelected = option.value === value
              const Icon = option.icon

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                    isSelected && 'bg-accent/50 text-accent-foreground font-medium'
                  )}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={e => handleKeyDown(e, option.value)}
                >
                  <Icon
                    className={cn('h-4 w-4 text-muted-foreground', isSelected && 'text-primary')}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// 简化版本的排序选择器（用于移动端或紧凑布局）
interface SimpleSortSelectProps {
  value: SortOption
  onChange: (sort: SortOption) => void
  className?: string
}

export function SimpleSortSelect({ value, onChange, className }: SimpleSortSelectProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {SORT_OPTIONS.map(option => {
        const isSelected = option.value === value
        const Icon = option.icon

        return (
          <Button
            key={option.value}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(option.value)}
            className="h-8 px-3 text-xs"
            aria-pressed={isSelected}
            aria-label={`按${option.label}排序`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
