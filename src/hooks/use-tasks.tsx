import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { isSameDay } from '@/utils/date';
import { loadJSON, saveJSON } from '@/utils/storage';

const STORAGE_KEY = 'studymate.tasks';

/** Task as persisted to storage — `dueDate` is a Date at runtime but must round-trip as an
 * ISO string through JSON. */
type StoredTask = Omit<Task, 'dueDate'> & { dueDate?: string };

function reviveTask(stored: StoredTask): Task {
  return {
    ...stored,
    dueDate: stored.dueDate ? new Date(stored.dueDate) : undefined,
    // Tasks saved before `type` existed won't have it — default to 'task'.
    type: stored.type ?? 'task',
  };
}

export type TaskType = 'task' | 'assignment' | 'exam';

export type Task = {
  id: number;
  title: string;
  date: string;
  /** Real due-date value, when one was picked from the calendar. Powers sorting/filtering
   * (e.g. "upcoming deadlines") that a display string like "Due Friday" can't support. */
  dueDate?: Date;
  completed: boolean;
  /** Name of the subject this task belongs to, if any. Unset = general task. */
  subject?: string;
  /** Distinguishes assignments/exams from general tasks — used for reminder wording and icons. */
  type: TaskType;
};

type NewTaskInput = {
  title: string;
  date?: string;
  dueDate?: Date;
  subject?: string;
  type?: TaskType;
};

type TaskEdits = {
  title?: string;
  /** Pass an explicit string (including 'No due date') to change it; omit to leave untouched. */
  date?: string;
  /** Pass a Date to set it, null to clear it, or omit to leave untouched. */
  dueDate?: Date | null;
  type?: TaskType;
};

type TasksContextValue = {
  tasks: Task[];
  addTask: (input: NewTaskInput) => void;
  editTask: (id: number, edits: TaskEdits) => void;
  toggleTask: (id: number) => void;
  deleteTask: (id: number) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Complete AI Assignment',
    date: 'Due tomorrow',
    dueDate: tomorrow,
    completed: false,
    subject: 'Artificial Intelligence',
    type: 'assignment',
  },
  {
    id: 2,
    title: 'Study Cybersecurity',
    date: 'Due Friday',
    completed: false,
    subject: 'Cybersecurity',
    type: 'task',
  },
  {
    id: 3,
    title: 'Finish Project Report',
    date: 'Completed',
    completed: true,
    type: 'assignment',
  },
];

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [hydrated, setHydrated] = useState(false);

  // Load any previously saved tasks once on startup.
  useEffect(() => {
    (async () => {
      const stored = await loadJSON<StoredTask[]>(STORAGE_KEY);

      if (stored) {
        setTasks(stored.map(reviveTask));
      }

      setHydrated(true);
    })();
  }, []);

  // Persist on every change, but only after the initial load above has completed —
  // otherwise the default sample tasks would immediately overwrite what was saved.
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveJSON(STORAGE_KEY, tasks);
  }, [tasks, hydrated]);

  const addTask = ({ title, date, dueDate, subject, type }: NewTaskInput) => {
    if (title.trim() === '') {
      return;
    }

    setTasks((previous) => [
      ...previous,
      {
        id: Date.now(),
        title: title.trim(),
        date: date?.trim() || 'No due date',
        dueDate,
        completed: false,
        subject,
        type: type ?? 'task',
      },
    ]);
  };

  const editTask = (id: number, edits: TaskEdits) => {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== id) {
          return task;
        }

        const title =
          edits.title !== undefined && edits.title.trim() !== '' ? edits.title.trim() : task.title;
        const date = edits.date !== undefined ? edits.date : task.date;
        const dueDate = edits.dueDate !== undefined ? (edits.dueDate ?? undefined) : task.dueDate;
        const type = edits.type !== undefined ? edits.type : task.type;

        return { ...task, title, date, dueDate, type };
      })
    );
  };

  const toggleTask = (id: number) => {
    setTasks((previous) =>
      previous.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const deleteTask = (id: number) => {
    setTasks((previous) => previous.filter((task) => task.id !== id));
  };

  return (
    <TasksContext.Provider value={{ tasks, addTask, editTask, toggleTask, deleteTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);

  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }

  return context;
}

/** Formats a picked due date into the short label style used across the app
 * ("Due today", "Due tomorrow", or "Due Aug 25"). */
export function formatDueDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) {
    return 'Due today';
  }

  if (isSameDay(date, tomorrow)) {
    return 'Due tomorrow';
  }

  return `Due ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
