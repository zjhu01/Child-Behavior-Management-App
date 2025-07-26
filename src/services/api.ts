import { User, Child, BehaviorRecord, Reward, ExchangeRecord } from '../store'

// API基础配置 - 使用相对路径，通过Vite代理转发到后端
const API_BASE_URL = '/api'

// API响应接口
interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

// HTTP请求工具类
class ApiClient {
  private baseURL: string
  
  constructor(baseURL: string) {
    this.baseURL = baseURL
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const token = localStorage.getItem('token')
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }
    
    try {
      const response = await fetch(url, config)

      // 检查网络错误
      if (!response.ok) {
        let errorMessage = '请求失败'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API请求错误:', error)

      // 处理网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络设置')
      }

      throw error
    }
  }
  
  // GET请求
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }
  
  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  // DELETE请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
  
  // 文件上传
  async upload<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {}, // 让浏览器自动设置Content-Type
      body: formData,
    })
  }
}

// 创建API客户端实例
const apiClient = new ApiClient(API_BASE_URL)

// 认证相关API
export const authApi = {
  // 用户注册
  register: (data: {
    phone: string
    password: string
    nickname: string
    role: 'parent' | 'child'
  }) => apiClient.post<{ user_id: number; token: string }>('/auth/register', data),

  // 用户登录
  login: (data: { phone: string; password: string }) =>
    apiClient.post<{ user: User; token: string }>('/auth/login', data),

  // 验证token
  verifyToken: () => apiClient.get<{ valid: boolean }>('/auth/verify'),

  // 验证密码
  verifyPassword: (data: { password: string }) =>
    apiClient.post<{ valid: boolean }>('/auth/verify-password', data),

  // 修改密码
  changePassword: (data: { old_password: string; new_password: string }) =>
    apiClient.put<{ message: string }>('/auth/password', data),
}

// 用户管理API
export const userApi = {
  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<User>> => {
    return apiClient.get('/users/profile')
  },
  
  // 更新用户资料
  updateProfile: (data: {
    nickname?: string
    email?: string
    phone?: string
    avatar?: string
  }): Promise<ApiResponse<User>> => {
    return apiClient.put('/users/profile', data)
  },
  
  // 创建儿童账户
  createChild: (data: {
    nickname: string
    age: number
    gender: string
    avatar?: string
  }): Promise<ApiResponse<Child>> => {
    return apiClient.post('/children', data)
  },
  
  // 获取儿童列表
  getChildren: (): Promise<ApiResponse<Child[]>> => {
    return apiClient.get('/children')
  },
  
  // 更新儿童信息
  updateChild: (childId: number, data: Partial<Child>): Promise<ApiResponse<Child>> => {
    return apiClient.put(`/children/${childId}`, data)
  },
  
  // 删除儿童账户
  deleteChild: (childId: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/children/${childId}`)
  },
  
  // 更新用户信息
  updateUser: (data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.put('/users/profile', data)
  }
}

// 行为管理API
export const behaviorApi = {
  // 记录行为评分
  createBehavior: (data: {
    child_id: number
    behavior_type: string
    behavior_desc: string
    score_change: number
    image_url?: string
  }) => apiClient.post<BehaviorRecord>('/behaviors', data),
  
  // 获取行为记录
  getBehaviors: (params: {
    child_id?: number
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
  }) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, value.toString())
      }
    })
    return apiClient.get<BehaviorRecord[]>(`/behaviors?${query.toString()}`)
  },
}

// 积分管理API
export const pointsApi = {
  // 获取用户积分
  getUserPoints: (userId: number) =>
    apiClient.get<{ total_points: number; available_points: number }>(`/users/${userId}/points`),
}

// 奖励管理API
export const rewardApi = {
  // 创建奖励
  createReward: (data: {
    name: string
    description?: string
    points_cost: number
    stock: number
  }) => apiClient.post<Reward>('/rewards', data),
  
  // 获取奖励列表
  getRewards: () => apiClient.get<Reward[]>('/rewards'),
  
  // 兑换奖励
  exchangeReward: (data: {
    reward_id: number
    points_used: number
  }): Promise<ApiResponse<ExchangeRecord>> => {
    return apiClient.post('/rewards/exchange', data)
  },
  
  // 获取兑换记录
  getExchangeRecords: () => apiClient.get<ExchangeRecord[]>('/rewards/exchanges'),

  // 更新奖励
  updateReward: (rewardId: number, data: {
    name?: string
    description?: string
    points?: number
    stock?: number
    is_active?: boolean
  }) => apiClient.put<{ message: string }>(`/rewards/${rewardId}`, data),

  // 删除奖励
  deleteReward: (rewardId: number) => apiClient.delete<{ message: string }>(`/rewards/${rewardId}`),
}

// 统计报告API
export const statisticsApi = {
  // 获取行为趋势数据
  getBehaviorTrend: (params: { child_id: number; period: 'week' | 'month' }) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      query.append(key, value.toString())
    })
    return apiClient.get(`/behaviors/trend?${query.toString()}`)
  },

  // 获取统计数据
  getStatistics: (params: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    child_id?: number
  }) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, value.toString())
      }
    })
    return apiClient.get(`/statistics?${query.toString()}`)
  },
}

// 文件上传API
export const uploadApi = {
  // 上传图片
  uploadImage: (file: File) =>
    apiClient.upload<{ url: string }>('/upload/file', file),
}