import React, { useState } from 'react'
import { ChevronDown, User } from 'lucide-react'
import { useAppStore, Child } from '../store'

interface ChildSelectorProps {
  className?: string
}

const ChildSelector: React.FC<ChildSelectorProps> = ({ className = '' }) => {
  const { children, selectedChild, setSelectedChild } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)

  // 如果只有一个孩子或没有孩子，不显示选择器
  if (children.length <= 1) {
    return null
  }

  const currentChild = selectedChild || children[0]

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* 当前选中的孩子 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-orange-700 hover:bg-orange-100 transition-colors"
      >
        <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center">
          {currentChild?.avatar ? (
            <img
              src={currentChild.avatar}
              alt={currentChild.nickname}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={14} className="text-orange-600" />
          )}
        </div>
        <span className="text-sm font-medium">{currentChild?.nickname}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 选项列表 */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    currentChild?.id === child.id ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    {child.avatar ? (
                      <img
                        src={child.avatar}
                        alt={child.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {child.nickname.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{child.nickname}</div>
                    <div className="text-xs text-gray-500">
                      {child.age}岁 · {child.gender === 'boy' ? '男孩' : '女孩'}
                    </div>
                  </div>
                  
                  {currentChild?.id === child.id && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChildSelector
