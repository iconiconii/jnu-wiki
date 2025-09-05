'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, GraduationCap, Plus, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// 服务页：仅保留筛选与列表，不展示分类卡片
import { ServiceList } from '@/components/ServiceList'
import { Filters } from '@/components/Filters'
import { FilterChips } from '@/components/FilterChips'
import { SortSelect } from '@/components/SortSelect'
import { Pagination } from '@/components/Pagination'
import { getServices } from '@/lib/supabase'
import { useUrlState } from '@/hooks/useUrlState'
import { useDebounce } from '@/hooks/useDebounce'
import { Service, ServiceListResponse, FilterState } from '@/types/services'
import { useAuthGate } from '@/hooks/useAuthGate'
import { AuthDialog } from '@/components/auth-dialog'

export default function FilteredHomePage() {
  const { isVerified, markVerified } = useAuthGate()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // 筛选相关状态
  const { filterState, updateFilter, resetFilters } = useUrlState()
  const [filteredServices, setFilteredServices] = useState<ServiceListResponse>({
    items: [],
    page: 1,
    limit: 12,
    total: 0,
  })
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState<string | null>(null)

  // UI 状态
  const [showFilters, setShowFilters] = useState(false)

  // 无需加载分类数据

  // 防抖搜索函数
  const debouncedSearch = useDebounce((searchTerm: string) => {
    updateFilter({ search: searchTerm })
  }, 300)

  // 处理搜索输入变化
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  // 加载服务数据
  const loadServices = useCallback(async (filters: FilterState) => {
    try {
      setServicesLoading(true)
      setServicesError(null)

      const response = await getServices({
        search: filters.search || undefined,
        category: filters.category || undefined,
        tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
        ratingMin: filters.ratingMin ?? undefined,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit,
      })

      setFilteredServices(response)
    } catch (error) {
      console.error('加载服务失败:', error)
      setServicesError(error instanceof Error ? error.message : '加载服务失败')
    } finally {
      setServicesLoading(false)
    }
  }, [])

  // 当筛选条件变化时加载服务
  useEffect(() => {
    loadServices(filterState)
  }, [filterState, loadServices])

  // 首次访问需验证（24h 内免验证）
  useEffect(() => {
    if (isVerified) {
      setShowAuthDialog(false)
    } else {
      setShowAuthDialog(true)
    }
  }, [isVerified])

  const handleAuthSuccess = () => {
    markVerified()
    setShowAuthDialog(false)
  }

  // 移除重复的认证 effect 与处理器（合并于上方）

  // 访问服务
  const handleServiceAccess = (service: Service) => {
    if (service.href) {
      window.open(service.href, '_blank', 'noopener,noreferrer')
    }
  }

  // 处理筛选条件变化
  const handleFiltersChange = (newFilters: FilterState) => {
    updateFilter(newFilters, { replace: false })
  }

  // 处理排序变化
  const handleSortChange = (sort: FilterState['sort']) => {
    updateFilter({ sort })
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    updateFilter({ page })
  }

  // 清空筛选条件
  const handleClearFilters = () => {
    resetFilters()
  }

  // 重试加载
  const handleRetry = () => {
    loadServices(filterState)
  }

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = useMemo(() => {
    return (
      filterState.search ||
      filterState.category ||
      filterState.tags.length > 0 ||
      filterState.ratingMin !== null
    )
  }, [filterState])

  // 不需要初始加载占位

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
                <a
                  href="#"
                  className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
                >
                  服务中心
                </a>
                <a
                  href="#"
                  className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
                >
                  学习工具
                </a>
                <a
                  href="#"
                  className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
                >
                  学术资源
                </a>
                <button className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
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
                  defaultValue={filterState.search}
                  onChange={handleSearchChange}
                />
              </div>
              <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white" size="sm">
                <a href="/submit">
                  <Plus className="h-4 w-4 mr-2" />
                  投稿
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Jnu Wiki</h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">指南 OR 工具 OR 资源 in Jnu</p>
        </div>

        <div className="space-y-6">
          {/* 筛选控制栏 */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* 筛选按钮 */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                筛选
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                    {
                      [
                        filterState.search,
                        filterState.category,
                        filterState.tags.length > 0,
                        filterState.ratingMin !== null,
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </Button>

              {/* 仅列表视图，移除视图切换 */}
            </div>

            {/* 排序选择 */}
            <SortSelect value={filterState.sort} onChange={handleSortChange} />
          </div>

          {/* 筛选面板 */}
          {showFilters && <Filters filters={filterState} onFiltersChange={handleFiltersChange} />}

          {/* 已选筛选条件 */}
          <FilterChips filters={filterState} onFiltersChange={handleFiltersChange} />

          {/* 主内容区：服务列表 */}
          <ServiceList
            services={filteredServices.items}
            loading={servicesLoading}
            error={servicesError}
            total={filteredServices.total}
            onServiceAccess={handleServiceAccess}
            onRetry={handleRetry}
            onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          />

          {/* 分页 */}
          {filteredServices.total > 0 && (
            <Pagination
              currentPage={filterState.page}
              totalPages={Math.ceil(filteredServices.total / filterState.limit)}
              totalItems={filteredServices.total}
              itemsPerPage={filterState.limit}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </div>
      </main>

      {/* 认证对话框（仅首次，24h有效） */}
      <AuthDialog
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthSuccess={handleAuthSuccess}
        allowClose={isVerified}
      />
    </div>
  )
}
