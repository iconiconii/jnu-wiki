import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2, 
  ChevronRight,
  ChevronDown,
  
} from 'lucide-react'
import { DatabaseCategory, CreateCategoryRequest } from '@/types/services'
import { cn } from '@/lib/utils'

interface HierarchicalCategoryManagerProps {
  categories: DatabaseCategory[]
  onRefresh: () => Promise<void>
  onAuthError: (error: unknown) => void
}

interface CategoryFormData extends CreateCategoryRequest {
  id?: string
}

export function HierarchicalCategoryManager({ 
  categories, 
  onRefresh, 
  onAuthError 
}: HierarchicalCategoryManagerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showDialog, setShowDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<DatabaseCategory | null>(null)
  const [parentCategory, setParentCategory] = useState<DatabaseCategory | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    icon: '',
    description: '',
    color: 'blue',
    type: 'general',
    parent_id: null,
    featured: false,
    sort_order: 0
  })

  // 组织分类为树形结构
  const organizeCategories = (cats: DatabaseCategory[]) => {
    const topLevel = cats.filter(cat => !cat.parent_id)
    const childrenMap = new Map<string, DatabaseCategory[]>()
    
    cats.forEach(cat => {
      if (cat.parent_id) {
        if (!childrenMap.has(cat.parent_id)) {
          childrenMap.set(cat.parent_id, [])
        }
        childrenMap.get(cat.parent_id)!.push(cat)
      }
    })
    
    return { topLevel, childrenMap }
  }

  const { topLevel, childrenMap } = organizeCategories(categories)

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Icon helper not used currently; remove to satisfy lint

  const getCategoryTypeLabel = (type: string) => {
    switch (type) {
      case 'campus': return '校区'
      case 'section': return '篇章'
      case 'general': return '通用'
      default: return '未知'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'campus': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'section': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'general': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const openCreateDialog = (parent?: DatabaseCategory) => {
    setEditingCategory(null)
    setParentCategory(parent || null)
    setFormData({
      name: '',
      icon: '',
      description: '',
      color: 'blue',
      type: parent ? 'section' : 'general',
      parent_id: parent?.id || null,
      featured: false,
      sort_order: 0
    })
    setShowDialog(true)
  }

  const openEditDialog = (category: DatabaseCategory) => {
    setEditingCategory(category)
    setParentCategory(null)
    setFormData({
      id: category.id,
      name: category.name,
      icon: category.icon || '',
      description: category.description || '',
      color: category.color,
      type: category.type,
      parent_id: category.parent_id,
      featured: category.featured,
      sort_order: category.sort_order
    })
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingCategory(null)
    setParentCategory(null)
    setFormData({
      name: '',
      icon: '',
      description: '',
      color: 'blue',
      type: 'general',
      parent_id: null,
      featured: false,
      sort_order: 0
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        throw new Error('未找到认证token')
      }

      const url = editingCategory ? '/api/categories' : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingCategory ? formData : {
          name: formData.name,
          icon: formData.icon,
          description: formData.description,
          color: formData.color,
          type: formData.type,
          parent_id: formData.parent_id,
          featured: formData.featured,
          sort_order: formData.sort_order
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '操作失败')
      }

      await onRefresh()
      closeDialog()
    } catch (error) {
      console.error('保存分类失败:', error)
      onAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (category: DatabaseCategory) => {
    if (!confirm(`确定要删除分类 "${category.name}" 吗？`)) {
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        throw new Error('未找到认证token')
      }

      const response = await fetch(`/api/categories?id=${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除失败')
      }

      await onRefresh()
    } catch (error) {
      console.error('删除分类失败:', error)
      onAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const renderCategory = (category: DatabaseCategory, level: number = 0) => {
    const hasChildren = childrenMap.has(category.id)
    const isExpanded = expandedCategories.has(category.id)
    const children = childrenMap.get(category.id) || []

    return (
      <div key={category.id} className={cn("border rounded-lg", level > 0 && "ml-6 mt-2")}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {/* Expand/Collapse button */}
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(category.id)}
                    className="p-1 h-6 w-6"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}
                
                {/* Category info */}
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{category.icon || '📁'}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge className={cn("text-xs", getTypeColor(category.type))}>
                        {getCategoryTypeLabel(category.type)}
                      </Badge>
                      {category.featured && (
                        <Badge variant="secondary" className="text-xs">
                          推荐
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>排序: {category.sort_order}</span>
                      <span>颜色: {category.color}</span>
                      {hasChildren && <span>子分类: {children.length}</span>}
                      {category.services && <span>服务: {category.services.length}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                {category.type === 'campus' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateDialog(category)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加篇章
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">分类管理（层级模式）</h2>
          <p className="text-gray-600 mt-1">管理校区、篇章和通用分类</p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={() => openCreateDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            新建分类
          </Button>
        </div>
      </div>

      {/* Category tree */}
      <div className="space-y-4">
        {topLevel.length > 0 ? (
          topLevel.map(category => renderCategory(category))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>暂无分类数据</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? '编辑分类' : '新建分类'}
            </DialogTitle>
            <DialogDescription>
              {parentCategory 
                ? `为 "${parentCategory.name}" 创建子分类` 
                : editingCategory 
                  ? '修改分类信息' 
                  : '创建新的顶级分类'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">名称*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="分类名称"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="icon">图标</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🏫"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="分类描述"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">类型</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'campus' | 'section' | 'general' })}
                  className="w-full border rounded px-3 py-2"
                  disabled={!!parentCategory || !!editingCategory}
                >
                  <option value="campus">校区</option>
                  <option value="section">篇章</option>
                  <option value="general">通用</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="color">颜色</Label>
                <select
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="blue">蓝色</option>
                  <option value="green">绿色</option>
                  <option value="purple">紫色</option>
                  <option value="orange">橙色</option>
                  <option value="red">红色</option>
                  <option value="yellow">黄色</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sort_order">排序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <input
                  id="featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <Label htmlFor="featured">推荐</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingCategory ? '保存' : '创建'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
