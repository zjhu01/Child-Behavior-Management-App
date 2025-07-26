import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { userApi, behaviorApi } from '../services/api'
import { toast } from 'sonner'
import { 
  Star, 
  Award, 
  TrendingUp, 
  Calendar,
  Gift,
  Trophy,
  Target,
  Zap
} from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
  target?: number
}

interface RecentBehavior {
  id: number
  behavior_desc: string
  score_change: number
  created_at: string
}

const ChildHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, token, viewMode, children, selectedChild } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState({ total_points: 0, available_points: 0 })
  const [recentBehaviors, setRecentBehaviors] = useState<RecentBehavior[]>([])
  const [todayPoints, setTodayPoints] = useState(0)
  const [todayBehaviorCount, setTodayBehaviorCount] = useState(0)
  
  // 成就系统数据
  const [achievements] = useState<Achievement[]>([
    {
      id: 'first_100',
      name: '百分达人',
      description: '累计获得100积分',
      icon: '🎯',
      unlocked: false
    },
    {
      id: 'week_streak',
      name: '坚持一周',
      description: '连续7天获得积分',
      icon: '🔥',
      unlocked: false
    },
    {
      id: 'good_behavior',
      name: '好行为小能手',
      description: '记录50次正向行为',
      icon: '⭐',
      unlocked: false
    },
    {
      id: 'learning_master',
      name: '学习小达人',
      description: '学习类行为获得200积分',
      icon: '📚',
      unlocked: false
    },
    {
      id: 'helper',
      name: '小帮手',
      description: '生活类行为获得150积分',
      icon: '🏠',
      unlocked: false
    },
    {
      id: 'social_star',
      name: '社交之星',
      description: '社交类行为获得100积分',
      icon: '👥',
      unlocked: false
    }
  ])
  
  // 获取当前要显示的儿童信息
  const getCurrentChild = () => {
    if (user?.role === 'child') {
      // 如果当前用户是儿童，返回用户自己的信息
      return {
        id: user.id,
        nickname: user.nickname,
        total_points: user.total_points || 0,
        available_points: user.available_points || 0
      }
    } else if (user?.role === 'parent' && viewMode === 'child') {
      // 如果是家长在儿童视图模式，返回第一个儿童的信息（或选中的儿童）
      const targetChild = selectedChild || children[0]
      return targetChild ? {
        id: targetChild.id,
        nickname: targetChild.nickname,
        total_points: targetChild.total_points || 0,
        available_points: targetChild.available_points || 0
      } : null
    }
    return null
  }

  // 加载用户积分
  const loadPoints = async () => {
    if (!user) return

    try {
      const currentChild = getCurrentChild()
      if (!currentChild) {
        toast.error('未找到儿童信息')
        return
      }

      if (user.role === 'child') {
        // 儿童用户直接获取自己的信息
        const response = await userApi.getCurrentUser()
        if (response.code === 200 && response.data) {
          setPoints({
            total_points: response.data.total_points || 0,
            available_points: response.data.available_points || 0
          })
        }
      } else {
        // 家长用户在儿童视图模式，使用儿童列表中的积分信息
        setPoints({
          total_points: currentChild.total_points,
          available_points: currentChild.available_points
        })
      }
    } catch (error: any) {
      toast.error('加载积分失败')
    }
  }
  
  // 加载最近行为记录
  const loadRecentBehaviors = async () => {
    if (!user) return

    try {
      const currentChild = getCurrentChild()
      if (!currentChild) {
        return
      }

      // 根据用户角色决定API调用方式
      const response = user.role === 'child'
        ? await behaviorApi.getBehaviors({ limit: 5 }) // 儿童用户不需要传递child_id
        : await behaviorApi.getBehaviors({ child_id: currentChild.id, limit: 5 }) // 家长用户需要指定child_id

      if (response.code === 200 && response.data) {
        // 后端返回的数据结构是 { behaviors: [...], pagination: {...} }
        const behaviors = Array.isArray(response.data) ? response.data : ((response.data as any)?.behaviors || [])
        setRecentBehaviors(behaviors)

        // 计算今日积分 - 使用本地时间而不是UTC时间
        const today = new Date()
        const todayStr = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0')

        const todayBehaviors = behaviors.filter(b => {
          if (!b.recorded_at) return false
          // 提取日期部分进行比较
          const recordDate = b.recorded_at.split('T')[0]
          return recordDate === todayStr
        })

        const todayScore = todayBehaviors.reduce((sum, b) => sum + b.score_change, 0)
        setTodayPoints(todayScore)
        setTodayBehaviorCount(todayBehaviors.length)
      }
    } catch (error: any) {
      console.error('加载行为记录失败:', error)
    }
  }
  
  useEffect(() => {
    let isMounted = true

    // 只有在已认证且有token的情况下才加载数据
    if (isAuthenticated && token && user) {
      const loadData = async () => {
        if (!isMounted) return
        setLoading(true)

        try {
          // 先加载积分，再加载行为记录，确保数据同步
          await loadPoints()
          await loadRecentBehaviors()
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
  }, [isAuthenticated, token, user?.id, viewMode, selectedChild?.id, children.length]) // 添加相关依赖项

  // 添加一个刷新数据的函数，可以在需要时手动调用
  const refreshData = async () => {
    if (isAuthenticated && token && user) {
      setLoading(true)
      try {
        await loadPoints()
        await loadRecentBehaviors()
      } finally {
        setLoading(false)
      }
    }
  }
  
  // 计算等级和进度
  const getLevel = (totalPoints: number) => {
    if (totalPoints < 50) return { level: 1, name: '新手', progress: totalPoints, nextTarget: 50 }
    if (totalPoints < 150) return { level: 2, name: '进步者', progress: totalPoints - 50, nextTarget: 100 }
    if (totalPoints < 300) return { level: 3, name: '优秀者', progress: totalPoints - 150, nextTarget: 150 }
    if (totalPoints < 500) return { level: 4, name: '卓越者', progress: totalPoints - 300, nextTarget: 200 }
    return { level: 5, name: '大师', progress: totalPoints - 500, nextTarget: 0 }
  }
  
  const levelInfo = getLevel(points.total_points)
  
  // 检查成就解锁状态
  const checkAchievements = () => {
    return achievements.map(achievement => {
      let unlocked = false

      switch (achievement.id) {
        case 'first_100':
          unlocked = points.total_points >= 100
          break
        case 'good_behavior':
          // 这里应该从服务器获取所有正向行为的总数，而不是只看最近的5条
          // 暂时使用总积分作为判断标准
          unlocked = points.total_points >= 150
          break
        case 'week_streak':
          // 这里需要实际的连续天数数据，暂时基于总积分判断
          unlocked = points.total_points >= 70
          break
        case 'learning_master':
          unlocked = points.total_points >= 200
          break
        case 'helper':
          unlocked = points.total_points >= 150
          break
        case 'social_star':
          unlocked = points.total_points >= 100
          break
        default:
          unlocked = false
      }

      return { ...achievement, unlocked }
    })
  }
  
  const updatedAchievements = checkAchievements()
  const unlockedCount = updatedAchievements.filter(a => a.unlocked).length

  // 获取要显示的儿童名称
  const currentChild = getCurrentChild()
  const displayName = currentChild?.nickname || '小朋友'
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* 欢迎信息和积分展示 */}
      <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-1">
            嗨，{displayName}! 🌟
          </h2>
          <p className="text-purple-100 mb-4">继续加油，你做得很棒！</p>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-6 h-6 text-yellow-300" />
                <span className="text-3xl font-bold">{points.available_points}</span>
                <span className="text-purple-100">可用积分</span>
              </div>
              <div className="text-purple-100 text-sm">
                总积分: {points.total_points} | 今日: +{todayPoints}
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
              <div className="text-sm font-medium">{levelInfo.name}</div>
              <div className="text-xs text-purple-100">Lv.{levelInfo.level}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 等级进度 */}
      {levelInfo.nextTarget > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">升级进度</span>
            <span className="text-sm text-gray-600">
              {levelInfo.progress}/{levelInfo.nextTarget}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(levelInfo.progress / levelInfo.nextTarget) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            还需 {levelInfo.nextTarget - levelInfo.progress} 积分升级到 Lv.{levelInfo.level + 1}
          </p>
        </div>
      )}
      
      {/* 今日统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{todayPoints}</div>
          <div className="text-xs text-gray-600">今日积分</div>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{todayBehaviorCount}</div>
          <div className="text-xs text-gray-600">今日记录</div>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-gray-900">{unlockedCount}</div>
          <div className="text-xs text-gray-600">成就徽章</div>
        </div>
      </div>
      
      {/* 成就徽章 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">成就徽章</h3>
        
        <div className="grid grid-cols-3 gap-3">
          {updatedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-white rounded-xl p-3 shadow-sm border text-center transition-all ${
                achievement.unlocked
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-100'
              }`}
            >
              <div className={`text-2xl mb-2 ${
                achievement.unlocked ? 'grayscale-0' : 'grayscale'
              }`}>
                {achievement.icon}
              </div>
              <div className={`text-xs font-medium mb-1 ${
                achievement.unlocked ? 'text-yellow-700' : 'text-gray-600'
              }`}>
                {achievement.name}
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                {achievement.description}
              </div>
              {achievement.unlocked && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    <Zap className="w-3 h-3 mr-1" />
                    已解锁
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 最近行为记录 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">最近表现</h3>
        
        {recentBehaviors.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-600">还没有行为记录</p>
            <p className="text-gray-500 text-sm mt-1">继续努力，让爸爸妈妈看到你的进步！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentBehaviors.map((behavior) => (
              <div
                key={behavior.id}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {behavior.behavior_desc}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(behavior.created_at).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  behavior.score_change > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  <span>{behavior.score_change > 0 ? '+' : ''}{behavior.score_change}</span>
                  <Star className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 快速操作 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-3">快速操作</h4>
        <button
          onClick={() => navigate('/rewards')}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-pink-600 transition-all flex items-center justify-center space-x-2"
        >
          <Gift className="w-5 h-5" />
          <span>去兑换奖励</span>
        </button>
      </div>
    </div>
  )
}

export default ChildHomePage