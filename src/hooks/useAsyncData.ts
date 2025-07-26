import { useState, useEffect, useCallback, useRef } from 'react'
import { useApiErrorHandler } from './useErrorHandler'

interface UseAsyncDataOptions<T> {
  initialData?: T
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
}

interface UseAsyncDataReturn<T> {
  data: T | null
  loading: boolean
  error: any
  execute: () => Promise<void>
  reset: () => void
}

/**
 * 异步数据获取Hook
 * 提供加载状态、错误处理和取消机制
 */
export function useAsyncData<T>(
  asyncFn: () => Promise<T>,
  deps: any[] = [],
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const {
    initialData = null,
    immediate = true,
    onSuccess,
    onError
  } = options

  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const { handleApiError } = useApiErrorHandler()
  const isMountedRef = useRef(true)

  const execute = useCallback(async () => {
    if (!isMountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const result = await asyncFn()
      
      if (isMountedRef.current) {
        setData(result)
        onSuccess?.(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err)
        handleApiError(err)
        onError?.(err)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [asyncFn, handleApiError, onSuccess, onError])

  const reset = useCallback(() => {
    setData(initialData)
    setLoading(false)
    setError(null)
  }, [initialData])

  useEffect(() => {
    if (immediate) {
      execute()
    }
    
    return () => {
      isMountedRef.current = false
    }
  }, deps)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

/**
 * 分页数据获取Hook
 */
interface UsePaginatedDataOptions<T> {
  pageSize?: number
  initialPage?: number
}

interface UsePaginatedDataReturn<T> {
  data: T[]
  loading: boolean
  error: any
  page: number
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
}

export function usePaginatedData<T>(
  asyncFn: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  deps: any[] = [],
  options: UsePaginatedDataOptions<T> = {}
): UsePaginatedDataReturn<T> {
  const { pageSize = 10, initialPage = 1 } = options
  
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [page, setPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(true)
  const { handleApiError } = useApiErrorHandler()
  const isMountedRef = useRef(true)

  const loadData = useCallback(async (pageNum: number, append = false) => {
    if (!isMountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const result = await asyncFn(pageNum, pageSize)
      
      if (isMountedRef.current) {
        setData(prev => append ? [...prev, ...result.data] : result.data)
        setHasMore(result.hasMore)
        setPage(pageNum)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err)
        handleApiError(err)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [asyncFn, pageSize, handleApiError])

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await loadData(page + 1, true)
    }
  }, [hasMore, loading, page, loadData])

  const refresh = useCallback(async () => {
    await loadData(initialPage, false)
  }, [loadData, initialPage])

  const reset = useCallback(() => {
    setData([])
    setLoading(false)
    setError(null)
    setPage(initialPage)
    setHasMore(true)
  }, [initialPage])

  useEffect(() => {
    loadData(initialPage, false)
    
    return () => {
      isMountedRef.current = false
    }
  }, deps)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    loadMore,
    refresh,
    reset
  }
}
