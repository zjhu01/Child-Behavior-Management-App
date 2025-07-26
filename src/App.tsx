import React, { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { useAppStore } from './store'
import AppRouter from './router'
import './index.css'

function App() {
  const { initializeApp } = useAppStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 初始化应用状态
    const init = async () => {
      await initializeApp()
      setIsInitialized(true)
    }
    init()
  }, [])

  // 显示加载状态直到初始化完成
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">正在初始化...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 路由组件 */}
      <AppRouter />

      {/* 全局通知组件 */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px'
          }
        }}
      />
    </div>
  )
}

export default App