import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { userApi, behaviorApi } from '../services/api'
import { toast } from 'sonner'
import { 
  Plus, 
  TrendingUp, 
  Award, 
  Calendar,
  Star,
  ChevronRight,
  Users,
  BarChart3
} from 'lucide-react'

interface DailyStats {
  totalBehaviors: number
  positiveScore: number
  negativeScore: number
  activeChildren: number
}

const ParentHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, children, setChildren, isAuthenticated, token } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalBehaviors: 0,
    positiveScore: 0,
    negativeScore: 0,
    activeChildren: 0
  })
  
  // 加载儿童列表
  const loadChildren = async () => {
    try {
      const response = await userApi.getChildren()
      if (response.code === 200 && response.data) {
        setChildren(response.data)
      }
    } catch (error: any) {
      toast.error('加载儿童列表失败')
      // 暂时使用模拟数据
      const mockChildren = [
        {
          id: 1,
          nickname: '小明',
          avatar: '',
          age: 8,
          gender: 'boy',
          available_points: 120,
          total_points: 350,
          level: 3,
          parent_id: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-15'
        },
        {
          id: 2,
          nickname: '小红',
          avatar: '',
          age: 6,
          gender: 'girl',
          available_points: 85,
          total_points: 280,
          level: 2,
          parent_id: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-15'
        }
      ]
      setChildren(mockChildren)
    }
  }
  
  // 加载今日统计数据
  const loadDailyStats = async () => {
    try {
      // 使用本地时间而不是UTC时间
      const today = new Date()
      const todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0')

      const response = await behaviorApi.getBehaviors({
        start_date: todayStr,
        end_date: todayStr
      })

      if (response.code === 200 && response.data) {
        // 后端返回的数据结构是 { behaviors: [...], pagination: {...} }
        const behaviors = Array.isArray(response.data) ? response.data : ((response.data as any)?.behaviors || [])
        const stats = {
          totalBehaviors: behaviors.length,
          positiveScore: behaviors
            .filter(b => b.score_change > 0)
            .reduce((sum, b) => sum + b.score_change, 0),
          negativeScore: behaviors
            .filter(b => b.score_change < 0)
            .reduce((sum, b) => sum + Math.abs(b.score_change), 0),
          activeChildren: new Set(behaviors.map(b => b.child_id)).size
        }
        setDailyStats(stats)
      }
    } catch (error: any) {
      console.error('加载统计数据失败:', error)
    }
  }
  
  useEffect(() => {
    let isMounted = true

    // 只有在已认证且有token的情况下才加载数据
    if (isAuthenticated && token) {
      const loadData = async () => {
        if (!isMounted) return
        setLoading(true)

        try {
          await Promise.all([loadChildren(), loadDailyStats()])
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }

      loadData()
    }

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, token])
  
  // 跳转到行为评分页面
  const handleScoreChild = (childId: number) => {
    navigate(`/behavior/${childId}`)
  }
  
  // 创建新儿童账户
  const handleCreateChild = () => {
    navigate('/settings')
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* 欢迎信息 */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">
              你好，{user?.nickname} 👋
            </h2>
            <p className="text-orange-100">
              今天是 {new Date().toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{children.length}</div>
            <div className="text-orange-100 text-sm">个孩子</div>
          </div>
        </div>
      </div>
      
      {/* 今日数据概览 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">今日记录</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats.totalBehaviors}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">正向积分</p>
              <p className="text-2xl font-bold text-green-600">+{dailyStats.positiveScore}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">活跃孩子</p>
              <p className="text-2xl font-bold text-purple-600">{dailyStats.activeChildren}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">需改进</p>
              <p className="text-2xl font-bold text-red-600">{dailyStats.negativeScore}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* 儿童列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">我的孩子</h3>
          <button
            onClick={handleCreateChild}
            className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 font-medium"
          >
            <Plus size={16} />
            <span>添加孩子</span>
          </button>
        </div>
        
        {children.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">还没有添加孩子</h4>
            <p className="text-gray-600 mb-4">点击上方按钮添加第一个孩子账户</p>
            <button
              onClick={handleCreateChild}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              立即添加
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      {child.avatar ? (
                        <img
                          src={child.avatar}
                          alt={child.nickname}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {child.nickname.charAt(0)}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{child.nickname}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{child.total_points} 总积分</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4 text-green-500" />
                          <span>{child.available_points} 可用</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleScoreChild(child.id)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-1"
                  >
                    <span>评分</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 快速操作 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/reports')}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">数据报告</h4>
              <p className="text-gray-600 text-sm">查看孩子进步情况</p>
            </div>
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
        </button>
        
        <button
          onClick={() => navigate('/rewards')}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">奖励管理</h4>
              <p className="text-gray-600 text-sm">设置积分奖励</p>
            </div>
            <Award className="w-6 h-6 text-purple-600" />
          </div>
        </button>
      </div>
    </div>
  )
}

export default ParentHomePage