'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FeatureType, FEATURE_LIMITS } from '@/lib/usageLimit';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: FeatureType;
}

const plans = [
  {
    name: '免费版',
    price: '¥0',
    features: ['AI 拆解 5次/月', 'AI 推荐 3次/月', '周报 1次/月'],
    current: true,
  },
  {
    name: '专业版',
    price: '¥29',
    period: '/月',
    features: ['AI 功能不限次数', '数据云同步', '导出 PDF/Word'],
    highlight: true,
  },
  {
    name: '团队版',
    price: '¥99',
    period: '/月',
    features: ['所有专业版功能', '团队协作', 'API 访问'],
  },
];

export default function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const featureName = feature ? FEATURE_LIMITS[feature].name : 'AI 功能';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-3xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-10 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <i className="fas fa-times text-white"></i>
          </button>

          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <i className="fas fa-crown text-4xl text-yellow-300"></i>
          </div>

          <h2 className="text-2xl font-bold mb-2">解锁更多可能</h2>
          <p className="text-white/80">
            {featureName}免费次数已用完，升级解锁无限使用
          </p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-5 transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-500 scale-105'
                    : 'bg-gray-50'
                } ${plan.current ? 'opacity-60' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    推荐
                  </div>
                )}

                <h3 className="font-bold text-gray-800 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-0.5 mb-3">
                  <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <i className={`fas fa-check text-xs ${plan.highlight ? 'text-indigo-500' : 'text-gray-400'}`}></i>
                      {feat}
                    </li>
                  ))}
                </ul>

                {plan.current && (
                  <div className="mt-4 text-center text-sm text-gray-500 font-medium">
                    当前套餐
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              稍后再说
            </button>
            <Link
              href="/pricing"
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <i className="fas fa-arrow-up"></i>
              查看定价
            </Link>
          </div>

          <p className="text-center text-gray-400 text-sm mt-4">
            <i className="fas fa-shield-alt mr-1"></i>
            安全支付 · 随时取消 · 7天无理由退款
          </p>
        </div>
      </div>
    </div>
  );
}
