import React from 'react'
import Image from 'next/image'
import { Service } from '@/types/services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Clock, Wrench, Star, ArrowUpRight } from 'lucide-react'

interface ServiceCardProps {
  service: Service
  onServiceAccess?: (service: Service) => void
  className?: string
  defaultImage?: string // 可配置的默认图片
}

const statusConfig = {
  active: {
    label: '正常运行',
    color:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    icon: '●',
    dotColor: 'text-green-500 dark:text-green-400',
  },
  'coming-soon': {
    label: '即将推出',
    color:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    icon: '●',
    dotColor: 'text-blue-500 dark:text-blue-400',
  },
  maintenance: {
    label: '维护中',
    color:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    icon: '●',
    dotColor: 'text-orange-500 dark:text-orange-400',
  },
}

export function ServiceCard({
  service,
  onServiceAccess,
  className,
  defaultImage = '/images/default-service.svg',
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
      // 没有有效链接时的处理
      alert('该服务暂未配置访问链接，敬请期待！')
    }
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-md',
        // 使用 Card 组件自带的 bg-card/text-card-foreground/border
        'rounded-lg overflow-hidden',
        'flex flex-col h-full',
        isDisabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
    >
      {/* Header with image and status */}
      <div className="relative">
        <div className="w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900/50 overflow-hidden relative">
          <Image
            src={service.image || defaultImage}
            alt={service.title}
            fill
            className="object-cover"
          />

          {/* Status indicator */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-1 bg-white/90 dark:bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
              <span className={cn('text-xs', status.dotColor)}>{status.icon}</span>
              <span className="font-medium text-foreground">{status.label}</span>
            </div>
          </div>

          {/* Featured badge */}
          {service.featured && (
            <div className="absolute top-3 right-3">
              <Badge
                variant="secondary"
                className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-100 border-amber-200 dark:border-amber-800 text-xs px-2 py-1"
              >
                <Star className="w-3 h-3 mr-1 fill-current" />
                推荐
              </Badge>
            </div>
          )}

          {/* External link indicator */}
          {hasValidHref && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 dark:bg-black/40 backdrop-blur-sm p-2 rounded-full">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pb-3 p-5 flex-1">
        <div className="flex flex-col h-full">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-2 truncate">{service.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {service.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-5 pb-5 mt-auto">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {service.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {service.tags.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{service.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Action button */}
        <Button
          variant={
            isDisabled
              ? 'secondary'
              : service.status === 'coming-soon' || !hasValidHref
                ? 'secondary'
                : 'default'
          }
          className="w-full transition-all duration-200"
          disabled={isDisabled}
          onClick={e => {
            e.stopPropagation()
            handleClick()
          }}
        >
          {isDisabled ? (
            <>
              <Wrench className="w-4 h-4 mr-2" />
              系统维护中
            </>
          ) : service.status === 'coming-soon' ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              即将上线
            </>
          ) : hasValidHref ? (
            <>
              <ArrowUpRight className="w-4 h-4 mr-2" />
              访问服务
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              敬请期待
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
