'use client';

import { Task, TaskStatus } from '@/types';
import { getTaskTypeLabel, getPriorityLabel } from '@/utils/helpers';

interface KanbanProps {
  tasks: Task[];
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
}

export default function Kanban({ tasks }: KanbanProps) {
  const columns: { status: TaskStatus; title: string; tasks: Task[] }[] = [
    {
      status: 'todo',
      title: '待办',
      tasks: tasks.filter(t => !t.completed && !t.timerActive)
    },
    {
      status: 'in-progress',
      title: '进行中',
      tasks: tasks.filter(t => !t.completed && t.timerActive)
    },
    {
      status: 'done',
      title: '已完成',
      tasks: tasks.filter(t => t.completed)
    }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-lg border border-monet-primary/20 rounded-2xl shadow-lg overflow-hidden p-5">
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-monet-shadow flex items-center justify-center gap-2">
          任务看板 <i className="fas fa-project-diagram text-monet-primary"></i>
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {columns.map(({ status, title, tasks: columnTasks }) => (
          <div
            key={status}
            className={`flex-1 min-h-[200px] rounded-2xl p-4 border border-white/25 backdrop-blur-lg relative overflow-hidden ${
              status === 'todo' 
                ? 'bg-gradient-to-br from-white/20 to-white/10' 
                : status === 'in-progress' 
                  ? 'bg-gradient-to-br from-monet-primary/15 to-monet-primary/5' 
                  : 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-monet-accent via-monet-cool to-monet-highlight opacity-60" />
            
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/20">
              <h3 className="font-semibold text-monet-shadow">{title}</h3>
              <span className="bg-monet-primary text-white px-2 py-0.5 rounded-full text-xs font-semibold min-w-[24px] text-center">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  className={`bg-white/95 backdrop-blur-sm border border-white/50 rounded-lg p-3 cursor-grab transition-all hover:-translate-y-0.5 hover:shadow-md border-l-3 ${
                    status === 'todo' 
                      ? 'border-l-monet-cool' 
                      : status === 'in-progress' 
                        ? 'border-l-monet-primary animate-pulse-custom' 
                        : 'border-l-monet-accent opacity-80'
                  }`}
                >
                  <div className="flex gap-2">
                    <div className={`w-1 h-5 rounded-sm flex-shrink-0 mt-0.5 ${
                      task.priority === 'high' 
                        ? 'bg-gradient-to-b from-monet-highlight/80 to-monet-highlight/50' 
                        : task.priority === 'medium' 
                          ? 'bg-gradient-to-b from-amber-500/80 to-amber-500/50' 
                          : 'bg-gradient-to-b from-emerald-500/80 to-emerald-500/50'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-monet-shadow break-words">{task.text}</div>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[0.65rem] font-semibold bg-gradient-to-br from-monet-primary/12 to-monet-primary/4 text-monet-primary border border-monet-primary/15">
                          {getTaskTypeLabel(task.taskType)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[0.65rem] font-semibold ${
                          task.priority === 'high' 
                            ? 'bg-gradient-to-br from-monet-highlight/10 to-monet-highlight/5 text-monet-highlight border border-monet-highlight/20' 
                            : task.priority === 'medium' 
                              ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-500 border border-amber-500/20' 
                              : 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </div>
                    {status === 'in-progress' && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-monet-primary/20 flex items-center justify-center">
                          <i className="fas fa-clock text-monet-primary text-xs"></i>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
