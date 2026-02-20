'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TaskType, AIResource } from '@/types';
import { getUserId, getLikedTags, recordInteraction, getResourceInteraction } from '@/lib/interactions';
import { checkAndIncrement } from '@/lib/usageLimit';
import UpgradeModal from './UpgradeModal';

interface ResourceRecommendationsProps {
  taskTitle: string;
  taskType: TaskType;
}

interface APIResource {
  id: number;
  title: string;
  url: string;
  description: string;
  tags: string[];
  similarity?: number;
}

export default function ResourceRecommendations({ taskTitle, taskType }: ResourceRecommendationsProps) {
  const [resources, setResources] = useState<AIResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shownResourceIds, setShownResourceIds] = useState<Set<number>>(new Set());
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const getResourceIcon = (title: string, tags: string[]): string => {
    const tagStr = tags.join(' ').toLowerCase();
    const titleLower = title.toLowerCase();
    
    if (tagStr.includes('模板') || titleLower.includes('模板')) return 'fa-file-alt';
    if (tagStr.includes('工具') || titleLower.includes('工具')) return 'fa-tools';
    if (tagStr.includes('课程') || titleLower.includes('课程')) return 'fa-play-circle';
    if (tagStr.includes('投资人') || tagStr.includes('融资')) return 'fa-hand-holding-usd';
    if (tagStr.includes('设计') || tagStr.includes('ui')) return 'fa-paint-brush';
    if (tagStr.includes('数据') || tagStr.includes('分析')) return 'fa-chart-bar';
    if (tagStr.includes('团队') || tagStr.includes('管理')) return 'fa-users';
    if (tagStr.includes('市场') || tagStr.includes('运营')) return 'fa-bullhorn';
    
    return 'fa-lightbulb';
  };

  const getResourceType = (tags: string[]): string => {
    const tagStr = tags.join(' ').toLowerCase();
    if (tagStr.includes('模板')) return '模板';
    if (tagStr.includes('工具')) return '工具';
    if (tagStr.includes('课程')) return '课程';
    if (tagStr.includes('投资人')) return '投资人';
    if (tagStr.includes('文章')) return '文章';
    return '资源';
  };

  const fetchRecommendations = useCallback(async (excludeIds: number[] = []) => {
    if (!taskTitle) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskTitle,
          taskType,
          userId: getUserId(),
          likedTags: getLikedTags(),
          excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取推荐失败');
      }

      const data = await response.json();

      if (data.resources && data.resources.length > 0) {
        const formattedResources: AIResource[] = data.resources.map((r: APIResource) => ({
          id: r.id,
          icon: getResourceIcon(r.title, r.tags),
          title: r.title,
          description: r.description,
          link: r.url,
          tags: r.tags,
        }));
        
        setResources(formattedResources);
        setShownResourceIds(prev => {
          const newSet = new Set(prev);
          formattedResources.forEach(r => {
            if (r.id) newSet.add(r.id);
          });
          return newSet;
        });
      } else {
        setResources([]);
        setError('暂无更多推荐资源');
      }
    } catch (err) {
      console.error('Fetch recommendations error:', err);
      setError(err instanceof Error ? err.message : '获取推荐失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [taskTitle, taskType]);

  const handleRefresh = () => {
    if (!checkAndIncrement('recommend')) {
      setShowUpgradePrompt(true);
      return;
    }
    fetchRecommendations(Array.from(shownResourceIds));
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-indigo-500/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <i className="fas fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">智能推荐</h3>
            <p className="text-xs text-gray-500">基于任务内容为您推荐相关资源</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>加载中...</span>
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt"></i>
              <span>换一批</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
          <i className="fas fa-info-circle"></i>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 h-32">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource, index) => {
            const resourceId = resource.id || index;
            const userAction = getResourceInteraction(resourceId);
            const resourceTags = resource.tags || [];
            const resourceType = getResourceType(resourceTags);

            return (
              <div
                key={resourceId}
                className="group relative bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-100 rounded-xl p-4 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 transition-all"
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                    <i className={`fas ${resource.icon} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">{resource.title}</h4>
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full flex-shrink-0">
                        {resourceType}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed mt-1 line-clamp-2">{resource.description}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/resource/${resourceId}`}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-all"
                        >
                          <i className="fas fa-arrow-right"></i>
                          查看详情
                        </Link>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => recordInteraction(resourceId, 'like', resourceTags)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            userAction === 'like'
                              ? 'bg-green-100 text-green-600'
                              : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                          }`}
                          title="点赞"
                        >
                          <i className="fas fa-thumbs-up text-sm"></i>
                        </button>
                        <button
                          onClick={() => recordInteraction(resourceId, 'dislike', resourceTags)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            userAction === 'dislike'
                              ? 'bg-red-100 text-red-600'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title="点踩"
                        >
                          <i className="fas fa-thumbs-down text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <i className="fas fa-folder-open text-4xl mb-3 text-gray-300"></i>
          <p>暂无推荐资源</p>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="recommend"
      />
    </div>
  );
}
