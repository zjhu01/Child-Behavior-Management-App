import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { rewardApi } from '../services/api'
import { toast } from 'sonner'
import { 
  Gift, 
  Star, 
  ShoppingCart, 
  Check, 
  X,
  Coins,
  Trophy,
  Heart,
  Gamepad2,
  Book,
  Candy,
  ArrowLeft
} from 'lucide-react'

interface RewardItem {
  id: number
  name: string
  description: string
  points_required: number
  category: string
  image_url?: string
  stock: number
  is_available: boolean
}

const RewardShopPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, token, viewMode } = useAppStore()
  
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [exchangeLoading, setExchangeLoading] = useState<number | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null)

  // 家长管理状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null)
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_required: '',
    category: 'toy',
    stock: ''
  })
  
  // 奖励分类
  const categories = [
    { id: 'all', name: '全部', icon: <Gift className="w-4 h-4" /> },
    { id: 'toy', name: '玩具', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'book', name: '图书', icon: <Book className="w-4 h-4" /> },
    { id: 'food', name: '零食', icon: <Candy className="w-4 h-4" /> },
    { id: 'activity', name: '活动', icon: <Heart className="w-4 h-4" /> },
    { id: 'privilege', name: '特权', icon: <Trophy className="w-4 h-4" /> }
  ]
  
  // 模拟奖励数据
  const mockRewards: RewardItem[] = [
    {
      id: 1,
      name: '小熊玩偶',
      description: '可爱的泰迪熊玩偶，陪伴你度过美好时光',
      points_required: 50,
      category: 'toy',
      stock: 5,
      is_available: true
    },
    {
      id: 2,
      name: '故事书',
      description: '精美的儿童故事书，开启奇妙的阅读之旅',
      points_required: 30,
      category: 'book',
      stock: 10,
      is_available: true
    },
    {
      id: 3,
      name: '巧克力',
      description: '美味的巧克力，甜蜜的奖励',
      points_required: 15,
      category: 'food',
      stock: 20,
      is_available: true
    },
    {
      id: 4,
      name: '游乐园门票',
      description: '和家人一起去游乐园玩耍的门票',
      points_required: 100,
      category: 'activity',
      stock: 2,
      is_available: true
    },
    {
      id: 5,
      name: '晚睡30分钟',
      description: '可以比平时晚睡30分钟的特权',
      points_required: 25,
      category: 'privilege',
      stock: 999,
      is_available: true
    },
    {
      id: 6,
      name: '乐高积木',
      description: '创意乐高积木套装，发挥你的想象力',
      points_required: 80,
      category: 'toy',
      stock: 3,
      is_available: true
    },
    {
      id: 7,
      name: '彩色画笔',
      description: '24色彩色画笔套装，画出美丽的世界',
      points_required: 40,
      category: 'toy',
      stock: 8,
      is_available: true
    },
    {
      id: 8,
      name: '冰淇淋',
      description: '美味的冰淇淋，夏日的清凉享受',
      points_required: 20,
      category: 'food',
      stock: 15,
      is_available: true
    }
  ]
  
  useEffect(() => {
    // 只有在已认证且有token的情况下才加载数据
    if (isAuthenticated && token) {
      loadRewards()
    }
  }, [isAuthenticated, token])
  
  // 加载奖励列表
  const loadRewards = async () => {
    setLoading(true)
    try {
      // 这里应该调用真实的API
      // const response = await rewardApi.getRewards()
      // if (response.code === 200) {
      //   setRewards(response.data)
      // }
      
      // 暂时使用模拟数据
      setTimeout(() => {
        setRewards(mockRewards)
        setLoading(false)
      }, 500)
    } catch (error: any) {
      toast.error(error.message || '加载奖励失败')
      setLoading(false)
    }
  }
  
  // 过滤奖励
  const filteredRewards = rewards.filter(reward => {
    if (selectedCategory === 'all') return true
    return reward.category === selectedCategory
  })
  
  // 兑换奖励
  const handleExchange = async (reward: RewardItem) => {
    if (!user) return
    
    if (user.available_points < reward.points_required) {
      toast.error('积分不足，无法兑换')
      return
    }
    
    if (reward.stock <= 0) {
      toast.error('库存不足，无法兑换')
      return
    }
    
    setSelectedReward(reward)
    setShowConfirmModal(true)
  }
  
  // 确认兑换
  const confirmExchange = async () => {
    if (!selectedReward || !user) return
    
    setExchangeLoading(selectedReward.id)
    
    try {
      const response = await rewardApi.exchangeReward({
        reward_id: selectedReward.id,
        points_used: selectedReward.points_required
      })
      
      if (response.code === 200) {
        toast.success('兑换成功！')
        
        // 更新用户积分
        useAppStore.getState().setUser({
          ...user,
          available_points: user.available_points - selectedReward.points_required
        })
        
        // 更新库存
        setRewards(prev => prev.map(r => 
          r.id === selectedReward.id 
            ? { ...r, stock: r.stock - 1 }
            : r
        ))
        
        setShowConfirmModal(false)
        setSelectedReward(null)
      }
    } catch (error: any) {
      toast.error(error.message || '兑换失败')
    } finally {
      setExchangeLoading(null)
    }
  }

  // 创建奖励
  const handleCreateReward = async () => {
    if (!rewardForm.name.trim()) {
      toast.error('请输入奖励名称')
      return
    }

    if (!rewardForm.points_required || parseInt(rewardForm.points_required) <= 0) {
      toast.error('请输入有效的积分要求')
      return
    }

    if (!rewardForm.stock || parseInt(rewardForm.stock) <= 0) {
      toast.error('请输入有效的库存数量')
      return
    }

    setLoading(true)
    try {
      const response = await rewardApi.createReward({
        name: rewardForm.name,
        description: rewardForm.description,
        points_cost: parseInt(rewardForm.points_required),
        stock: parseInt(rewardForm.stock)
      })

      if (response.code === 200) {
        toast.success('奖励创建成功')
        setShowCreateModal(false)
        setRewardForm({
          name: '',
          description: '',
          points_required: '',
          category: 'toy',
          stock: ''
        })
        loadRewards() // 重新加载奖励列表
      }
    } catch (error: any) {
      toast.error(error.message || '创建奖励失败')
    } finally {
      setLoading(false)
    }
  }

  // 编辑奖励
  const handleEditReward = async () => {
    if (!editingReward) return

    if (!rewardForm.name.trim()) {
      toast.error('请输入奖励名称')
      return
    }

    if (!rewardForm.points_required || parseInt(rewardForm.points_required) <= 0) {
      toast.error('请输入有效的积分要求')
      return
    }

    if (!rewardForm.stock || parseInt(rewardForm.stock) < 0) {
      toast.error('请输入有效的库存数量')
      return
    }

    setLoading(true)
    try {
      const response = await rewardApi.updateReward(editingReward.id, {
        name: rewardForm.name,
        description: rewardForm.description,
        points: parseInt(rewardForm.points_required),
        stock: parseInt(rewardForm.stock)
      })

      if (response.code === 200) {
        toast.success('奖励更新成功')
        setEditingReward(null)
        setRewardForm({
          name: '',
          description: '',
          points_required: '',
          category: 'toy',
          stock: ''
        })
        loadRewards() // 重新加载奖励列表
      }
    } catch (error: any) {
      toast.error(error.message || '更新奖励失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除奖励
  const handleDeleteReward = async (rewardId: number) => {
    if (!confirm('确定要删除这个奖励吗？此操作不可撤销。')) {
      return
    }

    setLoading(true)
    try {
      const response = await rewardApi.deleteReward(rewardId)

      if (response.code === 200) {
        toast.success('奖励删除成功')
        loadRewards() // 重新加载奖励列表
      }
    } catch (error: any) {
      toast.error(error.message || '删除奖励失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取分类图标颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      toy: 'bg-blue-500',
      book: 'bg-green-500',
      food: 'bg-yellow-500',
      activity: 'bg-purple-500',
      privilege: 'bg-red-500'
    }
    return colors[category] || 'bg-gray-500'
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
      {/* 头部信息 */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-white/80 hover:text-white"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5" />
            <span className="font-bold">{user?.available_points || 0}</span>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {viewMode === 'parent' ? '🎁 奖励管理' : '🎁 奖励商店'}
          </h1>
          <p className="text-white/90">
            {viewMode === 'parent'
              ? '管理和创建奖励项目'
              : '用你的积分兑换心仪的奖励吧！'
            }
          </p>
        </div>
      </div>
      
      {/* 分类筛选 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">奖励分类</h3>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 家长端：创建奖励按钮 */}
      {viewMode === 'parent' && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Gift className="w-4 h-4" />
            <span>创建奖励</span>
          </button>
        </div>
      )}

      {/* 奖励列表 */}
      <div className="space-y-4">
        {filteredRewards.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">暂无奖励</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRewards.map((reward) => {
              const canAfford = (user?.available_points || 0) >= reward.points_required
              const inStock = reward.stock > 0
              const available = reward.is_available && inStock
              
              return (
                <div
                  key={reward.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                    available && canAfford
                      ? 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                      : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* 奖励图片/图标 */}
                    <div className={`w-16 h-16 ${getCategoryColor(reward.category)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {reward.image_url ? (
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <Gift className="w-8 h-8 text-white" />
                      )}
                    </div>
                    
                    {/* 奖励信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {reward.name}
                        </h4>
                        
                        <div className="flex items-center space-x-1 text-orange-600 font-bold">
                          <Coins className="w-4 h-4" />
                          <span>{reward.points_required}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {reward.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>库存: {reward.stock}</span>
                          {!canAfford && (
                            <span className="text-red-500">积分不足</span>
                          )}
                          {!inStock && (
                            <span className="text-red-500">缺货</span>
                          )}
                        </div>
                        
                        {viewMode === 'parent' ? (
                          // 家长端：管理按钮
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingReward(reward)
                                setRewardForm({
                                  name: reward.name,
                                  description: reward.description,
                                  points_required: reward.points_required.toString(),
                                  category: reward.category,
                                  stock: reward.stock.toString()
                                })
                              }}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteReward(reward.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                              删除
                            </button>
                          </div>
                        ) : (
                          // 儿童端：兑换按钮
                          <button
                            onClick={() => handleExchange(reward)}
                            disabled={!available || !canAfford || exchangeLoading === reward.id}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                              available && canAfford
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {exchangeLoading === reward.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4" />
                                <span>兑换</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* 兑换确认弹窗 */}
      {showConfirmModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 ${getCategoryColor(selectedReward.category)} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <Gift className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                确认兑换
              </h3>
              
              <p className="text-gray-600 mb-4">
                确定要用 <span className="font-bold text-orange-600">{selectedReward.points_required}</span> 积分兑换
                <span className="font-bold"> {selectedReward.name}</span> 吗？
              </p>
              
              <div className="text-sm text-gray-500">
                兑换后剩余积分: {(user?.available_points || 0) - selectedReward.points_required}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedReward(null)
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>取消</span>
              </button>
              
              <button
                onClick={confirmExchange}
                disabled={exchangeLoading === selectedReward.id}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {exchangeLoading === selectedReward.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>确认兑换</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建/编辑奖励弹窗 */}
      {(showCreateModal || editingReward) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingReward ? '编辑奖励' : '创建奖励'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  奖励名称
                </label>
                <input
                  type="text"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入奖励名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  奖励描述
                </label>
                <textarea
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入奖励描述"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所需积分
                </label>
                <input
                  type="number"
                  value={rewardForm.points_required}
                  onChange={(e) => setRewardForm({ ...rewardForm, points_required: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入所需积分"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  库存数量
                </label>
                <input
                  type="number"
                  value={rewardForm.stock}
                  onChange={(e) => setRewardForm({ ...rewardForm, stock: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入库存数量"
                  min="1"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingReward(null)
                  setRewardForm({
                    name: '',
                    description: '',
                    points_required: '',
                    category: 'toy',
                    stock: ''
                  })
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>

              <button
                onClick={editingReward ? handleEditReward : handleCreateReward}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading
                  ? (editingReward ? '更新中...' : '创建中...')
                  : (editingReward ? '更新奖励' : '创建奖励')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RewardShopPage