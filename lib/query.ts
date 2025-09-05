import { ServiceQuery, FilterState, SortOption } from '@/types/services'

// 默认查询参数
export const DEFAULT_QUERY: ServiceQuery = {
  search: undefined,
  category: undefined,
  tags: undefined,
  ratingMin: undefined,
  sort: 'newest',
  page: 1,
  limit: 12,
}

// 默认筛选状态
export const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  category: '',
  tags: [],
  ratingMin: null,
  sort: 'newest',
  page: 1,
  limit: 12,
}

/**
 * 将URLSearchParams转换为ServiceQuery对象
 */
export function parseSearchParams(searchParams: URLSearchParams): ServiceQuery {
  const query: ServiceQuery = { ...DEFAULT_QUERY }

  // 基础字符串参数
  const search = searchParams.get('search')
  if (search && search.trim()) {
    query.search = search.trim()
  }

  const category = searchParams.get('category')
  if (category && category.trim()) {
    query.category = category.trim()
  }

  const tags = searchParams.get('tags')
  if (tags && tags.trim()) {
    query.tags = tags.trim()
  }

  const ratingMin = searchParams.get('ratingMin')
  if (ratingMin) {
    const parsed = Number(ratingMin)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
      query.ratingMin = parsed
    }
  }

  // 排序参数
  const sort = searchParams.get('sort') as SortOption
  if (sort && ['newest', 'rating_desc', 'price_asc', 'price_desc'].includes(sort)) {
    query.sort = sort
  }

  // 分页参数
  const page = searchParams.get('page')
  if (page) {
    const parsed = Number(page)
    if (!isNaN(parsed) && parsed >= 1) {
      query.page = parsed
    }
  }

  const limit = searchParams.get('limit')
  if (limit) {
    const parsed = Number(limit)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      query.limit = parsed
    }
  }

  // 无价格区间逻辑（A 路线：纯分享，不涉及价格）

  return query
}

/**
 * 将ServiceQuery对象转换为URLSearchParams
 */
export function buildSearchParams(query: ServiceQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.search && query.search.trim()) {
    params.set('search', query.search.trim())
  }

  if (query.category && query.category.trim()) {
    params.set('category', query.category.trim())
  }

  if (query.tags && query.tags.trim()) {
    params.set('tags', query.tags.trim())
  }

  if (query.ratingMin !== undefined && query.ratingMin >= 1 && query.ratingMin <= 5) {
    params.set('ratingMin', query.ratingMin.toString())
  }

  if (query.sort && query.sort !== 'newest') {
    params.set('sort', query.sort)
  }

  if (query.page !== undefined && query.page > 1) {
    params.set('page', query.page.toString())
  }

  if (query.limit !== undefined) {
    params.set('limit', query.limit.toString())
  }

  return params
}

/**
 * 将FilterState转换为ServiceQuery
 */
export function filterStateToQuery(filterState: FilterState): ServiceQuery {
  const query: ServiceQuery = {
    search: filterState.search.trim() || undefined,
    category: filterState.category.trim() || undefined,
    tags: filterState.tags.length > 0 ? filterState.tags.join(',') : undefined,
    ratingMin: filterState.ratingMin ?? undefined,
    sort: filterState.sort,
    page: filterState.page,
    limit: filterState.limit,
  }

  return query
}

/**
 * 将ServiceQuery转换为FilterState
 */
export function queryToFilterState(query: ServiceQuery): FilterState {
  const filterState: FilterState = {
    search: query.search || '',
    category: query.category || '',
    tags: query.tags
      ? query.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean)
      : [],
    ratingMin: query.ratingMin ?? null,
    sort: query.sort || 'newest',
    page: query.page || 1,
    limit: query.limit || 20,
  }

  return filterState
}

/**
 * 检查筛选条件是否为空（是否应用了任何筛选）
 */
export function isFilterEmpty(query: ServiceQuery): boolean {
  return (
    !query.search &&
    !query.category &&
    !query.tags &&
    query.ratingMin === undefined &&
    query.sort === 'newest'
  )
}

/**
 * 清空筛选条件，保留分页信息
 */
export function clearFilters(query: ServiceQuery): ServiceQuery {
  return {
    ...DEFAULT_QUERY,
    page: query.page,
    limit: query.limit,
  }
}

/**
 * 生成筛选条件的可读描述
 */
export function getFilterDescription(query: ServiceQuery): string {
  const conditions: string[] = []

  if (query.search) {
    conditions.push(`搜索"${query.search}"`)
  }

  if (query.category) {
    conditions.push(`分类筛选`)
  }

  if (query.tags) {
    const tagArray = query.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
    if (tagArray.length > 0) {
      conditions.push(`标签：${tagArray.join('、')}`)
    }
  }

  // A 路线：无价格/免费筛选描述

  if (query.ratingMin !== undefined) {
    conditions.push(`评分：≥${query.ratingMin}星`)
  }

  if (conditions.length === 0) {
    return '无筛选条件'
  }

  return conditions.join('、')
}
