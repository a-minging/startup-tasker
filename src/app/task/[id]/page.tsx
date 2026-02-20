'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task, TaskType } from '@/types';
import ResourceRecommendations from '@/components/ResourceRecommendations';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTask = () => {
      try {
        const stored = localStorage.getItem('tasks');
        if (stored) {
          const tasks: Task[] = JSON.parse(stored);
          const foundTask = tasks.find(t => t.id === taskId);
          setTask(foundTask || null);
        }
      } catch (error) {
        console.error('Failed to load task:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const getTaskTypeLabel = (type: TaskType): string => {
    const labels: Record<TaskType, string> = {
      product: '产品',
      market: '市场',
      finance: '融资',
      team: '团队',
      other: '其他',
    };
    return labels[type] || '其他';
  };

  const getTaskTypeColor = (type: TaskType): string => {
    const colors: Record<TaskType, string> = {
      product: 'from-blue-500 to-cyan-500',
      market: 'from-green-500 to-emerald-500',
      finance: 'from-amber-500 to-orange-500',
      team: 'from-purple-500 to-pink-500',
      other: 'from-gray-500 to-slate-500',
    };
    return colors[type] || 'from-gray-500 to-slate-500';
  };

  const getPriorityBadge = (priority: string): { label: string; className: string } => {
    const config: Record<string, { label: string; className: string }> = {
      high: { label: '高优先级', className: 'bg-red-100 text-red-700' },
      medium: { label: '中优先级', className: 'bg-amber-100 text-amber-700' },
      low: { label: '低优先级', className: 'bg-green-100 text-green-700' },
    };
    return config[priority] || config.medium;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-5 flex items-center justify-center">
        <div className="text-indigo-500">
          <i className="fas fa-spinner fa-spin text-4xl"></i>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen p-5 flex flex-col items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-xl font-bold text-gray-800 mb-2">任务不存在</h2>
          <p className="text-gray-500 mb-6">该任务可能已被删除或不存在</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-500/40 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const priorityBadge = getPriorityBadge(task.priority);

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <button
          onClick={() => router.push('/')}
          className="self-start flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span>返回任务列表</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg shadow-indigo-500/10 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTaskTypeColor(task.taskType)} flex items-center justify-center text-white shadow-lg`}>
                  <i className={`fas ${task.completed ? 'fa-check' : 'fa-clock'}`}></i>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {task.text}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getTaskTypeColor(task.taskType)} text-white`}>
                      {getTaskTypeLabel(task.taskType)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${priorityBadge.className}`}>
                      {priorityBadge.label}
                    </span>
                    {task.completed && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        已完成
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {formatTime(task.timerDuration)}
              </div>
              <div className="text-xs text-gray-500 mt-1">计划时长</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTime((task.timerDuration - task.timerRemaining) || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">已专注</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {task.timerActive ? '进行中' : task.completed ? '已完成' : '待开始'}
              </div>
              <div className="text-xs text-gray-500 mt-1">状态</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Date(task.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs text-gray-500 mt-1">创建日期</div>
            </div>
          </div>

          {task.aiSuggestions && task.aiSuggestions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i className="fas fa-lightbulb text-amber-500"></i>
                AI 建议
              </h3>
              <ul className="space-y-2">
                {task.aiSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                    <span>{suggestion.title}</span>
                    {suggestion.url && (
                      <a
                        href={suggestion.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        <i className="fas fa-external-link-alt text-xs"></i>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ResourceRecommendations
          taskTitle={task.text}
          taskType={task.taskType}
        />
      </div>
    </div>
  );
}
