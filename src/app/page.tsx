'use client';

import { useState } from 'react';
import { Task, Priority, TaskType } from '@/types';
import { useTasks, useTimer } from '@/hooks/useTasks';
import TaskInput from '@/components/TaskInput';
import TaskList from '@/components/TaskList';
import Kanban from '@/components/Kanban';
import TaskSummary from '@/components/TaskSummary';
import EditModal, { TimerModal } from '@/components/Modal';

export default function Home() {
  const {
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
  } = useTasks();

  const { toggleTimer, setTimerDurationAndStart } = useTimer(tasks, updateTask);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);

  const handleAddTask = (text: string, priority: Priority, taskType: TaskType) => {
    addTask(text, priority, taskType);
  };

  const handleAddMultipleTasks = (taskList: { text: string; priority: Priority; taskType: TaskType }[]) => {
    addMultipleTasks(taskList);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleSaveTask = (id: string, updates: Partial<Task>) => {
    updateTask(id, updates);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteTask(id);
    }
  };

  const handleToggleTimer = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.timerActive && task.timerRemaining === 25 * 60) {
      setTimerTaskId(id);
      setIsTimerModalOpen(true);
    } else {
      toggleTimer(id);
    }
  };

  const handleConfirmTimer = (minutes: number) => {
    if (timerTaskId) {
      setTimerDurationAndStart(timerTaskId, minutes);
      setTimerTaskId(null);
    }
  };

  const handleClearCompleted = () => {
    if (confirm('确定要清除所有已完成的任务吗？')) {
      clearCompletedTasks();
    }
  };

  const handleReorderTasks = (prioritizedIds: string[]) => {
    reorderTasks(prioritizedIds);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen p-5 flex items-center justify-center">
        <div className="text-monet-primary">
          <i className="fas fa-spinner fa-spin text-4xl"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <TaskInput onAddTask={handleAddTask} onAddMultipleTasks={handleAddMultipleTasks} />
        
        <TaskList
          tasks={filteredTasks}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          onToggle={toggleTaskCompletion}
          onDelete={handleDeleteTask}
          onEdit={handleEditTask}
          onToggleTimer={handleToggleTimer}
          taskStats={taskStats}
          onClearCompleted={handleClearCompleted}
          onReorderTasks={handleReorderTasks}
        />

        <Kanban tasks={tasks} />

        <TaskSummary stats={taskStats} />
      </div>

      <EditModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      <TimerModal
        isOpen={isTimerModalOpen}
        onClose={() => {
          setIsTimerModalOpen(false);
          setTimerTaskId(null);
        }}
        onConfirm={handleConfirmTimer}
      />
    </div>
  );
}
