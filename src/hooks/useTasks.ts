'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, Priority, TaskType, FilterType } from '@/types';
import { getTasks, saveTasks } from '@/utils/helpers';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTasks(getTasks());
  }, []);

  useEffect(() => {
    if (isClient) {
      saveTasks(tasks);
    }
  }, [tasks, isClient]);

  const addTask = useCallback((text: string, priority: Priority, taskType: TaskType) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      priority,
      taskType,
      completed: false,
      createdAt: new Date().toISOString(),
      timerDuration: 25 * 60,
      timerRemaining: 25 * 60,
      timerActive: false,
      timerLastStart: null
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const addMultipleTasks = useCallback((taskList: { text: string; priority: Priority; taskType: TaskType }[]) => {
    const now = Date.now();
    const newTasks: Task[] = taskList.map((item, index) => ({
      id: (now + index).toString(),
      text: item.text,
      priority: item.priority,
      taskType: item.taskType,
      completed: false,
      createdAt: new Date().toISOString(),
      timerDuration: 25 * 60,
      timerRemaining: 25 * 60,
      timerActive: false,
      timerLastStart: null
    }));
    setTasks(prev => [...prev, ...newTasks]);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const toggleTaskCompletion = useCallback((id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
          timerActive: task.completed ? task.timerActive : false,
          timerLastStart: task.completed ? task.timerLastStart : null
        };
      }
      return task;
    }));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        return { ...task, ...updates };
      }
      return task;
    }));
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setTasks(prev => prev.filter(task => !task.completed));
  }, []);

  const reorderTasks = useCallback((prioritizedIds: string[]) => {
    setTasks(prev => {
      const taskMap = new Map(prev.map(task => [task.id, task]));
      const reorderedTasks: Task[] = [];
      const remainingTasks: Task[] = [];
      
      prioritizedIds.forEach(id => {
        const task = taskMap.get(id);
        if (task) {
          reorderedTasks.push(task);
          taskMap.delete(id);
        }
      });
      
      taskMap.forEach(task => {
        remainingTasks.push(task);
      });
      
      return [...reorderedTasks, ...remainingTasks];
    });
  }, []);

  const filteredTasks = tasks.filter(task => {
    switch (currentFilter) {
      case 'active':
        return !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
    todayAdded: tasks.filter(t => {
      const today = new Date().toDateString();
      return new Date(t.createdAt).toDateString() === today;
    }).length,
    completionRate: tasks.length > 0 
      ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
      : 0
  };

  return {
    tasks,
    filteredTasks,
    currentFilter,
    setCurrentFilter,
    addTask,
    addMultipleTasks,
    deleteTask,
    toggleTaskCompletion,
    updateTask,
    clearCompletedTasks,
    reorderTasks,
    taskStats,
    isClient
  };
}

export function useTimer(
  tasks: Task[],
  updateTask: (id: string, updates: Partial<Task>) => void
) {
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  useEffect(() => {
    const activeTask = tasks.find(t => t.timerActive);
    if (activeTask) {
      setActiveTimerId(activeTask.id);
    }
  }, [tasks]);

  useEffect(() => {
    if (!activeTimerId) return;

    const interval = setInterval(() => {
      const task = tasks.find(t => t.id === activeTimerId);
      if (!task || !task.timerActive) {
        setActiveTimerId(null);
        return;
      }

      if (task.timerRemaining > 0) {
        updateTask(activeTimerId, { timerRemaining: task.timerRemaining - 1 });
      } else {
        updateTask(activeTimerId, {
          timerActive: false,
          timerLastStart: null
        });
        setActiveTimerId(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerId, tasks, updateTask]);

  const toggleTimer = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.timerActive) {
      updateTask(taskId, {
        timerActive: false,
        timerLastStart: null
      });
      setActiveTimerId(null);
    } else {
      tasks.forEach(t => {
        if (t.id !== taskId && t.timerActive) {
          updateTask(t.id, {
            timerActive: false,
            timerLastStart: null
          });
        }
      });

      updateTask(taskId, {
        timerActive: true,
        timerLastStart: Date.now(),
        completed: false,
        timerRemaining: task.timerRemaining <= 0 ? 25 * 60 : task.timerRemaining
      });
      setActiveTimerId(taskId);
    }
  }, [tasks, updateTask]);

  const setTimerDuration = useCallback((taskId: string, minutes: number) => {
    updateTask(taskId, {
      timerDuration: minutes * 60,
      timerRemaining: minutes * 60
    });
  }, [updateTask]);

  const setTimerDurationAndStart = useCallback((taskId: string, minutes: number) => {
    tasks.forEach(t => {
      if (t.id !== taskId && t.timerActive) {
        updateTask(t.id, {
          timerActive: false,
          timerLastStart: null
        });
      }
    });

    updateTask(taskId, {
      timerDuration: minutes * 60,
      timerRemaining: minutes * 60,
      timerActive: true,
      timerLastStart: Date.now(),
      completed: false
    });
    setActiveTimerId(taskId);
  }, [tasks, updateTask]);

  return {
    toggleTimer,
    setTimerDuration,
    setTimerDurationAndStart,
    activeTimerId
  };
}
