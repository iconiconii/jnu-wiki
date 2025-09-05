'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { HierarchicalCategoryManager } from '@/components/admin/HierarchicalCategoryManager'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  ArrowLeft,
  Star,
  Grid3X3,
  List,
  TreePine,
} from 'lucide-react'
import { DatabaseCategory, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/services'
import { useRouter } from 'next/navigation'

export default function CategoriesManagePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<DatabaseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<DatabaseCategory | null>(null)
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical')
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    icon: '',
    description: '',
    color: 'blue',
    type: 'general',
    parent_id: null,
    featured: false,
    sort_order: 0,
  })

  // 处理认证相关错误
  const handleAuthError = (error: unknown) => {
    if (
      error instanceof Error &&
      (error.message.includes('未认证') ||
        error.message.includes('认证失败') ||
        error.message.includes('无效的 token') ||
        error.message.includes('token') ||
        error.message.includes('Unauthorized'))
    ) {
      // 清除本地存储的token
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push('/admin/login')
      return true
    }
    return false
  }

  // 使用认证的API请求
  const authenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token')

    if (!token) {
      throw new Error('未认证')
    }

    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${token}`)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '服务器错误' }))
        throw new Error(errorData.error || '请求失败')
      }

      return response.json()
    } catch (error) {
      console.error('Authenticated request error:', error)
      throw error
    }
  }

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    console.log('Loading categories...')
    setLoading(true)
    try {
      const data = await authenticatedRequest('/api/categories?include_services=true')
      console.log('Categories loaded successfully:', data)
      setCategories(data.categories)
    } catch (error) {
      console.error('Load categories error:', error)
      // 如果是认证错误，处理后直接返回
      if (handleAuthError(error)) {
        return
      }
      // 其他错误可以在这里处理
      console.error('非认证错误:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  // 检查认证状态
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }
    loadCategories()
  }, [router, loadCategories])

  // 创建或更新分类
  const handleSave = async () => {
    try {
      if (editingCategory) {
        const payload = { id: editingCategory.id, ...formData } as UpdateCategoryRequest
        await authenticatedRequest('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await authenticatedRequest('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }

      loadCategories()
      handleCloseDialog()
    } catch (error) {
      console.error('Save category error:', error)
      // 如果是认证错误，处理后直接返回
      if (handleAuthError(error)) {
        return
      }
      // 其他错误显示提示
      alert(error instanceof Error ? error.message : '保存失败')
    }
  }

  // 删除分类
  const handleDelete = async (category: DatabaseCategory) => {
    if (!confirm(`确定要删除分类"${category.name}"吗？`)) {
      return
    }

    try {
      await authenticatedRequest(`/api/categories?id=${category.id}`, {
        method: 'DELETE',
      })
      loadCategories()
    } catch (error) {
      console.error('Delete category error:', error)
      // 如果是认证错误，处理后直接返回
      if (handleAuthError(error)) {
        return
      }
      // 其他错误显示提示
      alert(error instanceof Error ? error.message : '删除失败')
    }
  }

  // 打开编辑对话框
  const handleEdit = (category: DatabaseCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '',
      description: category.description || '',
      color: category.color,
      type: category.type,
      featured: category.featured,
      sort_order: category.sort_order,
    })
    setShowDialog(true)
  }

  // 打开创建对话框
  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      icon: '',
      description: '',
      color: 'blue',
      type: 'general',
      featured: false,
      sort_order: categories.length,
    })
    setShowDialog(true)
  }

  // 关闭对话框
  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingCategory(null)
  }

  // 注销功能
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <h1 className="text-xl font-bold text-slate-900">分类管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                新建分类
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                注销
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Mode Toggle */}
        <div className="mb-6 flex justify-end">
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'hierarchical' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('hierarchical')}
              className="rounded-r-none"
            >
              <TreePine className="h-4 w-4 mr-2" />
              层级视图
            </Button>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('flat')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4 mr-2" />
              列表视图
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'hierarchical' ? (
          <HierarchicalCategoryManager
            categories={categories}
            onRefresh={loadCategories}
            onAuthError={error => {
              if (handleAuthError(error)) {
                return
              }
              console.error('其他错误:', error)
            }}
          />
        ) : (
          /* 分类列表 */
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">暂无分类数据</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个分类
                </Button>
              </div>
            ) : (
              categories.map(category => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{category.icon || '📦'}</span>
                          <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                          {category.featured && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              推荐
                            </Badge>
                          )}
                          <Badge variant="secondary">{category.color}</Badge>
                        </div>

                        {category.description && (
                          <p className="text-slate-600 mb-3">{category.description}</p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>排序: {category.sort_order}</span>
                          <span>服务数: {category.services?.length || 0}</span>
                          <span>创建时间: {new Date(category.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(`/admin/services?category=${category.id}`, '_blank')
                          }
                        >
                          <Grid3X3 className="h-4 w-4 mr-1" />
                          管理服务
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4 mr-1" />
                          编辑
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* 创建/编辑对话框 */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '创建分类'}</DialogTitle>
            <DialogDescription>填写分类信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称 *</Label>
              <Input
                id="name"
                placeholder="请输入分类名称"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">图标 (emoji)</Label>
              <Input
                id="icon"
                placeholder="🎓"
                value={formData.icon}
                onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                placeholder="请输入分类描述"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">颜色</Label>
                <select
                  id="color"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  value={formData.color}
                  onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                >
                  <option value="blue">蓝色</option>
                  <option value="green">绿色</option>
                  <option value="red">红色</option>
                  <option value="yellow">黄色</option>
                  <option value="purple">紫色</option>
                  <option value="pink">粉色</option>
                  <option value="gray">灰色</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">排序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  placeholder="0"
                  value={formData.sort_order}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <Label htmlFor="featured">设为推荐分类</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
