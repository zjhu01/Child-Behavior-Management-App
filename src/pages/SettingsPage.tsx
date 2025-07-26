import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, Child } from '../store'
import { userApi, uploadApi, authApi } from '../services/api'
import { toast } from 'sonner'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  User,
  Camera,
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  Bell,
  Shield,
  Palette,
  Volume2,
  Moon,
  Sun,
  ArrowLeft,
  Settings as SettingsIcon,
  Users,
  Info,
  Fingerprint
} from 'lucide-react'
import BiometricAuth from '../components/BiometricAuth'



const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    user,
    children,
    setUser,
    setChildren,
    biometricSettings,
    setBiometricSettings,
    isAuthenticated,
    token
  } = useAppStore()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  
  // 个人资料编辑
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nickname: user?.nickname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  })
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  
  // 儿童账户管理
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [childForm, setChildForm] = useState({
    nickname: '',
    age: '',
    gender: 'boy'
  })
  
  // 应用设置
  const [appSettings, setAppSettings] = useState({
    notifications: localStorage.getItem('app_notifications') !== 'false',
    sound: localStorage.getItem('app_sound') !== 'false',
    darkMode: localStorage.getItem('app_darkMode') === 'true',
    language: localStorage.getItem('app_language') || 'zh-CN',
    autoBackup: localStorage.getItem('app_autoBackup') !== 'false'
  })

  // 确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [childToDelete, setChildToDelete] = useState<number | null>(null)

  // 生物识别设置
  const [showBiometricSetup, setShowBiometricSetup] = useState(false)
  const [biometricSupported, setBiometricSupported] = useState(false)

  // 修改密码
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const tabs = [
    { id: 'profile', name: '个人资料', icon: <User className="w-4 h-4" /> },
    { id: 'children', name: '儿童管理', icon: <Users className="w-4 h-4" /> },
    { id: 'security', name: '安全设置', icon: <Shield className="w-4 h-4" /> },
    { id: 'app', name: '应用设置', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'about', name: '关于应用', icon: <Info className="w-4 h-4" /> }
  ]
  
  useEffect(() => {
    if (user) {
      setProfileForm({
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      })
    }
  }, [user])

  // 加载用户完整信息
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isAuthenticated && token && !user) {
        try {
          const response = await userApi.getCurrentUser()
          if (response.code === 200 && response.data) {
            setUser(response.data)
          }
        } catch (error: any) {
          console.error('加载用户信息失败:', error)
        }
      }
    }

    loadUserProfile()
  }, [isAuthenticated, token, user, setUser])

  // 初始化深色模式
  useEffect(() => {
    if (appSettings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // 检查生物识别支持
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setBiometricSupported(available)
        } catch (error) {
          setBiometricSupported(false)
        }
      } else {
        setBiometricSupported(false)
      }
    }

    checkBiometricSupport()
  }, [])
  
  // 处理头像选择
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件大小
      if (file.size > 5 * 1024 * 1024) {
        toast.error('头像大小不能超过5MB')
        return
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('只支持 JPG、PNG、GIF、WebP 格式的图片')
        return
      }

      setSelectedAvatar(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 保存个人资料
  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      let avatarUrl = profileForm.avatar
      
      // 上传新头像
      if (selectedAvatar) {
        const uploadResponse = await uploadApi.uploadImage(selectedAvatar)
        if (uploadResponse.code === 200 && uploadResponse.data) {
          avatarUrl = uploadResponse.data.url
        }
      }
      
      // 更新用户信息
      const response = await userApi.updateProfile({
        nickname: profileForm.nickname,
        email: profileForm.email,
        phone: profileForm.phone,
        avatar: avatarUrl
      })
      
      if (response.code === 200 && user) {
        setUser({
          ...user,
          ...profileForm,
          avatar: avatarUrl
        })
        
        setEditingProfile(false)
        setSelectedAvatar(null)
        setAvatarPreview('')
        toast.success('个人资料更新成功')
      }
    } catch (error: any) {
      toast.error(error.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 添加儿童账户
  const handleAddChild = async () => {
    if (!childForm.nickname.trim()) {
      toast.error('请输入儿童昵称')
      return
    }
    
    const age = parseInt(childForm.age)
    if (!childForm.age || isNaN(age) || age < 1 || age > 18) {
      toast.error('请输入有效的年龄（1-18岁）')
      return
    }
    
    setLoading(true)
    try {
      const response = await userApi.createChild({
        nickname: childForm.nickname,
        age: age,
        gender: childForm.gender
      })
      
      if (response.code === 200 && response.data) {
        setChildren([...children, response.data])
        setShowAddChildModal(false)
        setChildForm({ nickname: '', age: '', gender: 'boy' })
        toast.success('儿童账户创建成功')
      }
    } catch (error: any) {
      toast.error(error.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 显示删除确认对话框
  const handleDeleteChild = (childId: number) => {
    setChildToDelete(childId)
    setShowDeleteConfirm(true)
  }

  // 确认删除儿童账户
  const confirmDeleteChild = async () => {
    if (!childToDelete) return

    setLoading(true)
    try {
      const response = await userApi.deleteChild(childToDelete)

      if (response.code === 200) {
        setChildren(children.filter(child => child.id !== childToDelete))
        toast.success('儿童账户删除成功')
      }
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
      setChildToDelete(null)
    }
  }

  // 取消删除
  const cancelDeleteChild = () => {
    setShowDeleteConfirm(false)
    setChildToDelete(null)
  }

  // 切换生物识别设置
  const handleToggleBiometric = async () => {
    if (!biometricSupported) {
      toast.error('您的设备不支持指纹验证')
      return
    }

    if (biometricSettings.enabled) {
      // 禁用生物识别
      setBiometricSettings({
        enabled: false,
        lastSetup: null
      })
      toast.success('指纹验证已禁用')
    } else {
      // 启用生物识别，需要设置
      setShowBiometricSetup(true)
    }
  }

  // 生物识别设置成功
  const handleBiometricSetupSuccess = () => {
    setBiometricSettings({
      enabled: true,
      lastSetup: new Date().toISOString()
    })
    setShowBiometricSetup(false)
    toast.success('指纹验证设置成功')
  }

  // 生物识别设置失败
  const handleBiometricSetupError = (error: string) => {
    toast.error(`指纹验证设置失败: ${error}`)
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword.trim()) {
      toast.error('请输入当前密码')
      return
    }

    if (!passwordForm.newPassword.trim()) {
      toast.error('请输入新密码')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度至少6位')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.changePassword({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      })

      if (response.code === 200) {
        toast.success('密码修改成功')
        setShowChangePassword(false)
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error: any) {
      toast.error(error.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新应用设置
  const updateAppSetting = (key: string, value: any) => {
    const newSettings = { ...appSettings, [key]: value }
    setAppSettings(newSettings)

    // 保存到localStorage
    localStorage.setItem(`app_${key}`, value.toString())

    // 应用设置
    switch (key) {
      case 'darkMode':
        if (value) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        break
      case 'notifications':
        // 可以在这里设置通知权限
        break
      case 'sound':
        // 可以在这里设置音效
        break
    }

    toast.success('设置已保存')
  }
  
  // 渲染个人资料标签页
  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* 头像设置 */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
            {avatarPreview || profileForm.avatar ? (
              <img
                src={avatarPreview || profileForm.avatar}
                alt="头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {profileForm.nickname.charAt(0) || 'U'}
              </span>
            )}
          </div>
          
          {editingProfile && (
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
      
      {/* 基本信息 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            昵称
          </label>
          <input
            type="text"
            value={profileForm.nickname}
            onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
            disabled={!editingProfile}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="请输入昵称"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            邮箱
          </label>
          <input
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            disabled={!editingProfile}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="请输入邮箱"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            手机号
          </label>
          <input
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            disabled={!editingProfile}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="请输入手机号"
          />
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex space-x-3">
        {editingProfile ? (
          <>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setEditingProfile(false)
                setSelectedAvatar(null)
                setAvatarPreview('')
                setProfileForm({
                  nickname: user?.nickname || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  avatar: user?.avatar || ''
                })
              }}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>取消</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditingProfile(true)}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>编辑资料</span>
          </button>
        )}
      </div>
    </div>
  )
  
  // 渲染儿童管理标签页
  const renderChildrenTab = () => (
    <div className="space-y-6">
      {/* 添加儿童按钮 */}
      <button
        onClick={() => setShowAddChildModal(true)}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 hover:bg-orange-50 transition-colors"
      >
        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">添加儿童账户</p>
      </button>
      
      {/* 儿童列表 */}
      <div className="space-y-4">
        {children.map((child) => (
          <div key={child.id} className="bg-white border border-gray-200 rounded-lg p-4">
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
                    <span className="text-white font-bold">
                      {child.nickname.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">{child.nickname}</h4>
                  <p className="text-sm text-gray-600">
                    {child.age}岁 · {child.gender === 'boy' ? '男孩' : '女孩'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingChild(child)}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteChild(child.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // 渲染安全设置标签页
  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* 密码设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>密码设置</span>
        </h3>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">登录密码</p>
              <p className="text-sm text-gray-600">定期更换密码以保护账户安全</p>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              修改密码
            </button>
          </div>
        </div>
      </div>

      {/* 指纹验证设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Fingerprint className="w-5 h-5" />
          <span>生物识别验证</span>
        </h3>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900">指纹验证</p>
              <p className="text-sm text-gray-600">
                {biometricSupported
                  ? '使用指纹验证增强安全性'
                  : '您的设备不支持指纹验证'
                }
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={biometricSettings.enabled}
                onChange={handleToggleBiometric}
                disabled={!biometricSupported}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
            </label>
          </div>

          {biometricSettings.enabled && biometricSettings.lastSetup && (
            <p className="text-xs text-gray-500">
              设置时间: {new Date(biometricSettings.lastSetup).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
      </div>

      {/* 安全提示 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>安全提示</span>
        </h3>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">角色切换安全</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 从家长端切换到儿童端无需验证</li>
              <li>• 从儿童端切换回家长端需要密码验证</li>
              <li>• 启用指纹验证可提供额外安全保护</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">密码安全</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• 请定期更换登录密码</li>
              <li>• 不要与他人分享您的账户信息</li>
              <li>• 退出应用时请确保完全登出</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  // 渲染应用设置标签页
  const renderAppTab = () => (
    <div className="space-y-6">
      {/* 通知设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>通知设置</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">推送通知</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appSettings.notifications}
                onChange={(e) => updateAppSetting('notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">声音提醒</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appSettings.sound}
                onChange={(e) => updateAppSetting('sound', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* 外观设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Palette className="w-5 h-5" />
          <span>外观设置</span>
        </h3>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {appSettings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="text-gray-700">深色模式</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={appSettings.darkMode}
              onChange={(e) => updateAppSetting('darkMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </div>
      
      {/* 数据设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>数据设置</span>
        </h3>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">自动备份</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={appSettings.autoBackup}
              onChange={(e) => updateAppSetting('autoBackup', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </div>
    </div>
  )
  
  // 渲染关于应用标签页
  const renderAboutTab = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">🎯</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">儿童行为管理</h2>
        <p className="text-gray-600 mb-4">版本 1.0.0</p>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          一款专为家庭设计的儿童行为管理应用，帮助家长科学记录和管理孩子的日常行为，
          通过积分奖励机制激励孩子养成良好习惯。
        </p>

        <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">核心功能</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="text-gray-700">行为记录管理</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              <span className="text-gray-700">积分奖励系统</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-gray-700">数据统计分析</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-700">多儿童管理</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">开发者</span>
          <span className="text-gray-900">Trae AI</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">技术支持</span>
          <span className="text-gray-900">support@childapp.com</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">客服热线</span>
          <span className="text-gray-900">400-123-4567</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">应用大小</span>
          <span className="text-gray-900">约 15.2 MB</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">更新日期</span>
          <span className="text-gray-900">2025-01-25</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">隐私政策</span>
          <button
            onClick={() => navigate('/privacy-policy')}
            className="text-orange-600 hover:text-orange-700"
          >
            查看详情
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">用户协议</span>
          <button
            onClick={() => navigate('/user-agreement')}
            className="text-orange-600 hover:text-orange-700"
          >
            查看详情
          </button>
        </div>
      </div>
    </div>
  )
  
  return (
    <div className="p-4 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        
        <h1 className="text-xl font-bold text-gray-900">设置</h1>
        
        <div className="w-16"></div>
      </div>
      
      {/* 标签页导航 */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.name}</span>
          </button>
        ))}
      </div>
      
      {/* 标签页内容 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'children' && renderChildrenTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'app' && renderAppTab()}
        {activeTab === 'about' && renderAboutTab()}
      </div>
      
      {/* 添加儿童弹窗 */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加儿童账户</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  昵称
                </label>
                <input
                  type="text"
                  value={childForm.nickname}
                  onChange={(e) => setChildForm({ ...childForm, nickname: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入儿童昵称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年龄
                </label>
                <input
                  type="number"
                  value={childForm.age}
                  onChange={(e) => setChildForm({ ...childForm, age: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入年龄"
                  min="1"
                  max="18"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性别
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="boy"
                      checked={childForm.gender === 'boy'}
                      onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                      className="mr-2"
                    />
                    <span>男孩</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="girl"
                      checked={childForm.gender === 'girl'}
                      onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                      className="mr-2"
                    />
                    <span>女孩</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddChildModal(false)
                  setChildForm({ nickname: '', age: '', gender: 'boy' })
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              
              <button
                onClick={handleAddChild}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="删除儿童账户"
        message="确定要删除这个儿童账户吗？删除后相关数据将无法恢复。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteChild}
        onCancel={cancelDeleteChild}
        type="danger"
      />

      {/* 修改密码弹窗 */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">修改密码</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当前密码
                </label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入当前密码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新密码
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入新密码（至少6位）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请再次输入新密码"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePassword(false)
                  setPasswordForm({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生物识别设置模态框 */}
      {showBiometricSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">设置指纹验证</h3>
              <button
                onClick={() => setShowBiometricSetup(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <BiometricAuth
              onSuccess={handleBiometricSetupSuccess}
              onError={handleBiometricSetupError}
              onCancel={() => setShowBiometricSetup(false)}
              autoStart={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage