'use client';

import { useState } from 'react';
import { Task, TaskType } from '@/types';
import { checkAndIncrement } from '@/lib/usageLimit';
import UpgradeModal from './UpgradeModal';

interface WeeklyReportProps {
  tasks: Task[];
}

interface TaskInput {
  title: string;
  completedAt: string;
  type: TaskType;
}

export default function WeeklyReport({ tasks }: WeeklyReportProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('创业团队');
  const [report, setReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  const setThisWeek = () => {
    const { start, end } = getWeekRange();
    setStartDate(start);
    setEndDate(end);
  };

  const setLastWeek = () => {
    const { start, end } = getWeekRange();
    const lastWeekStart = new Date(start);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(end);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    
    setStartDate(lastWeekStart.toISOString().split('T')[0]);
    setEndDate(lastWeekEnd.toISOString().split('T')[0]);
  };

  const getCompletedTasksInRange = (): TaskInput[] => {
    const completedTasks = tasks.filter(task => {
      if (!task.completed || !task.createdAt) return false;
      
      const taskDate = new Date(task.createdAt);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      
      return taskDate >= start && taskDate <= end;
    });

    return completedTasks.map(task => ({
      title: task.text,
      completedAt: task.createdAt,
      type: task.taskType || 'other'
    }));
  };

  const handleGenerateReport = async () => {
    if (!checkAndIncrement('weeklyReport')) {
      setShowUpgradePrompt(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setReport('');

    try {
      const completedTasks = getCompletedTasksInRange();
      
      const response = await fetch('/api/ai/weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: completedTasks,
          startDate,
          endDate,
          teamName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成周报失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        result += decoder.decode(value, { stream: true });
        setReport(result);
      }

    } catch (err) {
      console.error('Generate report error:', err);
      setError(err instanceof Error ? err.message : '生成周报失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = async () => {
    if (!report) return;
    
    try {
      await navigator.clipboard.writeText(report);
      alert('周报已复制到剪贴板');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `周报_${startDate || '未知'}_${endDate || '未知'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completedTasksCount = getCompletedTasksInRange().length;

  return (
    <div className="bg-white/90 backdrop-blur-lg border border-monet-primary/20 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-5 border-b border-monet-primary/10 bg-white/50">
        <h2 className="text-xl font-bold text-monet-shadow flex items-center gap-2">
          周报生成 <i className="fas fa-file-alt text-monet-primary"></i>
        </h2>
        <p className="text-monet-primary text-sm mt-1">AI 自动生成专业周报</p>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 font-medium text-monet-shadow text-sm">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-monet-primary/30 rounded-lg text-sm focus:outline-none focus:border-monet-primary focus:ring-2 focus:ring-monet-primary/20"
            />
          </div>
          <div>
            <label className="block mb-1.5 font-medium text-monet-shadow text-sm">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-monet-primary/30 rounded-lg text-sm focus:outline-none focus:border-monet-primary focus:ring-2 focus:ring-monet-primary/20"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={setThisWeek}
            className="px-3 py-1.5 bg-monet-primary/10 text-monet-primary border border-monet-primary/30 rounded-lg text-xs font-medium hover:bg-monet-primary/20 transition-all"
          >
            本周
          </button>
          <button
            onClick={setLastWeek}
            className="px-3 py-1.5 bg-monet-primary/10 text-monet-primary border border-monet-primary/30 rounded-lg text-xs font-medium hover:bg-monet-primary/20 transition-all"
          >
            上周
          </button>
        </div>

        <div>
          <label className="block mb-1.5 font-medium text-monet-shadow text-sm">团队名称</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="输入团队名称"
            className="w-full px-3 py-2.5 border border-monet-primary/30 rounded-lg text-sm focus:outline-none focus:border-monet-primary focus:ring-2 focus:ring-monet-primary/20"
          />
        </div>

        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-purple-700">
            <i className="fas fa-info-circle"></i>
            <span>
              已选择时间范围内有 <strong>{completedTasksCount}</strong> 项已完成任务
            </span>
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={isGenerating || completedTasksCount === 0}
          className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            isGenerating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : completedTasksCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          {isGenerating ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>生成中...</span>
            </>
          ) : (
            <>
              <i className="fas fa-magic"></i>
              <span>生成周报</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-monet-highlight/10 border border-monet-highlight/20 rounded-lg text-sm text-monet-highlight flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {report && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-monet-shadow">生成的周报</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 bg-monet-primary/10 text-monet-primary border border-monet-primary/30 rounded-lg text-xs font-medium hover:bg-monet-primary/20 transition-all flex items-center gap-1"
                >
                  <i className="fas fa-copy"></i> 复制
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="px-3 py-1.5 bg-monet-primary/10 text-monet-primary border border-monet-primary/30 rounded-lg text-xs font-medium hover:bg-monet-primary/20 transition-all flex items-center gap-1"
                >
                  <i className="fas fa-download"></i> 下载
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {report}
              </pre>
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="weeklyReport"
      />
    </div>
  );
}
