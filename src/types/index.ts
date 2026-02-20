export type Priority = 'high' | 'medium' | 'low';

export type TaskType = 'product' | 'market' | 'finance' | 'team' | 'other';

export interface AISuggestion {
  title: string;
  url?: string;
}

export interface Task {
  id: string;
  text: string;
  priority: Priority;
  taskType: TaskType;
  completed: boolean;
  createdAt: string;
  timerDuration: number;
  timerRemaining: number;
  timerActive: boolean;
  timerLastStart: number | null;
  aiSuggestions?: AISuggestion[];
}

export interface AIResource {
  id?: number;
  icon: string;
  title: string;
  description: string;
  link: string;
  tags?: string[];
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type FilterType = 'all' | 'active' | 'completed';
