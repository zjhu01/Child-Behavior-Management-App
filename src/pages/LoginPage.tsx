import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { authApi } from '../services/api'
import { toast } from 'sonner'
import { Eye, EyeOff, Phone, Lock, User } from 'lucide-react'
import { validatePhone, validatePassword, validateNickname } from '../lib/validation'

type TabType = 'login' | 'register'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setUser, setToken, switchToParentView } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    nickname: '',
    confirmPassword: ''
  })
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // 验证表单
  const validateForm = () => {
    // 验证手机号
    if (!formData.phone.trim()) {
      toast.error('请输入手机号')
      return false
    }

    if (!validatePhone(formData.phone)) {
      toast.error('请输入正确的手机号')
      return false
    }

    // 验证密码
    if (!formData.password.trim()) {
      toast.error('请输入密码')
      return false
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message)
      return false
    }

    // 注册时的额外验证
    if (activeTab === 'register') {
      const nicknameValidation = validateNickname(formData.nickname)
      if (!nicknameValidation.isValid) {
        toast.error(nicknameValidation.message)
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('两次密码输入不一致')
        return false
      }
    }

    return true
  }
  
  // 处理登录
  const handleLogin = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const response = await authApi.login({
        phone: formData.phone,
        password: formData.password
      })
      
      if (response.code === 200 && response.data) {
        setToken(response.data.token)
        setUser(response.data.user)
        toast.success('登录成功')

        // 根据用户角色设置视图模式并跳转
        if (response.data.user.role === 'parent') {
          // 家长用户登录后，设置为家长视图模式（跳过验证）
          await switchToParentView(true)
          navigate('/parent')
        } else {
          // 儿童用户只能访问儿童页面
          navigate('/child')
        }
      }
    } catch (error: any) {
      toast.error(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const response = await authApi.register({
        phone: formData.phone,
        password: formData.password,
        nickname: formData.nickname,
        role: 'parent' // 注册时固定为家长角色
      })
      
      if (response.code === 200) {
        toast.success('注册成功，请登录')
        setActiveTab('login')
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
      }
    } catch (error: any) {
      toast.error(error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'login') {
      handleLogin()
    } else {
      handleRegister()
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">儿童行为管理</h1>
          <p className="text-gray-600">培养孩子良好习惯的数字化助手</p>
        </div>
        
        {/* 登录注册卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Tab切换 */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              注册
            </button>
          </div>
          
          
          
          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 昵称输入（仅注册时显示） */}
            {activeTab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  昵称
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="请输入昵称"
                  />
                </div>
              </div>
            )}
            
            {/* 手机号输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入手机号"
                />
              </div>
            </div>
            
            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {/* 确认密码输入（仅注册时显示） */}
            {activeTab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="请再次输入密码"
                  />
                </div>
              </div>
            )}
            
            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '处理中...' : (activeTab === 'login' ? '登录' : '注册')}
            </button>
          </form>
        </div>
        
        {/* 底部提示 */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            使用本应用即表示您同意我们的
            <button
              onClick={() => navigate('/user-agreement')}
              className="text-orange-600 hover:text-orange-700 underline mx-1"
            >
              服务条款
            </button>
            和
            <button
              onClick={() => navigate('/privacy-policy')}
              className="text-orange-600 hover:text-orange-700 underline mx-1"
            >
              隐私政策
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage