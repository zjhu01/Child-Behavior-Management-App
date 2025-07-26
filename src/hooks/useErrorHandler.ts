import { useCallback } from 'react'
import { toast } from 'sonner'

interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

/**
 * 错误处理Hook
 * 提供统一的错误处理逻辑
 */
export const useErrorHandler = () => {
  const handleError = useCallback((
    error: any, 
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = '操作失败，请稍后重试'
    } = options

    // 记录错误到控制台
    if (logError) {
      console.error('Error occurred:', error)
    }

    // 提取错误消息
    let errorMessage = fallbackMessage
    
    if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    // 显示错误提示
    if (showToast) {
      toast.error(errorMessage)
    }

    return errorMessage
  }, [])

  return { handleError }
}

/**
 * 网络错误处理Hook
 * 专门处理API请求错误
 */
export const useApiErrorHandler = () => {
  const handleApiError = useCallback((error: any) => {
    let errorMessage = '网络请求失败'

    // 处理不同类型的错误
    if (error?.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络设置'
    } else if (error?.code === 'TIMEOUT') {
      errorMessage = '请求超时，请稍后重试'
    } else if (error?.response?.status === 401) {
      errorMessage = '登录已过期，请重新登录'
      // 这里可以触发登出逻辑
    } else if (error?.response?.status === 403) {
      errorMessage = '没有权限执行此操作'
    } else if (error?.response?.status === 404) {
      errorMessage = '请求的资源不存在'
    } else if (error?.response?.status >= 500) {
      errorMessage = '服务器错误，请稍后重试'
    } else if (error?.message) {
      errorMessage = error.message
    }

    console.error('API Error:', error)
    toast.error(errorMessage)
    
    return errorMessage
  }, [])

  return { handleApiError }
}

/**
 * 异步操作错误处理Hook
 * 用于处理async/await中的错误
 */
export const useAsyncErrorHandler = () => {
  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      console.error('Async operation failed:', error)
      toast.error(errorMessage || '操作失败，请稍后重试')
      return null
    }
  }, [])

  return { handleAsyncError }
}
