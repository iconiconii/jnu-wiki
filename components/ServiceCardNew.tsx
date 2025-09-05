'use client'

import React from 'react'
import Image from 'next/image'
import { Service } from '@/types/services'
import { cn } from '@/lib/utils'
import { MoreVertical } from 'lucide-react'

interface ServiceCardProps {
  service: Service
  onServiceAccess?: (service: Service) => void
  className?: string
  variant?: 'list' | 'grid-2' | 'grid-3'
  density?: 'compact' | 'cozy'
}

interface ChipProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

function Chip({ children, variant = 'secondary', size = 'sm', className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors',
        {
          'px-2 py-1 text-xs': size === 'sm',
          'px-3 py-1.5 text-sm': size === 'md',
        },
        {
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800':
            variant === 'primary',
          'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700':
            variant === 'secondary',
          'bg-transparent text-gray-600 border-gray-300 dark:text-gray-400 dark:border-gray-600':
            variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

const statusConfig = {
  active: {
    label: '正常运行',
    dotColor: 'bg-green-500',
    chipColor: 'text-green-800 bg-green-100 dark:bg-green-900/20 dark:text-green-300',
  },
  'coming-soon': {
    label: '即将推出',
    dotColor: 'bg-blue-500',
    chipColor: 'text-blue-800 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300',
  },
  maintenance: {
    label: '维护中',
    dotColor: 'bg-orange-500',
    chipColor: 'text-orange-800 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300',
  },
}

export function ServiceCard({
  service,
  onServiceAccess,
  className,
  variant = 'grid-2',
  density = 'cozy',
}: ServiceCardProps) {
  const status = statusConfig[service.status || 'active']
  const isDisabled = service.status === 'maintenance'
  const hasValidHref =
    service.href && service.href !== 'https://example.com' && service.href.trim() !== ''

  const handleClick = () => {
    if (isDisabled) return

    if (onServiceAccess) {
      onServiceAccess(service)
    } else if (hasValidHref) {
      window.open(service.href, '_blank', 'noopener,noreferrer')
    } else {
      alert('该服务暂未配置访问链接，敬请期待！')
    }
  }

  const cardHeight = density === 'compact' ? 'h-24' : 'h-32'
  const iconSize = density === 'compact' ? 'w-12 h-12' : 'w-14 h-14'

  // 紧凑列表视图
  if (variant === 'list') {
    return (
      <div
        className={cn(
          'group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4',
          'cursor-pointer transition-all duration-150 ease-out',
          'hover:shadow-md hover:ring-1 hover:ring-gray-200 hover:-translate-y-0.5',
          'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
          'active:shadow-sm active:translate-y-0',
          cardHeight,
          isDisabled && 'opacity-60 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        tabIndex={0}
        role="button"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <div className="flex items-center gap-4 h-full">
          {/* 左侧图标 */}
          <div
            className={cn(
              'flex-shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
              iconSize
            )}
          >
            <Image
              src={service.image || '/images/default-service.svg'}
              alt={service.title}
              width={32}
              height={32}
              className="w-8 h-8 object-cover rounded-lg"
            />
          </div>

          {/* 中间信息区 */}
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {service.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {service.description}
            </p>
            <div className="flex items-center gap-2">
              <Chip size="sm" variant="secondary">
                {service.tags[0] || '未分类'}
              </Chip>
              {service.featured && (
                <Chip size="sm" variant="outline" className="text-amber-600">
                  推荐
                </Chip>
              )}
            </div>
          </div>

          {/* 右侧操作区 */}
          <div className="w-20 flex flex-col items-end justify-between h-full">
            {/* 状态指示 */}
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', status.dotColor)}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{status.label}</span>
            </div>

            {/* 主按钮 */}
            <button className="h-9 min-w-16 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {hasValidHref ? '访问' : '敬请期待'}
            </button>

            {/* 更多操作 */}
            <button className="w-6 h-6 p-0 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 网格视图（2列/3列）
  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4',
        'cursor-pointer transition-all duration-150 ease-out',
        'hover:shadow-md hover:ring-1 hover:ring-gray-200 hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
        'active:shadow-sm active:translate-y-0',
        density === 'compact' ? 'h-24' : 'min-h-32',
        'flex flex-col h-full',
        isDisabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="flex items-start gap-4">
        {/* 左侧图标 */}
        <div
          className={cn(
            'flex-shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
            iconSize
          )}
        >
          <Image
            src={service.image || '/images/default-service.svg'}
            alt={service.title}
            width={32}
            height={32}
            className="w-8 h-8 object-cover rounded-lg"
          />
        </div>

        {/* 中间信息区 */}
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {service.title}
          </h3>

          {density === 'cozy' && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Chip size="sm" variant="secondary">
              {service.tags[0] || '未分类'}
            </Chip>
            {service.featured && (
              <Chip size="sm" variant="outline" className="text-amber-600">
                推荐
              </Chip>
            )}
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="w-20 flex flex-col items-end justify-between h-full">
          {/* 状态指示 */}
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', status.dotColor)}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{status.label}</span>
          </div>

          {/* 主按钮 */}
          <button
            className="h-9 min-w-16 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
            onClick={e => {
              e.stopPropagation()
              handleClick()
            }}
          >
            {hasValidHref ? '访问' : '敬请期待'}
          </button>

          {/* 更多操作 */}
          <button className="w-6 h-6 p-0 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// 骨架屏组件
export function ServiceCardSkeleton({
  density = 'cozy',
}: {
  variant?: 'list' | 'grid-2' | 'grid-3'
  density?: 'compact' | 'cozy'
}) {
  const cardHeight = density === 'compact' ? 'h-24' : 'min-h-32'

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse h-full flex flex-col',
        cardHeight
      )}
    >
      <div className="flex items-start gap-4">
        {/* 图标骨架 */}
        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0"></div>

        {/* 内容骨架 */}
        <div className="flex-1 space-y-3">
          {/* 标题 */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>

          {density === 'cozy' && (
            <>
              {/* 描述行1 */}
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>

              {/* 描述行2 */}
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </>
          )}

          {/* 标签行 */}
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12"></div>
          </div>
        </div>

        {/* 操作区骨架 */}
        <div className="w-20 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    </div>
  )
}
