'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, Priority, TaskType } from '@/types';
import { formatTime, getTaskTypeLabel, getPriorityLabel } from '@/utils/helpers';
import { checkAndIncrement } from '@/lib/usageLimit';
import UpgradeModal from './UpgradeModal';

interface TaskInputProps {
  onAddTask: (text: string, priority: Priority, taskType: TaskType) => void;
  onAddMultipleTasks?: (tasks: { text: string; priority: Priority; taskType: TaskType }[]) => void;
}

export default function TaskInput({ onAddTask, onAddMultipleTasks }: TaskInputProps) {
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [decomposeError, setDecomposeError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('taskText') as string;
    const priority = formData.get('priority') as Priority;
    const taskType = formData.get('taskType') as TaskType;

    if (text?.trim()) {
      onAddTask(text.trim(), priority || 'medium', taskType || 'product');
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleAIDecompose = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form) return;

    const formData = new FormData(form);
    const taskTitle = formData.get('taskText') as string;
    const priority = formData.get('priority') as Priority;
    const taskType = formData.get('taskType') as TaskType;

    if (!taskTitle?.trim()) {
      setDecomposeError('请先输入任务标题');
      return;
    }

    if (!checkAndIncrement('decompose')) {
      setShowUpgradePrompt(true);
      return;
    }

    setIsDecomposing(true);
    setDecomposeError(null);

    try {
      const response = await fetch('/api/ai/decompose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskTitle: taskTitle.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 拆解失败');
      }

      const data = await response.json();
      
      if (data.subtasks && data.subtasks.length > 0) {
        if (onAddMultipleTasks) {
          onAddMultipleTasks(
            data.subtasks.map((text: string) => ({
              text,
              priority: priority || 'medium',
              taskType: taskType || 'product',
            }))
          );
        } else {
          data.subtasks.forEach((text: string) => {
            onAddTask(text, priority || 'medium', taskType || 'product');
          });
        }
        form.reset();
      } else {
        throw new Error('未能生成有效的子任务');
      }
    } catch (error) {
      console.error('AI decompose error:', error);
      setDecomposeError(error instanceof Error ? error.message : 'AI 拆解失败，请稍后重试');
    } finally {
      setIsDecomposing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="bg-white/80 backdrop-blur-xl border border-indigo-100/50 rounded-2xl shadow-xl shadow-indigo-500/5 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm">
              <i className="fas fa-plus"></i>
            </div>
            <h3 className="font-semibold text-gray-800">创建新任务</h3>
          </div>
          
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">任务内容</label>
              <input
                type="text"
                name="taskText"
                placeholder="输入任务内容..."
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">优先级</label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer"
              >
                <option value="high">🔴 高</option>
                <option value="medium">🟡 中</option>
                <option value="low">🟢 低</option>
              </select>
            </div>
            
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">任务类型</label>
              <select
                name="taskType"
                className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer"
              >
                <option value="product">💻 产品开发</option>
                <option value="market">📊 市场调研</option>
                <option value="finance">💰 融资准备</option>
                <option value="team">👥 团队管理</option>
                <option value="other">📌 其他</option>
              </select>
            </div>
            
            <div className="col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-plus text-xs"></i>
                <span>添加</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="px-5 py-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-t border-violet-100/50 flex items-center gap-3">
          <button
            type="button"
            onClick={handleAIDecompose}
            disabled={isDecomposing}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
              isDecomposing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5'
            }`}
          >
            {isDecomposing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>AI 拆解中...</span>
              </>
            ) : (
              <>
                <i className="fas fa-wand-magic-sparkles"></i>
                <span>AI 拆解</span>
              </>
            )}
          </button>
          
          {decomposeError && (
            <span className="text-sm text-red-500 flex items-center gap-1">
              <i className="fas fa-exclamation-circle"></i>
              {decomposeError}
            </span>
          )}
          
          <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
            <i className="fas fa-lightbulb text-amber-400"></i>
            输入任务后点击 AI 拆解，自动生成子任务
          </span>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="decompose"
      />
    </form>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleTimer: (id: string) => void;
  onNavigate?: (taskId: string) => void;
}

export function TaskItem({ task, onToggle, onDelete, onEdit, onToggleTimer, onNavigate }: TaskItemProps) {
  return (
    <li
      className={`group flex items-start gap-3 p-4 bg-white/80 backdrop-blur-sm border rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg border-l-4 ${
        task.priority === 'high' 
          ? 'border-l-red-500 border-red-100 hover:border-red-200' 
          : task.priority === 'medium' 
            ? 'border-l-amber-500 border-amber-100 hover:border-amber-200' 
            : 'border-l-emerald-500 border-emerald-100 hover:border-emerald-200'
      } ${task.completed ? 'opacity-60 bg-gray-50/50' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="w-5 h-5 border-2 border-gray-300 rounded-md cursor-pointer flex-shrink-0 mt-0.5 accent-indigo-500"
        />
        <div 
          className="flex-1 flex flex-col gap-2 min-w-0 cursor-pointer"
          onClick={() => onNavigate?.(task.id)}
        >
          <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
            {task.text}
          </span>
          <div className="flex gap-2 flex-wrap">
            <span className={`startup-badge ${
              task.priority === 'high' 
                ? 'startup-badge-high' 
                : task.priority === 'medium' 
                  ? 'startup-badge-medium' 
                  : 'startup-badge-low'
            }`}>
              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
              {getPriorityLabel(task.priority)}
            </span>
            <span className="startup-badge bg-indigo-50 text-indigo-600 border border-indigo-200">
              {getTaskTypeLabel(task.taskType)}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {task.completed ? (
            <span className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-600 rounded-lg flex items-center gap-1 border border-emerald-200">
              <i className="fas fa-check-circle"></i>
              <span>已完成</span>
            </span>
          ) : task.timerActive ? (
            <button
              onClick={() => onToggleTimer(task.id)}
              className="px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg flex items-center gap-1 shadow-md"
            >
              <i className="fas fa-pause-circle"></i>
              <span>专注中 {formatTime(task.timerRemaining)}</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleTimer(task.id)}
              className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-all border border-indigo-200"
            >
              <i className="fas fa-play-circle"></i>
              <span>开始专注</span>
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all"
          title="编辑"
        >
          <i className="fas fa-pen text-xs"></i>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all"
          title="删除"
        >
          <i className="fas fa-trash text-xs"></i>
        </button>
      </div>
    </li>
  );
}
