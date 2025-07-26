import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '../store'
import Layout from '../components/Layout'
import LoginPage from '../pages/LoginPage'
import ParentHomePage from '../pages/ParentHomePage'
import ChildHomePage from '../pages/ChildHomePage'
import BehaviorScorePage from '../pages/BehaviorScorePage'
import RewardShopPage from '../pages/RewardShopPage'
import DataReportPage from '../pages/DataReportPage'
import SettingsPage from '../pages/SettingsPage'
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage'
import UserAgreementPage from '../pages/UserAgreementPage'

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// 角色保护路由组件
const RoleProtectedRoute: React.FC<{
  children: React.ReactNode
  requiredRole: 'parent' | 'child'
}> = ({ children, requiredRole }) => {
  const { user, viewMode } = useAppStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 如果要求家长权限
  if (requiredRole === 'parent') {
    // 用户必须是家长角色
    if (user.role === 'child') {
      return <Navigate to="/child" replace />
    }
    // 家长用户必须在家长视图模式下
    if (viewMode === 'child') {
      return <Navigate to="/child" replace />
    }
  }

  // 如果要求儿童权限
  if (requiredRole === 'child') {
    // 如果用户是儿童角色，直接允许访问
    if (user.role === 'child') {
      return <>{children}</>
    }
    // 如果用户是家长角色，必须在儿童视图模式下
    if (user.role === 'parent' && viewMode === 'parent') {
      return <Navigate to="/parent" replace />
    }
  }

  return <>{children}</>
}

// 根路由重定向组件
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, viewMode } = useAppStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 根据用户角色和视图模式进行重定向
  if (user?.role === 'parent') {
    // 家长用户根据视图模式重定向
    return <Navigate to={viewMode === 'parent' ? '/parent' : '/child'} replace />
  } else {
    // 儿童用户只能访问儿童页面
    return <Navigate to="/child" replace />
  }
}

// 创建路由配置
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />
  },
  {
    path: '/user-agreement',
    element: <UserAgreementPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout>
          <Outlet />
        </Layout>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RootRedirect />
      },
      {
        path: 'parent',
        element: (
          <RoleProtectedRoute requiredRole="parent">
            <ParentHomePage />
          </RoleProtectedRoute>
        )
      },
      {
        path: 'child',
        element: (
          <RoleProtectedRoute requiredRole="child">
            <ChildHomePage />
          </RoleProtectedRoute>
        )
      },
      {
        path: 'behavior/:childId',
        element: (
          <RoleProtectedRoute requiredRole="parent">
            <BehaviorScorePage />
          </RoleProtectedRoute>
        )
      },
      {
        path: 'rewards',
        element: (
          <ProtectedRoute>
            <RewardShopPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'reports',
        element: (
          <RoleProtectedRoute requiredRole="parent">
            <DataReportPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
])

const AppRouter: React.FC = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default AppRouter