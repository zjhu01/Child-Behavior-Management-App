import React, { useState, useEffect } from 'react'
import { Fingerprint, Check, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../store'

interface BiometricAuthProps {
  onSuccess: () => void
  onError: (error: string) => void
  onCancel?: () => void
  autoStart?: boolean
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onSuccess,
  onError,
  onCancel,
  autoStart = false
}) => {
  const { user, biometricSettings } = useAppStore()
  const [status, setStatus] = useState<'idle' | 'checking' | 'authenticating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // 检查浏览器支持
  const checkBrowserSupport = () => {
    if (!window.navigator.credentials) {
      return false
    }
    
    if (!window.PublicKeyCredential) {
      return false
    }
    
    return true
  }

  // 检查设备支持
  const checkDeviceSupport = async () => {
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch (error) {
      return false
    }
  }

  // 执行指纹验证
  const performBiometricAuth = async () => {
    if (!biometricSettings.enabled) {
      onError('指纹验证未启用')
      return
    }

    setStatus('checking')
    
    // 检查浏览器支持
    if (!checkBrowserSupport()) {
      setStatus('error')
      setErrorMessage('您的浏览器不支持生物识别验证')
      onError('浏览器不支持')
      return
    }

    // 检查设备支持
    const deviceSupported = await checkDeviceSupport()
    if (!deviceSupported) {
      setStatus('error')
      setErrorMessage('您的设备不支持指纹验证')
      onError('设备不支持')
      return
    }

    setStatus('authenticating')

    try {
      // 创建认证请求
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32), // 在实际应用中应该从服务器获取
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
        setStatus('success')
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        throw new Error('验证失败')
      }
    } catch (error: any) {
      setStatus('error')
      let message = '指纹验证失败'
      
      if (error.name === 'NotAllowedError') {
        message = '指纹验证被取消'
      } else if (error.name === 'NotSupportedError') {
        message = '设备不支持指纹验证'
      } else if (error.name === 'SecurityError') {
        message = '安全错误，请重试'
      } else if (error.name === 'AbortError') {
        message = '验证超时'
      }
      
      setErrorMessage(message)
      onError(message)
    }
  }

  // 重试验证
  const handleRetry = () => {
    setStatus('idle')
    setErrorMessage('')
    performBiometricAuth()
  }

  // 自动开始验证
  useEffect(() => {
    if (autoStart && biometricSettings.enabled) {
      performBiometricAuth()
    }
  }, [autoStart, biometricSettings.enabled])

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Fingerprint className="w-12 h-12 text-blue-500 animate-pulse" />
      case 'authenticating':
        return <Fingerprint className="w-12 h-12 text-blue-500 animate-bounce" />
      case 'success':
        return <Check className="w-12 h-12 text-green-500" />
      case 'error':
        return <X className="w-12 h-12 text-red-500" />
      default:
        return <Fingerprint className="w-12 h-12 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return '检查设备支持...'
      case 'authenticating':
        return '请将手指放在指纹传感器上'
      case 'success':
        return '验证成功！'
      case 'error':
        return errorMessage
      default:
        return '点击开始指纹验证'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'checking':
      case 'authenticating':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      {/* 状态图标 */}
      <div className="flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full">
        {getStatusIcon()}
      </div>

      {/* 状态文本 */}
      <div className="text-center">
        <p className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        
        {status === 'authenticating' && (
          <p className="text-xs text-gray-500 mt-1">
            验证将在60秒后超时
          </p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        {status === 'idle' && (
          <button
            onClick={performBiometricAuth}
            disabled={!biometricSettings.enabled}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            开始验证
          </button>
        )}
        
        {status === 'error' && (
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        )}
        
        {(status === 'authenticating' || status === 'error') && onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
        )}
      </div>

      {/* 提示信息 */}
      {!biometricSettings.enabled && (
        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle size={16} />
          <span className="text-sm">指纹验证未启用，请在设置中开启</span>
        </div>
      )}
    </div>
  )
}

export default BiometricAuth
