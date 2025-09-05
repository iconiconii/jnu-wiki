'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { FilterState, ServiceQuery } from '@/types/services'
import {
  parseSearchParams,
  buildSearchParams,
  filterStateToQuery,
  queryToFilterState,
  DEFAULT_FILTER_STATE,
} from '@/lib/query'

/**
 * URL状态管理Hook
 * 用于同步筛选状态与URL参数
 */
export function useUrlState() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // 从URL解析当前筛选状态
  const getCurrentFilterState = useCallback((): FilterState => {
    const query = parseSearchParams(searchParams)
    return queryToFilterState(query)
  }, [searchParams])

  // 更新URL参数
  const updateUrl = useCallback(
    (filterState: FilterState, options?: { replace?: boolean }) => {
      const query = filterStateToQuery(filterState)
      const newSearchParams = buildSearchParams(query)
      const newUrl = `${pathname}?${newSearchParams.toString()}`

      if (options?.replace) {
        router.replace(newUrl)
      } else {
        router.push(newUrl)
      }
    },
    [router, pathname]
  )

  // 重置到默认状态
  const resetFilters = useCallback(() => {
    const defaultState = { ...DEFAULT_FILTER_STATE }
    updateUrl(defaultState, { replace: true })
  }, [updateUrl])

  // 更新单个筛选条件
  const updateFilter = useCallback(
    (updates: Partial<FilterState>, options?: { replace?: boolean }) => {
      const currentState = getCurrentFilterState()
      const newState = { ...currentState, ...updates }

      // 如果筛选条件发生变化，重置到第一页
      const hasFilterChange = Object.keys(updates).some(
        key =>
          key !== 'page' &&
          key !== 'limit' &&
          updates[key as keyof FilterState] !== currentState[key as keyof FilterState]
      )

      if (hasFilterChange) {
        newState.page = 1
      }

      updateUrl(newState, options)
    },
    [getCurrentFilterState, updateUrl]
  )

  // 使用 useMemo 缓存 filterState，避免每次渲染都创建新对象
  const filterState = useMemo(() => {
    const query = parseSearchParams(searchParams)
    return queryToFilterState(query)
  }, [searchParams])

  return {
    filterState,
    updateFilter,
    updateUrl,
    resetFilters,
  }
}

/**
 * 简化版URL状态Hook，只处理查询参数
 * 用于API调用
 */
export function useQueryParams(): ServiceQuery {
  const searchParams = useSearchParams()

  return parseSearchParams(searchParams)
}
