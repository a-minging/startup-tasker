'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import resources from '@/data/resources.json';

interface Resource {
  id: number;
  title: string;
  description: string;
  url: string;
  type: 'article' | 'template' | 'tool' | 'course' | 'investor';
  tags: string[];
  stage: 'idea' | 'mvp' | 'growth';
  clicks: number;
  likes: number;
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    article: '文章',
    template: '模板',
    tool: '工具',
    course: '课程',
    investor: '投资人',
  };
  return labels[type] || '资源';
};

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    article: 'from-blue-500 to-cyan-500',
    template: 'from-purple-500 to-pink-500',
    tool: 'from-green-500 to-emerald-500',
    course: 'from-amber-500 to-orange-500',
    investor: 'from-red-500 to-rose-500',
  };
  return colors[type] || 'from-gray-500 to-slate-500';
};

const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    article: 'fa-book',
    template: 'fa-file-alt',
    tool: 'fa-tools',
    course: 'fa-play-circle',
    investor: 'fa-hand-holding-usd',
  };
  return icons[type] || 'fa-lightbulb';
};

const getStageLabel = (stage: string): string => {
  const labels: Record<string, string> = {
    idea: '创意阶段',
    mvp: 'MVP 阶段',
    growth: '增长阶段',
  };
  return labels[stage] || '';
};

const getCacheKey = (id: number): string => `resource-detail-${id}`;

const getCachedDetail = (id: number): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(getCacheKey(id));
  } catch {
    return null;
  }
};

const setCachedDetail = (id: number, detail: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getCacheKey(id), detail);
  } catch (e) {
    console.warn('Failed to cache detail:', e);
  }
};

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resourceId = parseInt(params.id as string, 10);
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoadingResource, setIsLoadingResource] = useState(true);
  const [detail, setDetail] = useState<string>('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string>('');
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchDetail = useCallback(async (resourceData: Resource, forceRefresh: boolean = false) => {
    setIsLoadingDetail(true);
    setError('');
    setIsFromCache(false);
    
    if (!forceRefresh) {
      const cachedDetail = getCachedDetail(resourceData.id);
      if (cachedDetail) {
        setDetail(cachedDetail);
        setIsFromCache(true);
        setIsLoadingDetail(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/ai/resource-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: resourceData.title,
          description: resourceData.description,
          type: getTypeLabel(resourceData.type),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取详情失败');
      }

      const data = await response.json();
      setDetail(data.detail);
      setCachedDetail(resourceData.id, data.detail);
      setIsFromCache(false);
    } catch (err) {
      console.error('Failed to fetch detail:', err);
      setError(err instanceof Error ? err.message : '加载详情失败，请稍后重试');
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const handleRetry = () => {
    if (resource) {
      fetchDetail(resource);
    }
  };

  const handleRefresh = () => {
    if (resource) {
      fetchDetail(resource, true);
    }
  };

  useEffect(() => {
    const foundResource = (resources as Resource[]).find(r => r.id === resourceId);
    setResource(foundResource || null);
    setIsLoadingResource(false);
  }, [resourceId]);

  useEffect(() => {
    if (resource) {
      fetchDetail(resource);
    }
  }, [resource, fetchDetail]);

  if (isLoadingResource) {
    return (
      <div className="min-h-screen p-5 flex items-center justify-center bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen p-5 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-3xl text-gray-400"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">资源不存在</h1>
          <p className="text-gray-500 mb-6">该资源可能已被删除或不存在</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span>返回首页</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg shadow-indigo-500/10 overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${getTypeColor(resource.type)}`}></div>
          
          <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getTypeColor(resource.type)} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                <i className={`fas ${getTypeIcon(resource.type)} text-2xl`}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 text-xs font-medium text-white rounded-full bg-gradient-to-r ${getTypeColor(resource.type)}`}>
                    {getTypeLabel(resource.type)}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                    {getStageLabel(resource.stage)}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{resource.title}</h1>
                <p className="text-gray-600 leading-relaxed">{resource.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {resource.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs text-indigo-600 bg-indigo-50 rounded-full border border-indigo-100"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 py-4 border-t border-b border-gray-100 mb-6">
              <div className="flex items-center gap-2 text-gray-500">
                <i className="fas fa-eye"></i>
                <span className="text-sm">{resource.clicks.toLocaleString()} 次浏览</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <i className="fas fa-thumbs-up"></i>
                <span className="text-sm">{resource.likes.toLocaleString()} 人点赞</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                    <i className="fas fa-lightbulb text-sm"></i>
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">AI 详细解读</h2>
                  {isFromCache && !isLoadingDetail && (
                    <span className="px-2 py-0.5 text-xs text-green-600 bg-green-50 rounded-full border border-green-100">
                      已缓存
                    </span>
                  )}
                </div>
                {detail && !isLoadingDetail && !error && (
                  <button
                    onClick={handleRefresh}
                    disabled={isLoadingDetail}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 hover:text-indigo-800 transition-all disabled:opacity-50"
                    title="重新生成详情"
                  >
                    <i className="fas fa-sync-alt"></i>
                    刷新
                  </button>
                )}
              </div>

              {isLoadingDetail ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-gray-700 font-medium mb-1">AI 正在为您生成详细解读...</p>
                    <p className="text-gray-400 text-sm">请稍候，这可能需要几秒钟</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                    <i className="fas fa-exclamation-circle text-2xl text-red-400"></i>
                  </div>
                  <p className="text-red-500 font-medium mb-2">{error}</p>
                  <p className="text-gray-400 text-sm mb-4">请检查网络连接后重试</p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
                  >
                    <i className="fas fa-redo"></i>
                    重试
                  </button>
                </div>
              ) : detail ? (
                <div className="prose prose-indigo max-w-none text-gray-600">
                  <ReactMarkdown>{detail}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
