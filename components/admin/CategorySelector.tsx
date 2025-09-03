import React from 'react'
import { DatabaseCategory } from '@/types/services'

interface CategorySelectorProps {
  categories: DatabaseCategory[]
  selectedCategoryId: string
  onSelectCategory: (categoryId: string) => void
  className?: string
  placeholder?: string
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelectCategory,
  className = '',
  placeholder = '选择分类'
}: CategorySelectorProps) {
  // 构建分类选项，包含层级路径
  const buildCategoryOptions = () => {
    const options: Array<{
      id: string
      label: string
      level: number
      type: string
    }> = []
    
    const addCategory = (category: DatabaseCategory, level: number = 0, parentPath: string = '') => {
      const path = parentPath 
        ? `${parentPath} > ${category.name}` 
        : category.name
      
      const typeLabel = category.type === 'campus' ? '校区' : 
                       category.type === 'section' ? '篇章' : '通用'
      
      options.push({
        id: category.id,
        label: `${'  '.repeat(level)}${category.icon || '📁'} ${path} (${typeLabel})`,
        level,
        type: category.type
      })
      
      // 添加子分类
      const children = categories.filter(cat => cat.parent_id === category.id)
      children.forEach(child => addCategory(child, level + 1, path))
    }
    
    // 首先添加顶级分类（没有parent_id的）
    const topLevel = categories.filter(cat => !cat.parent_id)
    topLevel.forEach(category => addCategory(category))
    
    return options
  }
  
  const categoryOptions = buildCategoryOptions()
  
  return (
    <select
      value={selectedCategoryId}
      onChange={(e) => onSelectCategory(e.target.value)}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    >
      <option value="">{placeholder}</option>
      {categoryOptions.map((option) => (
        <option
          key={option.id}
          value={option.id}
          disabled={option.type === 'campus'} // 校区不能直接关联服务
          className={option.type === 'campus' ? 'text-gray-400' : ''}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
}

// 获取分类的完整路径文本
export function getCategoryPath(categoryId: string, categories: DatabaseCategory[]): string {
  const category = categories.find(cat => cat.id === categoryId)
  if (!category) return ''
  
  const buildPath = (cat: DatabaseCategory): string => {
    if (!cat.parent_id) {
      return cat.name
    }
    
    const parent = categories.find(c => c.id === cat.parent_id)
    if (!parent) {
      return cat.name
    }
    
    return `${buildPath(parent)} > ${cat.name}`
  }
  
  return buildPath(category)
}

// 分类路径显示组件
interface CategoryPathProps {
  categoryId: string
  categories: DatabaseCategory[]
  className?: string
}

export function CategoryPath({ categoryId, categories, className = '' }: CategoryPathProps) {
  const path = getCategoryPath(categoryId, categories)
  const category = categories.find(cat => cat.id === categoryId)
  
  if (!category) return <span className={className}>未知分类</span>
  
  const typeLabel = category.type === 'campus' ? '校区' : 
                   category.type === 'section' ? '篇章' : '通用'
  
  const typeColor = category.type === 'campus' ? 'text-blue-600' : 
                   category.type === 'section' ? 'text-purple-600' : 'text-green-600'
  
  return (
    <span className={className}>
      <span className="text-gray-600">{path}</span>
      <span className={`ml-2 text-xs ${typeColor}`}>({typeLabel})</span>
    </span>
  )
}