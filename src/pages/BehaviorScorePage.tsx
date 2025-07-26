import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore, Child } from '../store'
import { behaviorApi, uploadApi } from '../services/api'
import { toast } from 'sonner'
import { 
  Plus, 
  Minus, 
  Camera, 
  X, 
  Check,
  BookOpen,
  Home,
  Users,
  Heart,
  Gamepad2,
  Utensils,
  ArrowLeft
} from 'lucide-react'

interface BehaviorCategory {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  behaviors: string[]
}

const BehaviorScorePage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const { children } = useAppStore()
  
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [customBehavior, setCustomBehavior] = useState('')
  const [scoreValue, setScoreValue] = useState(0)
  const [description, setDescription] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // 行为分类配置
  const behaviorCategories: BehaviorCategory[] = [
    {
      id: 'learning',
      name: '学习',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-blue-500',
      behaviors: [
        '主动完成作业',
        '认真听课',
        '积极回答问题',
        '预习功课',
        '复习知识点',
        '阅读课外书'
      ]
    },
    {
      id: 'life',
      name: '生活',
      icon: <Home className="w-5 h-5" />,
      color: 'bg-green-500',
      behaviors: [
        '整理房间',
        '帮忙做家务',
        '按时起床',
        '按时睡觉',
        '收拾玩具',
        '保持卫生'
      ]
    },
    {
      id: 'social',
      name: '社交',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-purple-500',
      behaviors: [
        '与同学友好相处',
        '帮助他人',
        '分享玩具',
        '礼貌待人',
        '团队合作',
        '关心家人'
      ]
    },
    {
      id: 'emotion',
      name: '情感',
      icon: <Heart className="w-5 h-5" />,
      color: 'bg-pink-500',
      behaviors: [
        '控制情绪',
        '表达感谢',
        '道歉认错',
        '耐心等待',
        '积极乐观',
        '勇敢面对困难'
      ]
    },
    {
      id: 'exercise',
      name: '运动',
      icon: <Gamepad2 className="w-5 h-5" />,
      color: 'bg-orange-500',
      behaviors: [
        '积极运动',
        '户外活动',
        '做操锻炼',
        '参与体育游戏',
        '坚持锻炼',
        '健康饮食'
      ]
    },
    {
      id: 'eating',
      name: '饮食',
      icon: <Utensils className="w-5 h-5" />,
      color: 'bg-yellow-500',
      behaviors: [
        '按时吃饭',
        '不挑食',
        '饭前洗手',
        '细嚼慢咽',
        '不浪费食物',
        '多吃蔬菜'
      ]
    }
  ]
  
  useEffect(() => {
    if (childId) {
      const parsedChildId = parseInt(childId)
      if (isNaN(parsedChildId)) {
        console.error('Invalid child ID:', childId)
        return
      }
      const child = children.find(c => c.id === parsedChildId)
      setSelectedChild(child || null)
    }
  }, [childId, children])
  
  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件大小
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过5MB')
        return
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('只支持 JPG、PNG、GIF、WebP 格式的图片')
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 移除图片
  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview('')
  }
  
  // 选择预设行为
  const handleSelectBehavior = (behavior: string) => {
    setDescription(behavior)
  }
  
  // 提交行为评分
  const handleSubmit = async () => {
    if (!selectedChild) {
      toast.error('请选择儿童')
      return
    }
    
    if (!selectedCategory) {
      toast.error('请选择行为分类')
      return
    }
    
    if (!description.trim()) {
      toast.error('请输入行为描述')
      return
    }
    
    if (scoreValue === 0) {
      toast.error('请设置积分变化')
      return
    }
    
    setLoading(true)
    
    try {
      let imageUrl = ''
      
      // 上传图片
      if (selectedImage) {
        const uploadResponse = await uploadApi.uploadImage(selectedImage)
        if (uploadResponse.code === 200 && uploadResponse.data) {
          imageUrl = uploadResponse.data.url
        }
      }
      
      // 提交行为记录
      const response = await behaviorApi.createBehavior({
        child_id: selectedChild.id,
        behavior_type: selectedCategory,
        behavior_desc: description,
        score_change: scoreValue,
        image_url: imageUrl
      })
      
      if (response.code === 200) {
        toast.success('行为评分记录成功')
        navigate('/parent')
      }
    } catch (error: any) {
      toast.error(error.message || '提交失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 重置表单
  const handleReset = () => {
    setSelectedCategory('')
    setCustomBehavior('')
    setScoreValue(0)
    setDescription('')
    setSelectedImage(null)
    setImagePreview('')
  }
  
  if (!selectedChild) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">未找到对应的儿童信息</p>
          <button
            onClick={() => navigate('/parent')}
            className="mt-4 text-orange-600 hover:text-orange-700"
          >
            返回主页
          </button>
        </div>
      </div>
    )
  }
  
  const selectedCategoryData = behaviorCategories.find(c => c.id === selectedCategory)
  
  return (
    <div className="p-4 space-y-6">
      {/* 头部信息 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/parent')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          
          <button
            onClick={handleReset}
            className="text-orange-600 hover:text-orange-700 text-sm"
          >
            重置
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            {selectedChild.avatar ? (
              <img
                src={selectedChild.avatar}
                alt={selectedChild.nickname}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {selectedChild.nickname.charAt(0)}
              </span>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              为 {selectedChild.nickname} 评分
            </h2>
            <p className="text-gray-600 text-sm">
              当前积分: {selectedChild.available_points}
            </p>
          </div>
        </div>
      </div>
      
      {/* 行为分类选择 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">选择行为分类</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {behaviorCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCategory === category.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center text-white mx-auto mb-2`}>
                {category.icon}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {category.name}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* 具体行为选择 */}
      {selectedCategoryData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">选择具体行为</h3>
          
          <div className="grid grid-cols-1 gap-2">
            {selectedCategoryData.behaviors.map((behavior, index) => (
              <button
                key={index}
                onClick={() => handleSelectBehavior(behavior)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  description === behavior
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {behavior}
              </button>
            ))}
          </div>
          
          {/* 自定义行为输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              或者自定义行为描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="请描述具体的行为表现..."
            />
          </div>
        </div>
      )}
      
      {/* 积分设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">设置积分变化</h3>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setScoreValue(Math.max(scoreValue - 1, -20))}
              className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Minus size={20} />
            </button>
            
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                scoreValue > 0 ? 'text-green-600' : scoreValue < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {scoreValue > 0 ? '+' : ''}{scoreValue}
              </div>
              <div className="text-sm text-gray-600">积分</div>
            </div>
            
            <button
              onClick={() => setScoreValue(Math.min(scoreValue + 1, 20))}
              className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {/* 快速设置按钮 */}
          <div className="flex justify-center space-x-2 mt-4">
            {[-5, -3, -1, 1, 3, 5, 10].map((value) => (
              <button
                key={value}
                onClick={() => setScoreValue(value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  scoreValue === value
                    ? 'bg-orange-500 text-white'
                    : value > 0
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {value > 0 ? '+' : ''}{value}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 图片上传 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">添加照片（可选）</h3>
        
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="预览"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors">
              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">点击上传照片</p>
              <p className="text-gray-500 text-sm mt-1">支持 JPG、PNG 格式，最大 5MB</p>
            </div>
          </label>
        )}
      </div>
      
      {/* 提交按钮 */}
      <div className="sticky bottom-4">
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedCategory || !description.trim() || scoreValue === 0}
          className="w-full bg-orange-500 text-white py-4 px-6 rounded-xl font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Check size={20} />
              <span>提交评分</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default BehaviorScorePage