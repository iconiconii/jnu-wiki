'use client'

import React from 'react'
import { Service } from '@/types/services'
import { ServiceCard } from '@/components/ServiceCardNew'
import { Card } from '@/components/ui/card'
import { Loader2, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ServiceListProps {
  services: Service[]
  loading?: boolean
  error?: string | null
  total?: number
  onServiceAccess?: (service: Service) => void
  onRetry?: () => void
  onClearFilters?: () => void
  className?: string
  emptyMessage?: string
  emptyAction?: React.ReactNode
}

// 骨架屏组件
function ServiceSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="flex space-x-1">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// 空状态组件
function EmptyState({
  message = '未找到匹配的服务',
  action,
  onClearFilters,
}: {
  message?: string
  action?: React.ReactNode
  onClearFilters?: () => void
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
        <Search className="h-full w-full" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        尝试调整筛选条件或搜索关键词，或者浏览其他分类的服务
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            清空筛选条件
          </Button>
        )}
        {action}
      </div>
    </div>
  )
}

// 错误状态组件
function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 text-red-400 mb-4">
        <AlertCircle className="h-full w-full" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
      {onRetry && <Button onClick={onRetry}>重新加载</Button>}
    </div>
  )
}

export function ServiceList({
  services,
  loading = false,
  error = null,
  total = 0,
  onServiceAccess,
  onRetry,
  onClearFilters,
  className,
  emptyMessage,
  emptyAction,
}: ServiceListProps) {
  // 错误状态
  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    )
  }

  // 加载状态
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-gray-600">加载中...</span>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <ServiceSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  // 空状态
  if (services.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState message={emptyMessage} action={emptyAction} onClearFilters={onClearFilters} />
      </div>
    )
  }

  // 正常显示服务列表
  return (
    <div className={cn('space-y-4', className)}>
      {/* 结果统计 */}
      {total > 0 && <div className="text-sm text-gray-600 px-1">找到 {total} 个服务</div>}

      {/* 服务列表 */}
      <div className="grid gap-4">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onServiceAccess={s => onServiceAccess?.(s)}
            variant="list"
          />
        ))}
      </div>
    </div>
  )
}

export default ServiceList
