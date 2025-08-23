import { useCallback, useRef } from 'react'

/**
 * 防抖 Hook
 * @param callback 需要防抖的回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 设置新的定时器
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  return debouncedCallback
}

/**
 * 防抖提交 Hook - 专门用于表单提交
 * @param submitFn 提交函数
 * @param delay 防抖延迟时间，默认 1000ms
 * @returns { debouncedSubmit, isSubmitting, lastSubmitTime }
 */
export function useDebouncedSubmit<T extends (...args: any[]) => Promise<any>>(
  submitFn: T,
  delay: number = 1000
) {
  const isSubmittingRef = useRef(false)
  const lastSubmitTimeRef = useRef<number>(0)

  const debouncedSubmit = useCallback(
    async (...args: Parameters<T>) => {
      const now = Date.now()
      
      // 如果正在提交，直接返回
      if (isSubmittingRef.current) {
        console.warn('表单正在提交中，请勿重复提交')
        return
      }

      // 检查是否在防抖时间内
      if (now - lastSubmitTimeRef.current < delay) {
        console.warn(`请等待 ${delay}ms 后再次提交`)
        return
      }

      try {
        isSubmittingRef.current = true
        lastSubmitTimeRef.current = now
        
        const result = await submitFn(...args)
        return result
      } finally {
        // 确保在提交完成后重置状态
        setTimeout(() => {
          isSubmittingRef.current = false
        }, Math.min(delay, 500)) // 至少等待 500ms 再允许下次提交
      }
    },
    [submitFn, delay]
  )

  return {
    debouncedSubmit: debouncedSubmit as T,
    isSubmitting: () => isSubmittingRef.current,
    getLastSubmitTime: () => lastSubmitTimeRef.current
  }
}