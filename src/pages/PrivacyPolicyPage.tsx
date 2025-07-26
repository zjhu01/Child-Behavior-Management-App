import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Phone, Mail } from 'lucide-react'

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          
          <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-orange-500" />
            <span>隐私政策</span>
          </h1>
          
          <div className="w-16"></div>
        </div>

        {/* 主要内容 */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-8">
          {/* 更新日期 */}
          <div className="text-center border-b pb-6">
            <p className="text-sm text-gray-500">最后更新日期：2025年1月25日</p>
            <p className="text-sm text-gray-500 mt-1">生效日期：2025年1月25日</p>
          </div>

          {/* 引言 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Eye className="w-6 h-6 text-blue-500" />
              <span>引言</span>
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                欢迎使用儿童行为管理应用（以下简称"本应用"）。我们深知您对隐私保护的关注，特别是涉及儿童信息时。
                本隐私政策详细说明了我们如何收集、使用、存储和保护您和您孩子的个人信息。
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>重要提示：</strong>本应用专为3-12岁儿童的家庭设计，我们严格遵守《儿童在线隐私保护法》(COPPA)
                和相关法律法规，确保儿童信息的安全。
              </p>
            </div>
          </section>

          {/* 信息收集 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-500" />
              <span>我们收集的信息</span>
            </h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span>家长账户信息</span>
                </h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• <strong>基本信息：</strong>手机号码、昵称、邮箱地址（可选）</li>
                  <li>• <strong>身份验证：</strong>登录密码、生物识别信息（如启用）</li>
                  <li>• <strong>个人资料：</strong>头像图片、个人偏好设置</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-pink-500" />
                  <span>儿童账户信息</span>
                </h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• <strong>基本信息：</strong>昵称、年龄、性别</li>
                  <li>• <strong>头像信息：</strong>儿童头像图片</li>
                  <li>• <strong>行为数据：</strong>行为记录、积分变化、成就徽章</li>
                  <li>• <strong>奖励记录：</strong>兑换历史、偏好设置</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                  <p className="text-amber-800 text-sm">
                    <strong>儿童信息保护：</strong>儿童账户不收集手机号、邮箱等敏感联系信息，
                    所有儿童数据仅在家长授权下收集和使用。
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">使用数据</h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• <strong>应用使用：</strong>功能使用频率、操作日志</li>
                  <li>• <strong>设备信息：</strong>设备型号、操作系统版本、应用版本</li>
                  <li>• <strong>技术数据：</strong>IP地址、错误日志（仅用于故障排除）</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 信息使用 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">信息使用目的</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">核心功能</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 提供行为管理和积分系统服务</li>
                  <li>• 生成个性化的数据报告和分析</li>
                  <li>• 管理奖励兑换和成就系统</li>
                  <li>• 保存用户偏好和应用设置</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">服务改进</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 优化应用性能和用户体验</li>
                  <li>• 修复技术问题和漏洞</li>
                  <li>• 开发新功能和改进现有功能</li>
                  <li>• 提供技术支持和客户服务</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 信息保护 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-red-500" />
              <span>信息保护措施</span>
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-green-900 mb-2">技术保护</h3>
                <ul className="text-green-800 space-y-1 text-sm">
                  <li>• 数据传输采用HTTPS加密协议</li>
                  <li>• 密码使用bcrypt算法加密存储</li>
                  <li>• 数据库访问采用严格的权限控制</li>
                  <li>• 定期进行安全漏洞扫描和修复</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">管理保护</h3>
                <ul className="text-green-800 space-y-1 text-sm">
                  <li>• 员工签署保密协议，限制数据访问权限</li>
                  <li>• 建立数据泄露应急响应机制</li>
                  <li>• 定期备份数据，确保数据安全</li>
                  <li>• 遵循最小化数据收集原则</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 信息共享 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">信息共享政策</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-3">我们承诺</h3>
              <p className="text-red-800 text-sm leading-relaxed">
                <strong>我们不会向第三方出售、出租或交易您的个人信息。</strong>
                除以下特殊情况外，我们不会与任何第三方共享您的个人信息：
              </p>
              <ul className="text-red-800 space-y-1 text-sm mt-3">
                <li>• 获得您的明确同意</li>
                <li>• 法律法规要求或政府部门要求</li>
                <li>• 保护用户或公众的安全</li>
                <li>• 与我们的服务提供商（如云存储服务）共享必要信息以提供服务</li>
              </ul>
            </div>
          </section>

          {/* 用户权利 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">您的权利</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">数据控制权</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 查看和更新个人信息</li>
                  <li>• 删除账户和相关数据</li>
                  <li>• 导出个人数据</li>
                  <li>• 撤回同意授权</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">隐私设置</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 管理通知偏好</li>
                  <li>• 控制数据收集范围</li>
                  <li>• 设置生物识别验证</li>
                  <li>• 管理儿童账户权限</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 联系我们 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">联系我们</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 mb-4">
                如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">邮箱：privacy@childapp.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">客服热线：400-123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">开发者：Trae AI</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-4">
                我们将在收到您的请求后7个工作日内回复。
              </p>
            </div>
          </section>

          {/* 数据保留 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">数据保留政策</h2>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">保留期限</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• <strong>账户数据：</strong>账户存续期间及删除后30天</li>
                  <li>• <strong>行为记录：</strong>记录生成后3年或账户删除时</li>
                  <li>• <strong>积分数据：</strong>与行为记录同步保留</li>
                  <li>• <strong>技术日志：</strong>生成后90天自动删除</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  <strong>数据删除：</strong>您可随时要求删除个人数据，我们将在7个工作日内完成处理。
                  法律要求保留的数据除外。
                </p>
              </div>
            </div>
          </section>

          {/* 第三方服务 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">第三方服务</h2>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">集成服务</h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• <strong>云存储服务：</strong>用于数据备份和同步（数据加密存储）</li>
                  <li>• <strong>推送服务：</strong>用于发送应用通知（不包含个人信息）</li>
                  <li>• <strong>分析服务：</strong>用于改进应用性能（匿名化数据）</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm">
                  所有第三方服务均经过严格筛选，确保符合数据保护标准。
                  我们与第三方签署数据处理协议，限制其数据使用范围。
                </p>
              </div>
            </div>
          </section>

          {/* 政策更新 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">政策更新</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm leading-relaxed">
                我们可能会不时更新本隐私政策。重大变更时，我们会通过应用内通知、邮件或其他适当方式通知您。
                继续使用本应用即表示您同意更新后的隐私政策。
              </p>
            </div>
          </section>
        </div>

        {/* 底部版权信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm text-center border-t">
          <p className="text-gray-500 text-sm">
            © 2025 Trae AI. 保留所有权利。
          </p>
          <p className="text-gray-400 text-xs mt-1">
            儿童行为管理应用 v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
