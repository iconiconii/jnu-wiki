"use client"

import { useState, useEffect } from "react"
import { Search, GraduationCap, Shield, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthDialog } from "@/components/auth-dialog"
import { SubmissionForm } from "@/components/SubmissionForm"
import { ServicesGrid } from "@/components/ServicesGrid"
import { HierarchicalServicesGrid } from "@/components/HierarchicalServicesGrid"
import { FeedbackButton } from "@/components/FeedbackButton"
import { getCategoriesWithServices, getHierarchicalCategories } from "@/lib/services-data"
import { Service, CategoryConfig, DatabaseCategory } from "@/types/services"

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [servicesConfig, setServicesConfig] = useState<CategoryConfig>({ categories: [] })
  const [hierarchicalCategories, setHierarchicalCategories] = useState<DatabaseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [useHierarchical, setUseHierarchical] = useState(true)

  useEffect(() => {
    // 自动触发认证对话框
    if (!isAuthenticated) {
      setShowAuthDialog(true)
    }
  }, [isAuthenticated])

  // 加载服务数据
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        
        if (useHierarchical) {
          // 加载新的层级结构数据
          const hierarchicalData = await getHierarchicalCategories()
          setHierarchicalCategories(hierarchicalData)
        } else {
          // 兼容性：加载旧的平均结构数据
          const data = await getCategoriesWithServices()
          setServicesConfig(data)
        }
      } catch (error) {
        console.error('加载服务数据失败:', error)
        // 失败时回退到旧版本
        if (useHierarchical) {
          console.log('回退到旧版本...')
          setUseHierarchical(false)
          try {
            const fallbackData = await getCategoriesWithServices()
            setServicesConfig(fallbackData)
          } catch (fallbackError) {
            console.error('回退也失败:', fallbackError)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [useHierarchical])

  // 认证成功回调
  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    setShowAuthDialog(false)
  }

  // 认证失败回调 - 认证失败时可以选择重新尝试或退出
  const handleAuthFailed = () => {
    // 可以在这里添加退出逻辑，比如跳转到其他页面
    console.log('认证失败')
  }

  // 访问服务
  const handleServiceAccess = (service: Service) => {
    if (service.href) {
      window.open(service.href, '_blank', 'noopener,noreferrer')
    }
  }


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-900">Jnu Wiki</span>
                </div>
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
                  服务中心
                </a>
                <a href="#" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
                  学习工具
                </a>
                <a href="#" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
                  学术资源
                </a>
                <button 
                  onClick={() => {/* TODO: 打开反馈弹窗 */}} 
                  className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
                >
                  意见反馈
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="搜索服务和资源..."
                  className="pl-10 w-72 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                onClick={() => setShowSubmissionForm(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                投稿
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Jnu Wiki</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              指南 OR 工具 OR 资源 in Jnu
            </p>
          </div>
        </div>


        {/* Services Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <span className="ml-3 text-slate-600">加载服务数据...</span>
          </div>
        ) : !isAuthenticated ? (
          <div className="relative">
            {/* 模糊内容背景 */}
            <div className="filter blur-sm pointer-events-none">
              <ServicesGrid
                categories={servicesConfig.categories}
                searchTerm=""
                onServiceAccess={handleServiceAccess}
                defaultImage="/images/default-service.svg"
              />
            </div>
            
            {/* 认证提示遮罩层 */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/95 backdrop-blur-sm">
              <div className="text-center p-8 bg-white rounded-xl shadow-xl border border-slate-200 max-w-md mx-4">
                <div className="bg-slate-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">校园身份验证</h2>
                <p className="text-slate-600 mb-6">请验证您的暨南大学身份以访问专属资源</p>
                <Button 
                  onClick={() => setShowAuthDialog(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2"
                >
                  开始验证
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  确保资源访问的安全性和专属性
                </p>
              </div>
            </div>
          </div>
        ) : useHierarchical ? (
          // 已认证时显示新的层级结构
          <HierarchicalServicesGrid
            categories={hierarchicalCategories}
            searchTerm={searchTerm}
            onServiceAccess={handleServiceAccess}
            defaultImage="/images/default-service.svg"
          />
        ) : (
          // 回退方案：显示旧版本
          <ServicesGrid
            categories={servicesConfig.categories}
            searchTerm={searchTerm}
            onServiceAccess={handleServiceAccess}
            defaultImage="/images/default-service.svg"
          />
        )}
      </main>

      {/* 认证对话框 */}
      <AuthDialog
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthSuccess={handleAuthSuccess}
        onAuthFailed={handleAuthFailed}
        allowClose={isAuthenticated} // 只有已认证后才允许关闭
      />

      {/* 投稿表单 */}
      <SubmissionForm
        isOpen={showSubmissionForm}
        onOpenChange={setShowSubmissionForm}
      />
      
      {/* 悬浮反馈按钮 */}
      {isAuthenticated && <FeedbackButton />}
    </div>
  )
}
