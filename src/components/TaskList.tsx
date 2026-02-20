'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, FilterType } from '@/types';
import { TaskItem } from './TaskInput';

interface TaskListProps {
  tasks: Task[];
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleTimer: (id: string) => void;
  taskStats: { active: number; total: number };
  onClearCompleted: () => void;
  onReorderTasks?: (prioritizedIds: string[]) => void;
}

export default function TaskList({
  tasks,
  currentFilter,
  onFilterChange,
  onToggle,
  onDelete,
  onEdit,
  onToggleTimer,
  taskStats,
  onClearCompleted,
  onReorderTasks
}: TaskListProps) {
  const router = useRouter();
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [prioritizeError, setPrioritizeError] = useState<string | null>(null);
  const [lastReasoning, setLastReasoning] = useState<string | null>(null);

  const handleAIPrioritize = async () => {
    if (isPrioritizing || tasks.length === 0) return;

    setIsPrioritizing(true);
    setPrioritizeError(null);
    setLastReasoning(null);

    try {
      const response = await fetch('/api/ai/prioritize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: tasks.map(task => ({
            id: task.id,
            title: task.text,
            dueDate: task.createdAt,
            type: task.taskType || 'other'
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 排序失败');
      }

      const data = await response.json();
      
      if (data.prioritizedIds && data.prioritizedIds.length > 0) {
        if (onReorderTasks) {
          onReorderTasks(data.prioritizedIds);
        }
        if (data.reasoning) {
          setLastReasoning(data.reasoning);
          setTimeout(() => setLastReasoning(null), 5000);
        }
      } else {
        throw new Error('未能获取有效的排序结果');
      }
    } catch (error) {
      console.error('AI prioritize error:', error);
      setPrioritizeError(error instanceof Error ? error.message : 'AI 排序失败，请稍后重试');
      setTimeout(() => setPrioritizeError(null), 3000);
    } finally {
      setIsPrioritizing(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-indigo-100/50 rounded-2xl shadow-xl shadow-indigo-500/5 overflow-hidden">
      <div className="p-5 border-b border-indigo-100/50 bg-gradient-to-r from-white to-indigo-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <i className="fas fa-list-check"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">任务列表</h2>
              <p className="text-xs text-gray-500">{taskStats.active} 个进行中 · {taskStats.total} 个总任务</p>
            </div>
          </div>
          
          <button
            onClick={handleAIPrioritize}
            disabled={isPrioritizing || tasks.length === 0}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              isPrioritizing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : tasks.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5'
            }`}
            title="AI 智能排序任务优先级"
          >
            {isPrioritizing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>排序中...</span>
              </>
            ) : (
              <>
                <i className="fas fa-wand-magic-sparkles"></i>
                <span>AI 排序</span>
              </>
            )}
          </button>
        </div>
        
        {lastReasoning && (
          <div className="mt-4 p-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-xl text-sm text-violet-700 flex items-center gap-2 animate-fadeIn">
            <i className="fas fa-lightbulb text-amber-500"></i>
            <span>{lastReasoning}</span>
          </div>
        )}
        
        {prioritizeError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2 animate-fadeIn">
            <i className="fas fa-exclamation-circle"></i>
            <span>{prioritizeError}</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex gap-2 mb-5">
          {(['all', 'active', 'completed'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentFilter === filter 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              {filter === 'all' && (
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-layer-group text-xs"></i>
                  全部
                </span>
              )}
              {filter === 'active' && (
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-clock text-xs"></i>
                  进行中
                </span>
              )}
              {filter === 'completed' && (
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-check-double text-xs"></i>
                  已完成
                </span>
              )}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {tasks.length === 0 ? (
            <li className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <i className="fas fa-inbox text-2xl text-indigo-400"></i>
              </div>
              <p className="text-gray-500 font-medium">暂无任务</p>
              <p className="text-xs text-gray-400 mt-1">创建你的第一个任务开始吧</p>
            </li>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TaskItem
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onToggleTimer={onToggleTimer}
                  onNavigate={(taskId) => router.push(`/task/${taskId}`)}
                />
              </div>
            ))
          )}
        </ul>

        <div className="flex justify-between items-center pt-5 mt-5 border-t border-indigo-100/50">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>{taskStats.active} 个活跃任务</span>
          </div>
          <button
            onClick={onClearCompleted}
            className="px-4 py-2 bg-red-50 text-red-500 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <i className="fas fa-trash-alt"></i>
            <span>清除已完成</span>
          </button>
        </div>
      </div>
    </div>
  );
}
