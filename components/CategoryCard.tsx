import React from 'react'
import { ServiceCategory } from '@/types/services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface CategoryCardProps {
  category: ServiceCategory
  onClick?: () => void
  className?: string
  showServiceCount?: boolean
  showChildrenCount?: boolean
}

export function CategoryCard({ 
  category, 
  onClick, 
  className, 
  showServiceCount = true,
  showChildrenCount = false 
}: CategoryCardProps) {

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md",
        "border border-gray-200 bg-white rounded-lg overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="text-3xl mt-1 flex-shrink-0">
              {category.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  {category.name}
                </CardTitle>
                {category.featured && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-amber-100 text-amber-800 border-amber-200 px-2 py-1"
                  >
                    推荐
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm text-gray-600 line-clamp-2">
                {category.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
            <div className="flex items-center space-x-1">
              {/* Type badge */}
              {category.type && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs px-2 py-1",
                    category.type === 'campus' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    category.type === 'section' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  )}
                >
                  {category.type === 'campus' ? '校区' : 
                   category.type === 'section' ? '篇章' : '通用'}
                </Badge>
              )}
              
              {/* Children count */}
              {showChildrenCount && category.children && category.children.length > 0 && (
                <div className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {category.children.length} 个分类
                </div>
              )}
              
              {/* Service count */}
              {showServiceCount && category.services.length > 0 && (
                <div className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {category.services.length} 项
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {/* Show services preview */}
          {category.services && category.services.length > 0 && (
            <>
              {category.services.slice(0, 4).map((service) => (
                <Badge 
                  key={service.id}
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  {service.title}
                </Badge>
              ))}
              {category.services.length > 4 && (
                <Badge 
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-500 border-gray-200"
                >
                  +{category.services.length - 4} 更多
                </Badge>
              )}
            </>
          )}
          
          {/* Show children preview for campus categories */}
          {category.children && category.children.length > 0 && (
            <>
              {category.children.slice(0, 3).map((child) => (
                <Badge 
                  key={child.id}
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  {child.icon} {child.name}
                </Badge>
              ))}
              {category.children.length > 3 && (
                <Badge 
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-500 border-blue-200"
                >
                  +{category.children.length - 3} 个篇章
                </Badge>
              )}
            </>
          )}
          
          {/* Empty state */}
          {(!category.services || category.services.length === 0) && 
           (!category.children || category.children.length === 0) && (
            <span className="text-xs text-gray-500 italic">
              {category.type === 'campus' ? '暂无篇章' : '暂无服务'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}