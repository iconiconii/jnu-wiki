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
}

export function CategoryCard({ category, onClick, className }: CategoryCardProps) {

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
            <div className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {category.services.length} 项
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-6 pb-6">
        <div className="flex flex-wrap gap-2">
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
        </div>
      </CardContent>
    </Card>
  )
}