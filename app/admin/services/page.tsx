"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  Save,
  X,
  Loader2,
  ArrowLeft,
  Star,
  Search,
  Filter,
  Grid3X3
} from 'lucide-react'
import { DatabaseService, DatabaseCategory, CreateServiceRequest, UpdateServiceRequest } from '@/types/services'

export default function ServicesManagePage() {
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [services, setServices] = useState<DatabaseService[]>([])
  const [categories, setCategories] = useState<DatabaseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingService, setEditingService] = useState<DatabaseService | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [formData, setFormData] = useState<CreateServiceRequest>({
    category_id: '',
    title: '',
    description: '',
    tags: [],
    image: '',
    href: '',
    status: 'active',
    featured: false,
    sort_order: 0
  })

  // 认证检查
  const handleAuth = () => {
    if (adminKey === process.env.NEXT_PUBLIC_ADMIN_DEMO_KEY || adminKey) {
      setIsAuthenticated(true)
      loadData()
    }
  }

  // 加载数据
  const loadData = async () => {
    if (!isAuthenticated || !adminKey) return
    
    setLoading(true)
    try {
      // 并行加载分类和服务
      const [categoriesRes, servicesRes] = await Promise.all([
        fetch(`/api/categories?admin_key=${adminKey}`),
        fetch(`/api/services?admin_key=${adminKey}&limit=100`)
      ])
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData.categories)
      }
      
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData.services)
      }
    } catch (error) {
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 创建或更新服务
  const handleSave = async () => {
    if (!adminKey) return
    
    try {
      const url = `/api/services?admin_key=${adminKey}`
      
      const payload = editingService 
        ? { id: editingService.id, ...formData } as UpdateServiceRequest
        : formData as CreateServiceRequest

      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        loadData()
        handleCloseDialog()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '操作失败')
      }
    } catch (error) {
      console.error('Save service error:', error)
      alert('保存失败')
    }
  }

  // 删除服务
  const handleDelete = async (service: DatabaseService) => {
    if (!adminKey) return
    
    if (!confirm(`确定要删除服务"${service.title}"吗？`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/services?admin_key=${adminKey}&id=${service.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadData()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '删除失败')
      }
    } catch (error) {
      console.error('Delete service error:', error)
      alert('删除失败')
    }
  }

  // 打开编辑对话框
  const handleEdit = (service: DatabaseService) => {
    setEditingService(service)
    setFormData({
      category_id: service.category_id,
      title: service.title,
      description: service.description || '',
      tags: service.tags || [],
      image: service.image || '',
      href: service.href || '',
      status: service.status,
      featured: service.featured,
      sort_order: service.sort_order
    })
    setShowDialog(true)
  }

  // 打开创建对话框
  const handleCreate = () => {
    setEditingService(null)
    setFormData({
      category_id: categories.length > 0 ? categories[0].id : '',
      title: '',
      description: '',
      tags: [],
      image: '',
      href: '',
      status: 'active',
      featured: false,
      sort_order: services.length
    })
    setShowDialog(true)
  }

  // 关闭对话框
  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingService(null)
  }

  // 处理标签输入
  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({ ...prev, tags }))
  }

  // 过滤服务
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || service.category_id === selectedCategory
    const matchesStatus = !selectedStatus || service.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  // 未认证界面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>服务管理系统</CardTitle>
            <CardDescription>请输入管理员密钥访问</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key">管理员密钥</Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="请输入管理员密钥"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <Button onClick={handleAuth} className="w-full bg-slate-900 hover:bg-slate-800">
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <h1 className="text-xl font-bold text-slate-900">服务管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/admin/categories', '_blank')}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                管理分类
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                新建服务
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索服务..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-slate-200 rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">全部分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-slate-200 rounded-md"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
              <option value="pending">待审核</option>
            </select>
            <div className="text-sm text-slate-600 flex items-center">
              共 {filteredServices.length} 个服务
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* 服务列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">暂无服务数据</p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                创建第一个服务
              </Button>
            </div>
          ) : (
            filteredServices.map((service) => {
              const category = categories.find(c => c.id === service.category_id)
              return (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {service.title}
                          </h3>
                          {service.featured && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              推荐
                            </Badge>
                          )}
                          <Badge 
                            variant={service.status === 'active' ? 'default' : service.status === 'pending' ? 'secondary' : 'outline'}
                          >
                            {service.status === 'active' ? '活跃' : service.status === 'pending' ? '待审核' : '停用'}
                          </Badge>
                          {category && (
                            <Badge variant="secondary">
                              {category.icon} {category.name}
                            </Badge>
                          )}
                        </div>
                        
                        {service.description && (
                          <p className="text-slate-600 mb-3">
                            {service.description}
                          </p>
                        )}
                        
                        {service.tags && service.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {service.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>排序: {service.sort_order}</span>
                          {service.href && (
                            <a 
                              href={service.href} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center hover:text-slate-700"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              访问链接
                            </a>
                          )}
                          <span>创建时间: {new Date(service.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                          onClick={() => handleDelete(service)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>

      {/* 创建/编辑对话框 */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? '编辑服务' : '创建服务'}
            </DialogTitle>
            <DialogDescription>
              填写服务信息
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">所属分类 *</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">活跃</option>
                  <option value="inactive">停用</option>
                  <option value="pending">待审核</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">服务标题 *</Label>
              <Input
                id="title"
                placeholder="请输入服务标题"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-md"
                placeholder="请输入服务描述"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="href">访问链接</Label>
              <Input
                id="href"
                type="url"
                placeholder="https://example.com"
                value={formData.href}
                onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">图标链接</Label>
              <Input
                id="image"
                type="url"
                placeholder="https://example.com/icon.png"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签 (用逗号分隔)</Label>
              <Input
                id="tags"
                placeholder="学习,工具,资源"
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">排序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  placeholder="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="featured">设为推荐服务</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
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