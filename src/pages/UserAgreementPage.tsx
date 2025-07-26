import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Users, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const UserAgreementPage: React.FC = () => {
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
            <FileText className="w-6 h-6 text-orange-500" />
            <span>用户协议</span>
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

          {/* 协议概述 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-500" />
              <span>协议概述</span>
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                欢迎使用儿童行为管理应用（以下简称"本应用"或"我们的服务"）。
                本用户协议（以下简称"本协议"）是您与Trae AI之间关于使用本应用的法律协议。
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>重要提示：</strong>请仔细阅读本协议的所有条款。使用本应用即表示您已阅读、理解并同意受本协议约束。
                如果您不同意本协议的任何条款，请不要使用本应用。
              </p>
            </div>
          </section>

          {/* 服务说明 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <span>服务说明</span>
            </h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">应用功能</h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• <strong>行为管理：</strong>帮助家长记录和管理儿童的日常行为表现</li>
                  <li>• <strong>积分系统：</strong>通过积分奖励机制激励儿童养成良好习惯</li>
                  <li>• <strong>奖励商城：</strong>提供积分兑换奖励的平台</li>
                  <li>• <strong>数据报告：</strong>生成行为趋势分析和进步报告</li>
                  <li>• <strong>家庭管理：</strong>支持多儿童账户管理和家长监护功能</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">目标用户</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">家长用户</h4>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• 年满18周岁的成年人</li>
                      <li>• 具有完全民事行为能力</li>
                      <li>• 对儿童具有监护权</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">儿童用户</h4>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• 3-12岁的儿童</li>
                      <li>• 在家长监护下使用</li>
                      <li>• 账户由家长创建和管理</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 用户权利和义务 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">用户权利和义务</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>您的权利</span>
                </h3>
                <ul className="text-green-800 space-y-2 text-sm">
                  <li>• 免费使用本应用的基础功能</li>
                  <li>• 创建和管理儿童账户</li>
                  <li>• 查看、修改和删除个人数据</li>
                  <li>• 获得技术支持和客户服务</li>
                  <li>• 随时停止使用本应用</li>
                  <li>• 对服务质量提出意见和建议</li>
                </ul>
              </div>

              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h3 className="font-semibold text-orange-900 mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>您的义务</span>
                </h3>
                <ul className="text-orange-800 space-y-2 text-sm">
                  <li>• 提供真实、准确的注册信息</li>
                  <li>• 妥善保管账户密码和登录信息</li>
                  <li>• 合法、正当地使用本应用</li>
                  <li>• 尊重其他用户的权利</li>
                  <li>• 遵守相关法律法规</li>
                  <li>• 承担账户下所有活动的责任</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 使用规范 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>使用规范</span>
            </h2>
            
            <div className="space-y-4">
              <div className="border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">允许的使用</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 记录儿童的真实行为表现</li>
                  <li>• 设置合理的奖励和目标</li>
                  <li>• 与儿童分享积分和成就</li>
                  <li>• 导出个人数据用于备份</li>
                  <li>• 向我们反馈问题和建议</li>
                </ul>
              </div>

              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>禁止的行为</span>
                </h3>
                <ul className="text-red-800 space-y-1 text-sm">
                  <li>• 上传违法、有害或不当的内容</li>
                  <li>• 恶意刷分或操纵积分系统</li>
                  <li>• 侵犯他人隐私或知识产权</li>
                  <li>• 传播病毒或恶意代码</li>
                  <li>• 尝试破解或攻击系统</li>
                  <li>• 将账户转让给他人使用</li>
                  <li>• 用于商业目的或盈利活动</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 儿童保护 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">儿童保护条款</h2>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-pink-900 mb-3">特别保护措施</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-pink-800 mb-2">家长监护责任</h4>
                  <ul className="text-pink-700 space-y-1 text-sm">
                    <li>• 家长对儿童使用本应用承担完全监护责任</li>
                    <li>• 确保儿童在安全环境下使用应用</li>
                    <li>• 定期检查儿童的使用情况和数据</li>
                    <li>• 教育儿童正确使用数字产品</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-pink-800 mb-2">数据保护</h4>
                  <ul className="text-pink-700 space-y-1 text-sm">
                    <li>• 儿童数据仅在家长授权下收集</li>
                    <li>• 不收集儿童的敏感个人信息</li>
                    <li>• 严格限制儿童数据的使用范围</li>
                    <li>• 家长可随时删除儿童数据</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 免责声明 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">免责声明</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="text-yellow-800 space-y-2 text-sm">
                <li>• 本应用仅作为家庭教育的辅助工具，不能替代专业的教育指导</li>
                <li>• 我们不对用户的教育方法或效果承担责任</li>
                <li>• 因网络故障、设备问题等技术原因导致的服务中断，我们不承担责任</li>
                <li>• 用户因违反本协议而遭受的损失，我们不承担责任</li>
                <li>• 第三方服务（如云存储）的问题不在我们的责任范围内</li>
              </ul>
            </div>
          </section>

          {/* 服务变更和终止 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">服务变更和终止</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">服务变更</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 我们可能会更新应用功能</li>
                  <li>• 重大变更会提前通知用户</li>
                  <li>• 用户可选择接受或停止使用</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">服务终止</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 用户可随时删除账户</li>
                  <li>• 违规用户账户可能被暂停</li>
                  <li>• 服务终止前会保留数据导出期</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 知识产权 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">知识产权</h2>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">应用权利</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 本应用的所有内容、功能、设计均受知识产权法保护</li>
                  <li>• 用户仅获得使用许可，不拥有应用的任何知识产权</li>
                  <li>• 禁止复制、修改、分发或逆向工程本应用</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">用户内容</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 用户上传的内容（如照片、文字）归用户所有</li>
                  <li>• 用户授权我们使用这些内容以提供服务</li>
                  <li>• 用户保证上传内容不侵犯他人权利</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 数据安全 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">数据安全承诺</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">我们的承诺</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• 采用行业标准的安全措施保护用户数据</li>
                  <li>• 定期进行安全审计和漏洞修复</li>
                  <li>• 建立完善的数据备份和恢复机制</li>
                  <li>• 制定数据泄露应急响应预案</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">用户责任</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• 妥善保管账户密码和登录信息</li>
                  <li>• 及时更新应用到最新版本</li>
                  <li>• 发现安全问题及时报告</li>
                  <li>• 不要在不安全的网络环境下使用</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 争议解决 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">争议解决</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                因使用本应用而产生的争议，双方应首先通过友好协商解决。
                协商不成的，可向我们所在地的人民法院提起诉讼。
              </p>
              <p className="text-gray-700 text-sm">
                本协议的解释和执行适用中华人民共和国法律。
              </p>
            </div>
          </section>

          {/* 联系信息 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">联系我们</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm mb-3">
                如果您对本协议有任何疑问，请联系我们：
              </p>
              <div className="space-y-1 text-blue-700 text-sm">
                <p>邮箱：support@childapp.com</p>
                <p>客服热线：400-123-4567</p>
                <p>开发者：Trae AI</p>
              </div>
            </div>
          </section>

          {/* 协议生效 */}
          <section className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 text-sm">
                本协议自您开始使用本应用时生效，直至您停止使用本应用或删除账户时终止。
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

export default UserAgreementPage
