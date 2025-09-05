import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { DatabaseCategory } from '@/types/services'

interface CategorySelectorProps {
  selectedCategoryId: string | null
  onCategorySelect: (categoryId: string, categoryPath: string) => void
  error?: string
}

export function CategorySelector({
  selectedCategoryId,
  onCategorySelect,
  error,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<DatabaseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [currentLevel, setCurrentLevel] = useState<'root' | 'campus'>('root')
  const [selectedCampus, setSelectedCampus] = useState<DatabaseCategory | null>(null)
  const [loadError, setLoadError] = useState<string>('')

  // 获取层级分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/categories/public?tree=true')

        if (!response.ok) {
          throw new Error('获取分类数据失败')
        }

        const result = await response.json()
        setCategories(result.categories || [])
        setLoadError('')
      } catch (error) {
        console.error('获取分类失败:', error)
        setLoadError('无法加载分类数据，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // 获取类型标签颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'campus':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'section':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'general':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // 处理分类选择
  const handleCategorySelect = (category: DatabaseCategory) => {
    if (category.type === 'campus') {
      // 选择校区，显示子篇章
      setSelectedCampus(category)
      setCurrentLevel('campus')
    } else {
      // 选择可投稿的分类（section 或 general）
      let categoryPath = category.name
      if (selectedCampus) {
        categoryPath = `${selectedCampus.name} > ${category.name}`
      }
      onCategorySelect(category.id, categoryPath)
    }
  }

  // 返回上级
  const goBack = () => {
    if (currentLevel === 'campus') {
      setCurrentLevel('root')
      setSelectedCampus(null)
    }
  }

  // 获取当前显示的分类列表
  const getCurrentCategories = () => {
    if (currentLevel === 'root') {
      // 显示所有顶级分类（校区 + 通用篇章）
      return categories.filter(cat => !cat.parent_id)
    } else if (currentLevel === 'campus' && selectedCampus) {
      // 显示选定校区的子篇章
      return selectedCampus.children || []
    }
    return []
  }

  const currentCategories = getCurrentCategories()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm text-gray-600">加载分类中...</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          选择分类 *
          {currentLevel === 'campus' && selectedCampus && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              {selectedCampus.name} 的篇章
            </span>
          )}
        </Label>

        {currentLevel === 'campus' && (
          <Button type="button" variant="outline" size="sm" onClick={goBack} className="h-7 px-2">
            <ChevronLeft className="w-3 h-3 mr-1" />
            返回
          </Button>
        )}
      </div>

      <div className="border border-slate-200 rounded-lg max-h-96 overflow-y-auto bg-white">
        {currentCategories.length > 0 ? (
          currentCategories.map((category, index) => {
            const isSelected = selectedCategoryId === category.id

            return (
              <div
                key={category.id}
                className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                } ${index !== currentCategories.length - 1 ? 'border-b border-slate-100' : ''}`}
                onClick={() => handleCategorySelect(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-base">{category.icon || '📁'}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm text-slate-900">{category.name}</span>
                      <Badge className={`text-xs ${getTypeColor(category.type)}`} variant="outline">
                        {category.type === 'campus'
                          ? '校区'
                          : category.type === 'section'
                            ? '篇章'
                            : '通用'}
                      </Badge>
                    </div>
                  </div>

                  {category.type === 'campus' && category.children && (
                    <span className="text-xs text-slate-500">
                      {category.children.length} 个篇章
                    </span>
                  )}
                </div>

                {category.description && (
                  <p className="text-xs text-slate-600 mt-1 ml-8">{category.description}</p>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">
              {currentLevel === 'campus' ? '该校区暂无篇章' : '暂无可选分类'}
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="text-xs text-gray-500 mt-2">
        <p>💡 提示：校区包含多个篇章，请选择具体篇章投稿</p>
      </div>
    </div>
  )
}
