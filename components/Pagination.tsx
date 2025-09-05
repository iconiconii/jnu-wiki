'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
  showInfo?: boolean
  maxVisiblePages?: number
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
  showInfo = true,
  maxVisiblePages = 5,
}: PaginationProps) {
  // 如果只有一页或没有数据，不显示分页
  if (totalPages <= 1 || totalItems === 0) {
    return null
  }

  // 计算显示的页码范围
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= maxVisiblePages) {
      // 总页数不超过最大显示数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 总页数超过最大显示数，需要省略
      const half = Math.floor(maxVisiblePages / 2)

      if (currentPage <= half + 1) {
        // 当前页靠近开头
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - half) {
        // 当前页靠近结尾
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - half + 1; i <= currentPage + half - 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  // 计算当前显示的项目范围
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      {/* 信息显示 */}
      {showInfo && (
        <div className="text-sm text-muted-foreground">
          显示第 {startItem}-{endItem} 项，共 {totalItems} 项
        </div>
      )}

      {/* 分页控件 */}
      <div className="flex items-center space-x-1">
        {/* 上一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="上一页"
          className="h-8 px-3"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 页码按钮 */}
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div
                key={`ellipsis-${index}`}
                className="h-8 px-3 flex items-center justify-center"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            )
          }

          return (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageClick(page)}
              aria-label={`第 ${page} 页`}
              aria-current={page === currentPage ? 'page' : undefined}
              className="h-8 px-3"
            >
              {page}
            </Button>
          )
        })}

        {/* 下一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="下一页"
          className="h-8 px-3"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
