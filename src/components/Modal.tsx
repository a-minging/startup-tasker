'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Task, Priority, TaskType, AIResource } from '@/types';
import { getAIResources } from '@/utils/helpers';
import { checkAndIncrement } from '@/lib/usageLimit';
import { recordInteraction, getResourceInteraction, getUserId, getLikedTags } from '@/lib/interactions';
import UpgradeModal from './UpgradeModal';

interface EditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
}

interface APIResource {
  id: number;
  title: string;
  url: string;
  description: string;
  tags: string[];
}

export default function EditModal({ task, isOpen, onClose, onSave }: EditModalProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [taskType, setTaskType] = useState<TaskType>('product');
  const [aiResources, setAiResources] = useState<AIResource[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    if (task) {
      setText(task.text);
      setPriority(task.priority);
      setTaskType(task.taskType || 'other');
      setAiResources(getAIResources(task.taskType || 'other', task.priority));
    }
  }, [task]);

  useEffect(() => {
    if (task && !isLoadingAI) {
      setAiResources(getAIResources(taskType, priority));
    }
  }, [taskType, priority, task, isLoadingAI]);

  const handleSave = () => {
    if (task && text.trim()) {
      onSave(task.id, { text: text.trim(), priority, taskType });
      onClose();
    }
  };

  const handleAIRecommend = async () => {
    if (!task || isLoadingAI) return;

    if (!checkAndIncrement('recommend')) {
      setShowUpgradePrompt(true);
      return;
    }

    setIsLoadingAI(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskTitle: text.trim() || task.text,
          taskType: taskType,
          userId: getUserId(),
          likedTags: getLikedTags(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 推荐失败');
      }

      const data = await response.json();
      
      if (data.resources && data.resources.length > 0) {
        const formattedResources: AIResource[] = data.resources.map((r: APIResource) => ({
          id: r.id,
          icon: getResourceIcon(r.title),
          title: r.title,
          description: r.description,
          link: r.url,
          tags: r.tags,
        }));
        setAiResources(formattedResources);
      } else {
        throw new Error('未能获取有效的资源推荐');
      }
    } catch (error) {
      console.error('AI recommend error:', error);
      setAiError(error instanceof Error ? error.message : 'AI 推荐失败，请稍后重试');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getResourceIcon = (title: string): string => {
    const iconMap: Record<string, string> = {
      '模板': 'fa-file-alt',
      '工具': 'fa-tools',
      '指南': 'fa-book',
      '教程': 'fa-graduation-cap',
      '平台': 'fa-globe',
      '报告': 'fa-chart-bar',
      '课程': 'fa-play-circle',
      '分析': 'fa-search',
      '设计': 'fa-paint-brush',
      '管理': 'fa-tasks',
      '协作': 'fa-users',
      '数据': 'fa-database',
    };

    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (title.includes(keyword)) {
        return icon;
      }
    }

    return 'fa-lightbulb';
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-indigo-500/10 max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="flex justify-between items-center p-5 border-b border-indigo-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm">
              <i className="fas fa-pen"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800">编辑任务</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 hover:scale-110 transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block mb-1.5 font-medium text-gray-700 text-sm">任务内容</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
              placeholder="输入任务内容..."
            />
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-gray-700 text-sm">任务类型</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer"
            >
              <option value="product">💻 产品开发</option>
              <option value="market">📊 市场调研</option>
              <option value="finance">💰 融资准备</option>
              <option value="team">👥 团队管理</option>
              <option value="other">📌 其他</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-gray-700 text-sm">优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer"
            >
              <option value="high">🔴 高优先级</option>
              <option value="medium">🟡 中优先级</option>
              <option value="low">🟢 低优先级</option>
            </select>
          </div>

          <div className="pt-4 border-t border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                <i className="fas fa-robot"></i>
                <span>AI 推荐资源</span>
              </div>
              <button
                onClick={handleAIRecommend}
                disabled={isLoadingAI}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isLoadingAI
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5'
                }`}
              >
                {isLoadingAI ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>AI 推荐</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i>
                {aiError}
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {aiResources.map((resource, index) => {
                const resourceId = resource.id || index;
                const userAction = getResourceInteraction(resourceId);
                const resourceTags = resource.tags || [];
                
                return (
                  <div
                    key={index}
                    className="flex gap-3 p-3 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-100 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      <i className={`fas ${resource.icon} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm">{resource.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{resource.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Link
                          href={`/resource/${resourceId}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 hover:text-indigo-800 transition-all"
                        >
                          <i className="fas fa-arrow-right text-[0.65rem]"></i>
                          查看详情
                        </Link>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => recordInteraction(resourceId, 'like', resourceTags)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                              userAction === 'like'
                                ? 'bg-green-100 text-green-600'
                                : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                            }`}
                            title="点赞"
                          >
                            <i className="fas fa-thumbs-up text-xs"></i>
                          </button>
                          <button
                            onClick={() => recordInteraction(resourceId, 'dislike', resourceTags)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                              userAction === 'dislike'
                                ? 'bg-red-100 text-red-600'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title="点踩"
                          >
                            <i className="fas fa-thumbs-down text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end p-5 border-t border-indigo-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 hover:-translate-y-0.5 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
          >
            保存
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="recommend"
      />
    </div>
  );
}

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}

export function TimerModal({ isOpen, onClose, onConfirm }: TimerModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');

  const presetOptions = [25, 15, 10, 5];

  const handleConfirm = () => {
    const minutes = customMinutes ? parseInt(customMinutes) : selectedMinutes;
    if (minutes >= 1 && minutes <= 120) {
      onConfirm(minutes);
      onClose();
      setCustomMinutes('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-indigo-500/10 animate-scaleIn">
        <div className="flex justify-between items-center p-5 border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm">
              <i className="fas fa-clock"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800">设置倒计时</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 hover:scale-110 transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">选择时长</label>
            <div className="grid grid-cols-4 gap-2">
              {presetOptions.map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setSelectedMinutes(mins);
                    setCustomMinutes('');
                  }}
                  className={`px-3 py-3 border-2 rounded-xl font-semibold transition-all ${
                    selectedMinutes === mins && !customMinutes
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25' 
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {mins}分钟
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-gray-700 text-sm">自定义时长（分钟）</label>
            <input
              type="number"
              min="1"
              max="120"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
              placeholder="输入自定义分钟数"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end p-5 border-t border-indigo-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 hover:-translate-y-0.5 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
