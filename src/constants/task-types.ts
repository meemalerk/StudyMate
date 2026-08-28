import { Ionicons } from '@expo/vector-icons';

import { TaskType } from '@/hooks/use-tasks';

export const TASK_TYPES: {
  type: TaskType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: 'task', label: 'Task', icon: 'checkbox-outline' },
  { type: 'assignment', label: 'Assignment', icon: 'document-text-outline' },
  { type: 'exam', label: 'Exam', icon: 'school-outline' },
];

export function taskTypeIcon(type: TaskType): keyof typeof Ionicons.glyphMap {
  return TASK_TYPES.find((entry) => entry.type === type)?.icon ?? 'checkbox-outline';
}

export function taskTypeLabel(type: TaskType): string {
  return TASK_TYPES.find((entry) => entry.type === type)?.label ?? 'Task';
}
