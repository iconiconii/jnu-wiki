import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, Home } from 'lucide-react'
import { DatabaseCategory } from '@/types/services'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  id: string
  name: string
  type: 'campus' | 'section' | 'general'
  icon?: string
}

interface BreadcrumbNavProps {
  path: BreadcrumbItem[]
  onNavigate: (item: BreadcrumbItem | null) => void
  className?: string
  showIcons?: boolean
}

export function BreadcrumbNav({ 
  path, 
  onNavigate, 
  className,
  showIcons = true 
}: BreadcrumbNavProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      {/* Home button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="h-8 px-2 text-gray-600 hover:text-gray-800"
      >
        <Home className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline">首页</span>
      </Button>
      
      {/* Path items */}
      {path.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Navigate to this level (remove items after current index)
              onNavigate(item)
            }}
            className={cn(
              "h-8 px-2 max-w-32 sm:max-w-none",
              index === path.length - 1 
                ? "text-gray-900 font-medium cursor-default" 
                : "text-gray-600 hover:text-gray-800"
            )}
            disabled={index === path.length - 1}
          >
            {showIcons && item.icon && (
              <span className="mr-1">{item.icon}</span>
            )}
            <span className="truncate">{item.name}</span>
            {item.type === 'campus' && (
              <span className="ml-1 text-xs text-gray-500 hidden sm:inline">
                校区
              </span>
            )}
            {item.type === 'section' && (
              <span className="ml-1 text-xs text-gray-500 hidden sm:inline">
                篇章
              </span>
            )}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  )
}

// Helper function to build breadcrumb path from category hierarchy
export function buildBreadcrumbPath(
  currentCategory: DatabaseCategory | null,
  allCategories: DatabaseCategory[]
): BreadcrumbItem[] {
  if (!currentCategory) return []
  
  const path: BreadcrumbItem[] = []
  let current: DatabaseCategory | undefined = currentCategory
  
  while (current) {
    path.unshift({
      id: current.id,
      name: current.name,
      type: current.type,
      icon: current.icon || undefined
    })
    
    // Find parent category
    if (current.parent_id) {
      current = allCategories.find(cat => cat.id === current!.parent_id)
    } else {
      break
    }
  }
  
  return path
}

// Breadcrumb context for managing navigation state
export interface BreadcrumbState {
  path: BreadcrumbItem[]
  currentCategory: DatabaseCategory | null
  parentCategories: DatabaseCategory[]
}

export function useBreadcrumbNavigation() {
  const [state, setState] = React.useState<BreadcrumbState>({
    path: [],
    currentCategory: null,
    parentCategories: []
  })
  
  const navigateTo = React.useCallback((category: DatabaseCategory | null, allCategories: DatabaseCategory[]) => {
    if (!category) {
      // Navigate to home
      setState({
        path: [],
        currentCategory: null,
        parentCategories: []
      })
      return
    }
    
    const path = buildBreadcrumbPath(category, allCategories)
    const parentCategories = allCategories.filter(cat => !cat.parent_id)
    
    setState({
      path,
      currentCategory: category,
      parentCategories
    })
  }, [])
  
  const navigateToHome = React.useCallback(() => {
    setState({
      path: [],
      currentCategory: null,
      parentCategories: []
    })
  }, [])
  
  return {
    ...state,
    navigateTo,
    navigateToHome
  }
}
