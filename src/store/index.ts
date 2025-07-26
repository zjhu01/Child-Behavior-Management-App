import { create } from 'zustand'

// 用户角色类型
export type UserRole = 'parent' | 'child'

// 视图模式类型
export type ViewMode = 'parent' | 'child'

// 生物识别设置接口
export interface BiometricSettings {
  enabled: boolean
  lastSetup: string | null
}

// 用户信息接口
export interface User {
  id: number
  username: string
  nickname: string
  email?: string
  phone?: string
  avatar?: string
  role: UserRole
  parent_id?: number
  available_points?: number
  total_points?: number
  level?: number
  created_at: string
  updated_at: string
}

// 儿童信息接口
export interface Child {
  id: number
  nickname: string
  avatar?: string
  age: number
  gender: string
  available_points: number
  total_points: number
  level: number
  parent_id: number
  created_at: string
  updated_at: string
}

// 行为记录接口
export interface BehaviorRecord {
  id: number
  child_id: number
  child_name?: string
  recorder_id: number
  recorder_name?: string
  behavior_type: string
  behavior_desc: string
  score_change: number
  image_url?: string
  recorded_at: string
}

// 奖励接口
export interface Reward {
  id: number
  parent_id: number
  name: string
  description?: string
  points_cost: number
  image_url?: string
  stock: number
  is_active: boolean
}

// 兑换记录接口
export interface ExchangeRecord {
  id: number
  child_id: number
  reward_id: number
  points_used: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  reward?: Reward
}

// 应用状态接口
interface AppState {
  // 用户相关
  user: User | null
  token: string | null
  isAuthenticated: boolean
  currentRole: 'parent' | 'child'
  viewMode: ViewMode // 当前视图模式

  // 安全相关
  biometricSettings: BiometricSettings
  lastParentAuth: number | null // 最后一次家长验证时间戳

  // 儿童相关
  children: Child[]
  selectedChild: Child | null
  
  // 行为记录
  behaviorRecords: BehaviorRecord[]
  
  // 奖励相关
  rewards: Reward[]
  exchangeRecords: ExchangeRecord[]
  
  // UI状态
  loading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setBiometricSettings: (settings: BiometricSettings) => void
  setLastParentAuth: (timestamp: number | null) => void
  setChildren: (children: Child[]) => void
  addChild: (child: Child) => void
  updateChild: (id: number, updates: Partial<Child>) => void
  removeChild: (id: number) => void
  setSelectedChild: (child: Child | null) => void
  setBehaviorRecords: (records: BehaviorRecord[]) => void
  addBehaviorRecord: (record: BehaviorRecord) => void
  setRewards: (rewards: Reward[]) => void
  addReward: (reward: Reward) => void
  updateReward: (id: number, updates: Partial<Reward>) => void
  removeReward: (id: number) => void
  setExchangeRecords: (records: ExchangeRecord[]) => void
  addExchangeRecord: (record: ExchangeRecord) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  switchToChildView: () => void
  switchToParentView: (skipAuth?: boolean) => Promise<boolean>
  initializeApp: () => void
  logout: () => void
}

