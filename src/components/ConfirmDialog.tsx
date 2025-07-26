import React from 'react'
import { AlertTriangle, X, Check } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'warning' | 'danger' | 'info'
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-500 hover:bg-red-600',
          icon: <AlertTriangle className="w-6 h-6" />
        }
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-500 hover:bg-blue-600',
          icon: <AlertTriangle className="w-6 h-6" />
        }
      default:
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmBg: 'bg-orange-500 hover:bg-orange-600',
          icon: <AlertTriangle className="w-6 h-6" />
        }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${typeStyles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <div className={typeStyles.iconColor}>
              {typeStyles.icon}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600">
            {message}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>{cancelText}</span>
          </button>
          
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 ${typeStyles.confirmBg}`}
          >
            <Check className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
