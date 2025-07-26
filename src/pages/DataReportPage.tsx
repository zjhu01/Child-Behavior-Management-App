import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { statisticsApi } from '../services/api'
import { toast } from 'sonner'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Award, 
  Target,
  ArrowLeft,
  Download,
  Filter
} from 'lucide-react'

interface DailyStats {
  date: string
  positive_behaviors: number
  negative_behaviors: number
  total_points: number
}

interface CategoryStats {
  category: string
  count: number
  points: number
  color: string
}

interface ChildStats {
  child_id: number
  child_name: string
  total_behaviors: number
  positive_rate: number
  total_points: number
  level: number
}

const DataReportPage: React.FC = () => {
  const navigate = useNavigate()
  const { children, isAuthenticated, token } = useAppStore()
  
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [selectedChild, setSelectedChild] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)
  
  // 统计数据
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [childrenStats, setChildrenStats] = useState<ChildStats[]>([])
  const [overallStats, setOverallStats] = useState({
    total_behaviors: 0,
    positive_rate: 0,
    total_points: 0,
    active_children: 0
  })
  
  // 时间周期选项
  const periodOptions = [
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'quarter', label: '本季度' },
    { value: 'year', label: '本年' }
  ]
  
  // 行为分类颜色
  const categoryColors = {
    learning: '#3B82F6',
    life: '#10B981',
    social: '#8B5CF6',
    emotion: '#EC4899',
    exercise: '#F59E0B',
    eating: '#EF4444'
  }
  
  useEffect(() => {
    // 只有在已认证且有token的情况下才加载数据
    if (isAuthenticated && token) {
      loadStatistics()
    }
  }, [selectedPeriod, selectedChild, isAuthenticated, token])
  
  // 加载统计数据
  const loadStatistics = async () => {
    setLoading(true)
    try {
      const response = await statisticsApi.getStatistics({
        period: selectedPeriod as 'week' | 'month' | 'quarter' | 'year',
        child_id: selectedChild === 'all' ? undefined : selectedChild as number
      })

      if (response.code === 200 && response.data) {
        const data = response.data as any

        // 设置每日统计数据
        setDailyStats(data.daily_stats || [])

        // 设置分类统计数据
        setCategoryStats(data.category_stats || [])

        // 设置儿童统计数据
        setChildrenStats(data.children_stats || [])

        // 设置总体统计数据
        setOverallStats(data.overall_stats || {
          total_behaviors: 0,
          positive_rate: 0,
          total_points: 0,
          active_children: 0
        })
      } else {
        // 如果没有数据，设置空数据
        setDailyStats([])
        setCategoryStats([])
        setChildrenStats([])
        setOverallStats({
          total_behaviors: 0,
          positive_rate: 0,
          total_points: 0,
          active_children: 0
        })
      }

      setLoading(false)
    } catch (error: any) {
      console.error('加载统计数据失败:', error)
      toast.error(error.message || '加载统计数据失败')

      // 出错时设置空数据
      setDailyStats([])
      setCategoryStats([])
      setChildrenStats([])
      setOverallStats({
        total_behaviors: 0,
        positive_rate: 0,
        total_points: 0,
        active_children: 0
      })

      setLoading(false)
    }
  }
  
  // 导出报告
  const handleExportReport = () => {
    toast.success('报告导出功能开发中...')
  }
  
  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
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
      {/* 头部 */}
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
            onClick={handleExportReport}
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
          >
            <Download size={16} />
            <span className="text-sm">导出</span>
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">📊 数据报告</h1>
        
        {/* 筛选器 */}
        <div className="flex flex-wrap gap-3">
          {/* 时间周期选择 */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 儿童选择 */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">全部儿童</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.nickname}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 总览卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">总行为数</p>
              <p className="text-3xl font-bold text-gray-900">{overallStats.total_behaviors}</p>
              <p className="text-xs text-gray-500 mt-1">累计记录</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">积极率</p>
              <p className="text-3xl font-bold text-green-600">{overallStats.positive_rate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">表现良好</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">总积分</p>
              <p className="text-3xl font-bold text-orange-600">{overallStats.total_points}</p>
              <p className="text-xs text-gray-500 mt-1">奖励积分</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">活跃儿童</p>
              <p className="text-3xl font-bold text-purple-600">{overallStats.active_children}</p>
              <p className="text-xs text-gray-500 mt-1">参与统计</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* 每日趋势图 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">每日行为趋势</h3>
          {dailyStats.length === 0 && (
            <span className="text-sm text-gray-500">暂无数据</span>
          )}
        </div>

        {dailyStats.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#666"
                  fontSize={12}
                  tick={{ fill: '#666' }}
                />
                <YAxis stroke="#666" fontSize={12} tick={{ fill: '#666' }} />
                <Tooltip
                  labelFormatter={(value) => `日期: ${formatDate(value as string)}`}
                  formatter={(value, name) => {
                    const nameMap: Record<string, string> = {
                      positive_behaviors: '积极行为',
                      negative_behaviors: '消极行为',
                      total_points: '总积分'
                    }
                    return [value, nameMap[name as string] || name]
                  }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="positive_behaviors"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="negative_behaviors"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#EF4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">暂无趋势数据</p>
              <p className="text-gray-400 text-xs mt-1">记录行为数据后这里将显示每日趋势图</p>
            </div>
          </div>
        )}
      </div>
      
      {/* 行为分类统计 */}
      <div className="space-y-6">
        {/* 分类柱状图 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">行为分类统计</h3>
            {categoryStats.length === 0 && (
              <span className="text-sm text-gray-500">暂无数据</span>
            )}
          </div>

          {categoryStats.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="category"
                    stroke="#666"
                    fontSize={12}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis stroke="#666" fontSize={12} tick={{ fill: '#666' }} />
                  <Tooltip
                    formatter={(value, name) => {
                      const nameMap: Record<string, string> = {
                        count: '行为次数',
                        points: '获得积分'
                      }
                      return [value, nameMap[name as string] || name]
                    }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">暂无行为分类数据</p>
                <p className="text-gray-400 text-xs mt-1">开始记录行为后这里将显示统计图表</p>
              </div>
            </div>
          )}
        </div>

        {/* 分类饼图 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">行为分布</h3>
            {categoryStats.length === 0 && (
              <span className="text-sm text-gray-500">暂无数据</span>
            )}
          </div>

          {categoryStats.length > 0 ? (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}次`, '行为次数']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 图例 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                {categoryStats.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700 block truncate">{item.category}</span>
                      <span className="text-xs text-gray-500">{item.count}次</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">暂无行为分布数据</p>
                <p className="text-gray-400 text-xs mt-1">记录不同类型的行为后这里将显示分布图</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 儿童排行榜 */}
      {selectedChild === 'all' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">儿童表现排行</h3>
            {childrenStats.length === 0 && (
              <span className="text-sm text-gray-500">暂无数据</span>
            )}
          </div>

          {childrenStats.length > 0 ? (
            <div className="space-y-4">
              {childrenStats
                .sort((a, b) => b.total_points - a.total_points)
                .map((child, index) => (
                  <div key={child.child_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-gray-300 to-gray-500'
                      }`}>
                        {index + 1}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{child.child_name}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                            等级 {child.level}
                          </span>
                          <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                            积极率 {child.positive_rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-orange-600 text-xl">{child.total_points}</p>
                      <p className="text-sm text-gray-500">积分</p>
                      <p className="text-xs text-gray-400 mt-1">{child.total_behaviors} 次行为</p>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">暂无儿童数据</p>
                <p className="text-gray-400 text-xs mt-1">添加儿童账户并记录行为后这里将显示排行</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DataReportPage