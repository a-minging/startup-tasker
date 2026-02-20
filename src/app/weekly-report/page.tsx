'use client';

import { useState, useEffect } from 'react';
import { Task, TaskType } from '@/types';
import { getTasks } from '@/utils/helpers';

interface TaskInput {
  title: string;
  completedAt: string;
  type: TaskType;
}

function renderMarkdown(markdown: string): string {
  let html = markdown;
  
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-gray-800 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-gray-800 mt-6 mb-3 pb-2 border-b border-indigo-100">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-800 mb-4">$1</h1>');
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 text-sm text-gray-600 leading-relaxed">$1</li>');
  
  html = html.replace(/^---$/gim, '<hr class="my-4 border-t border-indigo-100" />');
  
  html = html.replace(/\n\n/g, '</p><p class="mb-3 text-sm text-gray-600 leading-relaxed">');
  
  html = `<div class="prose prose-sm max-w-none"><p class="mb-3 text-sm text-gray-600 leading-relaxed">${html}</p></div>`;
  
  return html;
}

export default function WeeklyReportPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('创业团队');
  const [report, setReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTasks(getTasks());
  }, []);

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

  if (!isClient) {
    return (
      <div className="min-h-screen p-5 flex items-center justify-center">
        <div className="text-indigo-500">
          <i className="fas fa-spinner fa-spin text-4xl"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-xl border border-indigo-100/50 rounded-2xl shadow-xl shadow-indigo-500/5 overflow-hidden">
          <div className="p-5 border-b border-indigo-100/50 bg-gradient-to-r from-white to-indigo-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <i className="fas fa-file-alt"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">周报生成</h1>
                <p className="text-xs text-gray-500">AI 自动生成专业创业团队周报</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 font-medium text-gray-700 text-sm">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-medium text-gray-700 text-sm">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={setThisWeek}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-sm font-medium hover:bg-indigo-100 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <i className="fas fa-calendar-week text-xs"></i>
                本周
              </button>
              <button
                onClick={setLastWeek}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-sm font-medium hover:bg-indigo-100 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <i className="fas fa-calendar-minus text-xs"></i>
                上周
              </button>
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-gray-700 text-sm">团队名称</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="输入团队名称"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
              />
            </div>

            <div className="p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-violet-700">
                <i className="fas fa-info-circle"></i>
                <span>
                  已选择时间范围内有 <strong className="text-violet-900">{completedTasksCount}</strong> 项已完成任务
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                isGenerating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5'
              }`}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-wand-magic-sparkles"></i>
                  <span>生成周报</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2 animate-fadeIn">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            {report && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-file-lines text-indigo-500"></i>
                    生成的周报
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyReport}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-sm font-medium hover:bg-indigo-100 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-copy"></i> 复制
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-sm font-medium hover:bg-indigo-100 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-download"></i> 下载
                    </button>
                  </div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-100 rounded-xl max-h-[500px] overflow-y-auto">
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