// 创建状态管理store
export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  currentRole: 'parent',
  viewMode: (localStorage.getItem('viewMode') as ViewMode) || 'parent',
  biometricSettings: {
    enabled: localStorage.getItem('biometricEnabled') === 'true',
    lastSetup: localStorage.getItem('biometricLastSetup')
  },
  lastParentAuth: null,
  children: [],
  selectedChild: null,
  behaviorRecords: [],
  rewards: [],
  exchangeRecords: [],
  loading: false,
  error: null,
  
  // Actions
  setUser: (user) => set({ user }),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token, isAuthenticated: !!token })
  },

  setViewMode: (mode) => {
    localStorage.setItem('viewMode', mode)
    set({ viewMode: mode })
  },

  setBiometricSettings: (settings) => {
    localStorage.setItem('biometricEnabled', settings.enabled.toString())
    if (settings.lastSetup) {
      localStorage.setItem('biometricLastSetup', settings.lastSetup)
    } else {
      localStorage.removeItem('biometricLastSetup')
    }
    set({ biometricSettings: settings })
  },

  setLastParentAuth: (timestamp) => set({ lastParentAuth: timestamp }),
  
  setChildren: (children) => {
    const state = get()
    let selectedChild = state.selectedChild

    // 如果有存储的选中孩子ID，尝试恢复
    const savedChildId = localStorage.getItem('selectedChildId')
    if (savedChildId && children.length > 0) {
      const savedChild = children.find(child => child.id.toString() === savedChildId)
      if (savedChild) {
        selectedChild = savedChild
      } else if (!selectedChild) {
        // 如果保存的孩子不存在且当前没有选中的孩子，选择第一个
        selectedChild = children[0]
      }
    } else if (!selectedChild && children.length > 0) {
      // 如果没有保存的选择且当前没有选中的孩子，选择第一个
      selectedChild = children[0]
    }

    set({ children, selectedChild })
  },
  
  addChild: (child) => set((state) => ({ children: [...state.children, child] })),
  
  updateChild: (id, updates) => set((state) => ({
    children: state.children.map(child => 
      child.id === id ? { ...child, ...updates } : child
    )
  })),
  
  removeChild: (id) => set((state) => ({
    children: state.children.filter(child => child.id !== id)
  })),
  
  setSelectedChild: (child) => {
    // 持久化选中的孩子ID到localStorage
    if (child) {
      localStorage.setItem('selectedChildId', child.id.toString())
    } else {
      localStorage.removeItem('selectedChildId')
    }
    set({ selectedChild: child })
  },
  
  setBehaviorRecords: (records) => set({ behaviorRecords: records }),
  
  addBehaviorRecord: (record) => set((state) => ({
    behaviorRecords: [record, ...state.behaviorRecords]
  })),
  
  setRewards: (rewards) => set({ rewards }),
  
  addReward: (reward) => set((state) => ({ rewards: [...state.rewards, reward] })),
  
  updateReward: (id, updates) => set((state) => ({
    rewards: state.rewards.map(reward => 
      reward.id === id ? { ...reward, ...updates } : reward
    )
  })),
  
  removeReward: (id) => set((state) => ({
    rewards: state.rewards.filter(reward => reward.id !== id)
  })),
  
  setExchangeRecords: (records) => set({ exchangeRecords: records }),
  
  addExchangeRecord: (record) => set((state) => ({
    exchangeRecords: [record, ...state.exchangeRecords]
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  switchToChildView: () => {
    const state = get()
    // 只有家长用户可以切换到儿童视图
    if (state.user?.role === 'parent') {
      localStorage.setItem('viewMode', 'child')

      let selectedChild = state.selectedChild

      // 如果没有选中的儿童且有儿童列表，尝试从localStorage恢复或选择第一个
      if (!selectedChild && state.children.length > 0) {
        const savedChildId = localStorage.getItem('selectedChildId')
        if (savedChildId) {
          const savedChild = state.children.find(child => child.id.toString() === savedChildId)
          selectedChild = savedChild || state.children[0]
        } else {
          selectedChild = state.children[0]
        }
      }

      set({ viewMode: 'child', selectedChild })
    }
  },

  switchToParentView: async (skipAuth = false) => {
    const state = get()

    // 如果用户本身是儿童角色，不允许切换到家长端
    if (state.user?.role === 'child') {
      return false
    }

    // 如果已经在家长视图模式，直接返回成功
    if (state.viewMode === 'parent') {
      return true
    }

    // 如果跳过验证（比如刚登录时），直接切换
    if (skipAuth) {
      localStorage.setItem('viewMode', 'parent')
      set({ viewMode: 'parent', lastParentAuth: Date.now() })
      return true
    }

    // 检查是否需要重新验证（5分钟内的验证可以跳过）
    const now = Date.now()
    const lastAuth = state.lastParentAuth
    if (lastAuth && (now - lastAuth) < 5 * 60 * 1000) {
      localStorage.setItem('viewMode', 'parent')
      set({ viewMode: 'parent' })
      return true
    }

    // 需要验证，返回false让调用者处理验证逻辑
    return false
  },
  
  initializeApp: async () => {
    const token = localStorage.getItem('token')
    if (token) {
      // 验证token是否有效
      try {
        const { authApi } = await import('../services/api')
        await authApi.verifyToken()
        set({
          token,
          isAuthenticated: true,
          loading: false,
          error: null
        })
      } catch (error) {
        // token无效，清除
        localStorage.removeItem('token')
        set({
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null
        })
      }
    } else {
      set({
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      })
    }
  },
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('viewMode')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      currentRole: 'parent',
      viewMode: 'parent',
      lastParentAuth: null,
      children: [],
      selectedChild: null,
      behaviorRecords: [],
      rewards: [],
      exchangeRecords: []
    })
  }
}))