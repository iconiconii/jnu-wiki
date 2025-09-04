import React from 'react'
import { ServiceCategory } from '@/types/services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronRight, Building2, BookOpen, Globe, Sparkles } from 'lucide-react'

interface CategoryCardProps {
  category: ServiceCategory
  onClick?: () => void
  className?: string
  showServiceCount?: boolean
  showChildrenCount?: boolean
  variant?: 'default' | 'campus' | 'section' | 'general'
}

export function CategoryCard({ 
  category, 
  onClick, 
  className, 
  showServiceCount = true,
  showChildrenCount = false,
  variant = 'default'
}: CategoryCardProps) {

  // Auto-detect variant based on category type if not specified
  const cardVariant = variant === 'default' ? category.type || 'general' : variant

  // Resolve color scheme with optional category.color override (supports: blue, purple, green, amber)
  type ColorKey = 'blue' | 'purple' | 'green' | 'amber' | 'indigo' | 'teal' | 'cyan' | 'emerald' | 'rose' | 'orange'
  const resolveColorKey = (): ColorKey => {
    const c = (category.color || '').toLowerCase().trim()
    if (
      c === 'blue' ||
      c === 'purple' ||
      c === 'green' ||
      c === 'amber' ||
      c === 'indigo' ||
      c === 'teal' ||
      c === 'cyan' ||
      c === 'emerald' ||
      c === 'rose' ||
      c === 'orange'
    ) return c as ColorKey
    switch (cardVariant) {
      case 'campus':
        return 'blue'
      case 'section':
        return 'purple'
      case 'general':
      default:
        return 'green'
    }
  }

  const getStylesByColor = (key: ColorKey) => {
    switch (key) {
      case 'blue':
        return {
          container:
            'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:from-blue-100 hover:to-blue-200/60 hover:border-blue-300 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-900 dark:hover:from-blue-950/30 dark:hover:to-blue-900/20 dark:hover:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-300',
          title: 'text-blue-900 dark:text-blue-100',
          description: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800',
          arrow: 'bg-blue-200 text-blue-700 group-hover:bg-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:group-hover:bg-blue-800',
          accent: 'blue'
        }
      case 'purple':
        return {
          container:
            'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:from-purple-100 hover:to-purple-200/60 hover:border-purple-300 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-900 dark:hover:from-purple-950/30 dark:hover:to-purple-900/20 dark:hover:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-300',
          title: 'text-purple-900 dark:text-purple-100',
          description: 'text-purple-700 dark:text-purple-300',
          badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-800',
          arrow: 'bg-purple-200 text-purple-700 group-hover:bg-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:group-hover:bg-purple-800',
          accent: 'purple'
        }
      case 'amber':
        return {
          container:
            'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 hover:from-amber-100 hover:to-amber-200/60 hover:border-amber-300 dark:from-amber-950/20 dark:to-amber-900/10 dark:border-amber-900 dark:hover:from-amber-950/30 dark:hover:to-amber-900/20 dark:hover:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-300',
          title: 'text-amber-900 dark:text-amber-100',
          description: 'text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800',
          arrow: 'bg-amber-200 text-amber-700 group-hover:bg-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:group-hover:bg-amber-800',
          accent: 'amber'
        }
      case 'indigo':
        return {
          container:
            'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200 hover:from-indigo-100 hover:to-indigo-200/60 hover:border-indigo-300 dark:from-indigo-950/20 dark:to-indigo-900/10 dark:border-indigo-900 dark:hover:from-indigo-950/30 dark:hover:to-indigo-900/20 dark:hover:border-indigo-800',
          icon: 'text-indigo-600 dark:text-indigo-300',
          title: 'text-indigo-900 dark:text-indigo-100',
          description: 'text-indigo-700 dark:text-indigo-300',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-800',
          arrow: 'bg-indigo-200 text-indigo-700 group-hover:bg-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:group-hover:bg-indigo-800',
          accent: 'indigo'
        }
      case 'teal':
        return {
          container:
            'bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200 hover:from-teal-100 hover:to-teal-200/60 hover:border-teal-300 dark:from-teal-950/20 dark:to-teal-900/10 dark:border-teal-900 dark:hover:from-teal-950/30 dark:hover:to-teal-900/20 dark:hover:border-teal-800',
          icon: 'text-teal-600 dark:text-teal-300',
          title: 'text-teal-900 dark:text-teal-100',
          description: 'text-teal-700 dark:text-teal-300',
          badge: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-100 dark:border-teal-800',
          arrow: 'bg-teal-200 text-teal-700 group-hover:bg-teal-300 dark:bg-teal-900/40 dark:text-teal-200 dark:group-hover:bg-teal-800',
          accent: 'teal'
        }
      case 'cyan':
        return {
          container:
            'bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200 hover:from-cyan-100 hover:to-cyan-200/60 hover:border-cyan-300 dark:from-cyan-950/20 dark:to-cyan-900/10 dark:border-cyan-900 dark:hover:from-cyan-950/30 dark:hover:to-cyan-900/20 dark:hover:border-cyan-800',
          icon: 'text-cyan-600 dark:text-cyan-300',
          title: 'text-cyan-900 dark:text-cyan-100',
          description: 'text-cyan-700 dark:text-cyan-300',
          badge: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-100 dark:border-cyan-800',
          arrow: 'bg-cyan-200 text-cyan-700 group-hover:bg-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-200 dark:group-hover:bg-cyan-800',
          accent: 'cyan'
        }
      case 'emerald':
        return {
          container:
            'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 hover:from-emerald-100 hover:to-emerald-200/60 hover:border-emerald-300 dark:from-emerald-950/20 dark:to-emerald-900/10 dark:border-emerald-900 dark:hover:from-emerald-950/30 dark:hover:to-emerald-900/20 dark:hover:border-emerald-800',
          icon: 'text-emerald-600 dark:text-emerald-300',
          title: 'text-emerald-900 dark:text-emerald-100',
          description: 'text-emerald-700 dark:text-emerald-300',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-800',
          arrow: 'bg-emerald-200 text-emerald-700 group-hover:bg-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:group-hover:bg-emerald-800',
          accent: 'emerald'
        }
      case 'rose':
        return {
          container:
            'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200 hover:from-rose-100 hover:to-rose-200/60 hover:border-rose-300 dark:from-rose-950/20 dark:to-rose-900/10 dark:border-rose-900 dark:hover:from-rose-950/30 dark:hover:to-rose-900/20 dark:hover:border-rose-800',
          icon: 'text-rose-600 dark:text-rose-300',
          title: 'text-rose-900 dark:text-rose-100',
          description: 'text-rose-700 dark:text-rose-300',
          badge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-800',
          arrow: 'bg-rose-200 text-rose-700 group-hover:bg-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:group-hover:bg-rose-800',
          accent: 'rose'
        }
      case 'orange':
        return {
          container:
            'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 hover:from-orange-100 hover:to-orange-200/60 hover:border-orange-300 dark:from-orange-950/20 dark:to-orange-900/10 dark:border-orange-900 dark:hover:from-orange-950/30 dark:hover:to-orange-900/20 dark:hover:border-orange-800',
          icon: 'text-orange-600 dark:text-orange-300',
          title: 'text-orange-900 dark:text-orange-100',
          description: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-800',
          arrow: 'bg-orange-200 text-orange-700 group-hover:bg-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:group-hover:bg-orange-800',
          accent: 'orange'
        }
      case 'green':
      default:
        return {
          container:
            'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:from-green-100 hover:to-green-200/60 hover:border-green-300 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-900 dark:hover:from-green-950/30 dark:hover:to-green-900/20 dark:hover:border-green-800',
          icon: 'text-green-600 dark:text-green-300',
          title: 'text-green-900 dark:text-green-100',
          description: 'text-green-700 dark:text-green-300',
          badge: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-100 dark:border-green-800',
          arrow: 'bg-green-200 text-green-700 group-hover:bg-green-300 dark:bg-green-900/40 dark:text-green-200 dark:group-hover:bg-green-800',
          accent: 'green'
        }
    }
  }

  const getCardStyles = () => getStylesByColor(resolveColorKey())

  const getTypeIcon = () => {
    switch (cardVariant) {
      case 'campus': return <Building2 className="w-5 h-5" />
      case 'section': return <BookOpen className="w-5 h-5" />
      case 'general': return <Globe className="w-5 h-5" />
      default: return <Globe className="w-5 h-5" />
    }
  }

  const styles = getCardStyles()

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-black/5",
        "border rounded-xl overflow-hidden transform hover:-translate-y-1",
        "h-full flex flex-col",
        styles.container,
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-4 p-6 relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
          <div className={cn("text-8xl", styles.icon)}>
            {category.icon}
          </div>
        </div>
        
        <div className="flex items-start justify-between relative">
          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Enhanced icon with background circle */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-semibold transition-transform group-hover:scale-110",
                cardVariant === 'campus' ? 'bg-blue-100 text-blue-600' :
                cardVariant === 'section' ? 'bg-purple-100 text-purple-600' :
                'bg-green-100 text-green-600'
              )}>
                {category.icon}
              </div>
              {category.featured && (
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center">
                  <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                <CardTitle className={cn("text-lg sm:text-xl font-bold truncate transition-colors", styles.title)}>
                  {category.name}
                </CardTitle>
                <div className={cn("flex items-center self-start sm:self-auto", styles.icon)}>
                  {getTypeIcon()}
                </div>
              </div>
              <CardDescription className={cn("text-sm line-clamp-2 leading-relaxed", styles.description)}>
                {category.description}
              </CardDescription>
              
              {/* Featured badge with animation */}
              {category.featured && (
                <div className="mt-2">
                  <Badge 
                    className={cn(
                      "text-xs font-semibold px-2 sm:px-3 py-1 rounded-full animate-pulse",
                      "bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0",
                      "shadow-sm"
                    )}
                  >
                    ⭐ 推荐
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-2 sm:ml-4">
            {/* Stats section */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
              {/* Children count */}
              {showChildrenCount && category.children && category.children.length > 0 && (
                <div className={cn(
                  "text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full",
                  styles.badge
                )}>
                  {category.children.length} 篇章
                </div>
              )}
              
              {/* Service count */}
              {showServiceCount && category.services.length > 0 && (
                <div className={cn(
                  "text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full",
                  styles.badge
                )}>
                  {category.services.length} 服务
                </div>
              )}
            </div>
            
            {/* Arrow with enhanced animation */}
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300",
              "group-hover:scale-110 group-hover:rotate-3",
              styles.arrow
            )}>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-6 pb-6 flex-grow">
        {/* Content preview section with modern layout */}
        <div className="space-y-3 h-full flex flex-col">
          {/* Services preview */}
          {category.services && category.services.length > 0 && (
            <div className="space-y-2">
              <div className={cn("text-xs font-semibold uppercase tracking-wide", styles.description)}>
                热门服务
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.services.slice(0, 3).map((service) => (
                  <Badge 
                    key={service.id}
                    variant="outline"
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-lg transition-all hover:scale-105",
                      cardVariant === 'campus' ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' :
                      cardVariant === 'section' ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' :
                      'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                    )}
                  >
                    {service.title}
                  </Badge>
                ))}
                {category.services.length > 3 && (
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-1 rounded-lg opacity-75",
                      styles.badge
                    )}
                  >
                    +{category.services.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Children preview for campus categories */}
          {category.children && category.children.length > 0 && (
            <div className="space-y-2 flex-grow">
              <div className={cn("text-xs font-semibold uppercase tracking-wide", styles.description)}>
                包含篇章
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {category.children.slice(0, 4).map((child) => (
                  <div 
                    key={child.id}
                    className={cn(
                      "flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105",
                      cardVariant === 'campus' ? 'bg-blue-100/50 text-blue-700 hover:bg-blue-100' :
                      'bg-gray-100/50 text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm flex-shrink-0">{child.icon}</span>
                    <span className="truncate">{child.name}</span>
                  </div>
                ))}
                {category.children.length > 4 && (
                  <div className={cn(
                    "flex items-center justify-center px-2 py-1.5 rounded-lg text-xs font-medium opacity-75",
                    "sm:col-span-2",
                    styles.badge
                  )}>
                    +{category.children.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Empty state with improved styling */}
          {(!category.services || category.services.length === 0) && 
           (!category.children || category.children.length === 0) && (
            <div className={cn("text-center py-4 text-sm italic opacity-60 flex-grow flex items-center justify-center", styles.description)}>
              {category.type === 'campus' ? '📚 等待添加篇章内容' : '✨ 即将推出精彩服务'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
