import { Task, TaskType, AIResource, Priority } from '@/types';

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  const tasks = localStorage.getItem('tasks');
  return tasks ? JSON.parse(tasks) : [];
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getTaskTypeLabel(taskType?: TaskType): string {
  const labels: Record<TaskType, string> = {
    product: '产品开发',
    market: '市场调研',
    finance: '融资准备',
    team: '团队管理',
    other: '其他'
  };
  return taskType ? labels[taskType] : '其他';
}

export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Priority, string> = {
    high: '⚡ 高',
    medium: '⚠️ 中',
    low: '✓ 低'
  };
  return labels[priority];
}

export function getAIResources(taskType: TaskType, _priority: Priority): AIResource[] {
  const resources: Record<TaskType, AIResource[]> = {
    product: [
      {
        icon: 'fa-code',
        title: '产品开发最佳实践',
        description: '了解敏捷开发流程和产品迭代策略',
        link: '#'
      },
      {
        icon: 'fa-users',
        title: '用户需求分析',
        description: '如何有效收集和分析用户反馈',
        link: '#'
      },
      {
        icon: 'fa-rocket',
        title: '产品发布清单',
        description: '完整的产品上线前检查清单',
        link: '#'
      }
    ],
    market: [
      {
        icon: 'fa-chart-line',
        title: '市场调研方法论',
        description: '系统性的市场分析框架和工具',
        link: '#'
      },
      {
        icon: 'fa-search',
        title: '竞品分析指南',
        description: '深入了解竞争对手的策略和优势',
        link: '#'
      },
      {
        icon: 'fa-bullhorn',
        title: '营销策略模板',
        description: '可复用的营销计划模板',
        link: '#'
      }
    ],
    finance: [
      {
        icon: 'fa-file-invoice-dollar',
        title: '商业计划书模板',
        description: '专业的融资演示文稿结构',
        link: '#'
      },
      {
        icon: 'fa-handshake',
        title: '投资人沟通技巧',
        description: '如何与投资人有效沟通项目价值',
        link: '#'
      },
      {
        icon: 'fa-calculator',
        title: '财务预测模型',
        description: '详细的财务预测和估值方法',
        link: '#'
      }
    ],
    team: [
      {
        icon: 'fa-user-tie',
        title: '团队管理工具',
        description: '高效的团队协作和管理方法',
        link: '#'
      },
      {
        icon: 'fa-comments',
        title: '沟通技巧培训',
        description: '提升团队内部沟通效率',
        link: '#'
      },
      {
        icon: 'fa-tasks',
        title: '目标设定框架',
        description: 'SMART 目标设定方法',
        link: '#'
      }
    ],
    other: [
      {
        icon: 'fa-lightbulb',
        title: '通用项目管理',
        description: '适用于各类任务的管理技巧',
        link: '#'
      },
      {
        icon: 'fa-clock',
        title: '时间管理方法',
        description: '提高个人效率的时间管理策略',
        link: '#'
      },
      {
        icon: 'fa-book',
        title: '学习资源库',
        description: '精选的在线学习平台和课程',
        link: '#'
      }
    ]
  };

  return resources[taskType] || resources.other;
}

export function playTimerEndSound(): void {
  if (typeof window === 'undefined') return;
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  audio.play().catch(e => console.log('播放音频失败:', e));
}

export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
