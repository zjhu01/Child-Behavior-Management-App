import React, { useState } from 'react'
import { X, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../store'

interface ParentAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
}

const ParentAuthModal: React.FC<ParentAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = '家长身份验证',
  description = '请输入您的登录密码以切换到家长端'
}) => {
  const { user, biometricSettings, setLastParentAuth } = useAppStore()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)

  // 重置状态
  const resetState = () => {
    setPassword('')
    setShowPassword(false)
    setLoading(false)
    setBiometricLoading(false)
  }

  // 处理关闭
  const handleClose = () => {
    resetState()
    onClose()
  }

  // 密码验证
  const handlePasswordAuth = async () => {
    if (!password.trim()) {
      toast.error('请输入密码')
      return
    }

    setLoading(true)
    try {
      // 调用后端API验证密码
      const { authApi } = await import('../services/api')
      const response = await authApi.verifyPassword({ password })
      
      if (response.code === 200) {
        setLastParentAuth(Date.now())
        toast.success('验证成功')
        resetState()
        onSuccess()
      }
    } catch (error: any) {
      toast.error(error.message || '密码验证失败')
    } finally {
      setLoading(false)
    }
  }

  // 指纹验证
  const handleBiometricAuth = async () => {
    if (!biometricSettings.enabled) {
      toast.error('指纹验证未启用')
      return
    }

    setBiometricLoading(true)
    try {
      // 检查浏览器支持
      if (!window.navigator.credentials) {
        toast.error('您的浏览器不支持生物识别验证')
        return
      }

      // 使用WebAuthn API进行指纹验证
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: new TextEncoder().encode(user?.id.toString() || ''),
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        }
      })

      if (credential) {
        setLastParentAuth(Date.now())
        toast.success('指纹验证成功')
        resetState()
        onSuccess()
      }
    } catch (error: any) {
      console.error('Biometric auth error:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('指纹验证被取消')
      } else if (error.name === 'NotSupportedError') {
        toast.error('设备不支持指纹验证')
      } else {
        toast.error('指纹验证失败，请使用密码验证')
      }
    } finally {
      setBiometricLoading(false)
    }
  }

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordAuth()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 密码输入 */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入登录密码"
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                disabled={loading || biometricLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading || biometricLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            <button
              onClick={handlePasswordAuth}
              disabled={loading || biometricLoading || !password.trim()}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '验证中...' : '密码验证'}
            </button>
          </div>

          {/* 指纹验证 */}
          {biometricSettings.enabled && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>

              <button
                onClick={handleBiometricAuth}
                disabled={loading || biometricLoading}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Fingerprint size={20} />
                <span>{biometricLoading ? '验证中...' : '指纹验证'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ParentAuthModal
