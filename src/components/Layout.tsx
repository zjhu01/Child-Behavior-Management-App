import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store'
import {
  Home,
  TrendingUp,
  Gift,
  BarChart3,
  Settings,
  LogOut,
  User,
  Users
} from 'lucide-react'
import { toast } from 'sonner'
import ParentAuthModal from './ParentAuthModal'
import ChildSelector from './ChildSelector'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    user,
    viewMode,
    logout,
    switchToChildView,
    switchToParentView,
    setViewMode
  } = useAppStore()

  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // 处理登出
  const handleLogout = () => {
    logout()
    toast.success('已退出登录')
    navigate('/login')
  }
  
  // 角色切换
  const handleRoleSwitch = async () => {
    if (!user) return

    // 如果用户是儿童角色，不允许切换
    if (user.role === 'child') {
      toast.error('儿童用户无法切换到家长端')
      return
    }

    // 家长用户的视图模式切换
    if (viewMode === 'parent') {
      // 从家长端切换到儿童端，直接切换
      switchToChildView()
      navigate('/child')
      toast.success('已切换到儿童端')
    } else {
      // 从儿童端切换到家长端，需要验证
      const canSwitch = await switchToParentView()
      if (canSwitch) {
        navigate('/parent')
        toast.success('已切换到家长端')
      } else {
        // 需要身份验证
        setShowAuthModal(true)
      }
    }
  }

  // 身份验证成功后的处理
  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    setViewMode('parent')
    navigate('/parent')
    toast.success('验证成功，已切换到家长端')
  }
  
  // 获取当前页面标题
  const getPageTitle = () => {
    const path = location.pathname
    if (path.startsWith('/parent')) return '家长主页'
    if (path.startsWith('/child')) return '儿童主页'
    if (path.startsWith('/behavior')) return '行为评分'
    if (path.startsWith('/rewards')) return '奖励商城'
    if (path.startsWith('/reports')) return '数据报告'
    if (path.startsWith('/settings')) return '设置管理'
    return '儿童行为管理'
  }
  
  // 底部导航配置
  const getBottomNavItems = () => {
    // 根据当前视图模式而不是用户角色来决定导航项
    if (viewMode === 'parent') {
      return [
        { path: '/parent', icon: Home, label: '主页' },
        { path: '/reports', icon: BarChart3, label: '报告' },
        { path: '/rewards', icon: Gift, label: '奖励' },
        { path: '/settings', icon: Settings, label: '设置' },
      ]
    } else {
      // 儿童端不显示设置选项
      return [
        { path: '/child', icon: Home, label: '主页' },
        { path: '/rewards', icon: Gift, label: '商城' },
      ]
    }
  }
  
  const bottomNavItems = getBottomNavItems()
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>

            <div className="flex items-center space-x-2">
            {/* 角色切换按钮 - 只有家长用户才显示 */}
            {user?.role === 'parent' && (
              <button
                onClick={handleRoleSwitch}
                className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                title={viewMode === 'parent' ? '切换到儿童端' : '切换到家长端'}
              >
                {viewMode === 'parent' ? <User size={20} /> : <Users size={20} />}
              </button>
            )}
            
            {/* 登出按钮 */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              title="退出登录"
            >
              <LogOut size={20} />
            </button>
            </div>
          </div>

          {/* 儿童选择器 - 只在儿童视图且有多个孩子时显示 */}
          {user?.role === 'parent' && viewMode === 'child' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <ChildSelector />
            </div>
          )}
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <main className="flex-1 max-w-md mx-auto w-full">
        {children}
      </main>
      
      {/* 底部导航栏 */}
      <nav className="bg-white border-t border-gray-200 max-w-md mx-auto w-full">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 身份验证模态框 */}
      <ParentAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default Layout