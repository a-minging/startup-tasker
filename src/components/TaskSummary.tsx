'use client';

interface TaskSummaryProps {
  stats: {
    total: number;
    completionRate: number;
    highPriority: number;
    todayAdded: number;
  };
}

export default function TaskSummary({ stats }: TaskSummaryProps) {
  const summaryItems = [
    {
      icon: 'fa-tasks',
      label: '总数',
      value: stats.total,
      iconBg: 'from-monet-primary to-monet-cool'
    },
    {
      icon: 'fa-check-circle',
      label: '完成率',
      value: `${stats.completionRate}%`,
      iconBg: 'from-emerald-500 to-emerald-400'
    },
    {
      icon: 'fa-flag',
      label: '高优先',
      value: stats.highPriority,
      iconBg: 'from-monet-highlight to-red-400'
    },
    {
      icon: 'fa-clock',
      label: '日新增',
      value: stats.todayAdded,
      iconBg: 'from-amber-500 to-amber-400'
    }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-lg border border-monet-primary/20 rounded-2xl shadow-lg overflow-hidden p-5">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-monet-shadow flex items-center justify-center gap-2">
          任务总结 <i className="fas fa-chart-pie text-monet-primary"></i>
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-lg p-3 shadow-sm text-center hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${item.iconBg} flex items-center justify-center text-white text-lg`}>
              <i className={`fas ${item.icon}`}></i>
            </div>
            <h3 className="text-xs text-monet-primary mb-1">{item.label}</h3>
            <span className="text-xl font-bold text-monet-shadow">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
