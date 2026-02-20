'use client';

import Link from 'next/link';

const plans = [
  {
    name: '免费版',
    price: '¥0',
    period: '',
    description: '适合学生、个人创业者、尝鲜用户',
    features: [
      { text: '基础任务管理', included: true },
      { text: 'AI 任务拆解（5次/月）', included: true },
      { text: 'AI 资源推荐（3次/月）', included: true },
      { text: '周报生成（1次/月）', included: true },
      { text: '本地存储', included: true },
      { text: 'AI 拆解不限次数', included: false },
      { text: 'AI 推荐不限次数', included: false },
      { text: '周报生成不限次数', included: false },
      { text: '优先级智能排序', included: false },
      { text: '数据云同步', included: false },
      { text: '导出 PDF/Word', included: false },
      { text: '团队成员协作', included: false },
      { text: '共享项目看板', included: false },
      { text: '管理员控制台', included: false },
      { text: 'API 访问', included: false },
    ],
    buttonText: '免费开始',
    highlighted: false,
  },
  {
    name: '专业版',
    price: '¥29',
    period: '/月 或 ¥199/年',
    description: '适合早期团队、小微企业',
    features: [
      { text: '基础任务管理', included: true },
      { text: 'AI 任务拆解（5次/月）', included: true },
      { text: 'AI 资源推荐（3次/月）', included: true },
      { text: '周报生成（1次/月）', included: true },
      { text: '本地存储', included: true },
      { text: 'AI 拆解不限次数', included: true },
      { text: 'AI 推荐不限次数', included: true },
      { text: '周报生成不限次数', included: true },
      { text: '优先级智能排序', included: true },
      { text: '数据云同步', included: true },
      { text: '导出 PDF/Word', included: true },
      { text: '团队成员协作', included: false },
      { text: '共享项目看板', included: false },
      { text: '管理员控制台', included: false },
      { text: 'API 访问', included: false },
    ],
    buttonText: '联系销售',
    highlighted: true,
    badge: '最受欢迎',
  },
  {
    name: '团队版',
    price: '¥99',
    period: '/月（含5个成员）',
    description: '适合创业公司、孵化器团队',
    features: [
      { text: '基础任务管理', included: true },
      { text: 'AI 任务拆解（5次/月）', included: true },
      { text: 'AI 资源推荐（3次/月）', included: true },
      { text: '周报生成（1次/月）', included: true },
      { text: '本地存储', included: true },
      { text: 'AI 拆解不限次数', included: true },
      { text: 'AI 推荐不限次数', included: true },
      { text: '周报生成不限次数', included: true },
      { text: '优先级智能排序', included: true },
      { text: '数据云同步', included: true },
      { text: '导出 PDF/Word', included: true },
      { text: '团队成员协作（任务分配）', included: true },
      { text: '共享项目看板', included: true },
      { text: '管理员控制台', included: true },
      { text: 'API 访问（定制）', included: true },
    ],
    buttonText: '联系销售',
    highlighted: true,
    badge: '企业首选',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
            定价与套餐
          </h1>
          <p className="text-gray-500 text-lg">
            选择适合您的套餐，随时可以取消订阅
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                plan.highlighted
                  ? 'ring-2 ring-indigo-500 ring-offset-2'
                  : 'border border-gray-100'
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  {plan.badge}
                </div>
              )}

              <div className="p-6 lg:p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm">
                      {feature.included ? (
                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/"
                  className={`block w-full py-3 px-6 rounded-xl text-center font-semibold transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            所有套餐均支持 7 天免费试用，无需信用卡
          </p>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 lg:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">常见问题</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">如何升级套餐？</h3>
              <p className="text-gray-500 text-sm">在设置页面选择"升级套餐"，选择您需要的套餐并完成支付即可。</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">可以随时取消吗？</h3>
              <p className="text-gray-500 text-sm">是的，您可以随时取消订阅，取消后将在当前计费周期结束时生效。</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">数据安全吗？</h3>
              <p className="text-gray-500 text-sm">我们采用银行级加密技术保护您的数据，并定期进行安全审计。</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">团队版如何添加成员？</h3>
              <p className="text-gray-500 text-sm">管理员可以在控制台邀请团队成员，超出配额的成员按 ¥19/人/月 计费。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
