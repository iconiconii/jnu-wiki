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
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: '●',
    dotColor: 'text-green-500'
  },
  'coming-soon': {
    label: '即将推出',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '●',
    dotColor: 'text-blue-500'
  },
  maintenance: {
    label: '维护中',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: '●',
    dotColor: 'text-orange-500'
  }
}

export function ServiceCard({ service, onServiceAccess, className, defaultImage = '/images/default-service.svg' }: ServiceCardProps) {
  const status = statusConfig[service.status || 'active']
  const isDisabled = service.status === 'maintenance'

  const handleClick = () => {
    if (isDisabled) return
    
    if (onServiceAccess) {
      onServiceAccess(service)
    } else if (service.href) {
      window.open(service.href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md",
        "border border-gray-200 bg-white rounded-lg overflow-hidden",
        "flex flex-col h-full", // 添加flex布局和固定高度
        isDisabled && "opacity-60 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
    >
      {/* Header with image and status */}
      <div className="relative">
        <div className="w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
          <Image
            src={service.image || defaultImage}
            alt={service.title}
            fill
            className="object-cover"
          />
          
          {/* Status indicator */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
              <span className={cn("text-xs", status.dotColor)}>{status.icon}</span>
              <span className="text-gray-700 font-medium">{status.label}</span>
            </div>
          </div>

          {/* Featured badge */}
          {service.featured && (
            <div className="absolute top-3 right-3">
              <Badge 
                variant="secondary" 
                className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-2 py-1"
              >
                <Star className="w-3 h-3 mr-1 fill-current" />
                推荐
              </Badge>
            </div>
          )}
          
          {/* External link indicator */}
          {service.href && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full">
                <ArrowUpRight className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pb-3 p-5 flex-1">
        <div className="flex flex-col h-full">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2 truncate">
              {service.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
              {service.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-5 pb-5 mt-auto">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {service.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="text-xs bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 transition-colors"
            >
              {tag}
            </Badge>
          ))}
          {service.tags.length > 3 && (
            <Badge 
              variant="outline"
              className="text-xs bg-gray-50 text-gray-500 border-gray-200"
            >
              +{service.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Action button */}
        <Button 
          className={cn(
            "w-full transition-all duration-200",
            isDisabled 
              ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white" 
              : service.status === 'coming-soon'
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
          )}
          disabled={isDisabled}
          onClick={(e) => {
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
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4 mr-2" />
              访问服务
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}