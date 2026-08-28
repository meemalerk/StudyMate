import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TASK_TYPES, taskTypeIcon } from '@/constants/task-types';
import { CardShadow, Radius, Spacing, Theme } from '@/constants/theme';
import { useStudySessions } from '@/hooks/use-study-sessions';
import { useSubjects } from '@/hooks/use-subjects';
import { formatDueDate, TaskType, useTasks } from '@/hooks/use-tasks';
import { useTheme } from '@/hooks/use-theme';
import { formatHours, isSameDay, startOfWeek } from '@/utils/date';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MENU_ITEMS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/subjects' | '/timer' | '/calendar' | '/settings';
}[] = [
  { label: 'Subjects', icon: 'book-outline', href: '/subjects' },
  { label: 'Study Timer', icon: 'timer-outline', href: '/timer' },
  { label: 'Study Calendar', icon: 'calendar-outline', href: '/calendar' },
  { label: 'Settings', icon: 'settings-outline', href: '/settings' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const { subjects } = useSubjects();
  const {
    sessions,
    dailyGoalHours,
    setDailyGoalHours,
    weeklyGoalHours,
    setWeeklyGoalHours,
  } = useStudySessions();

  const [showMenu, setShowMenu] = useState(false);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('task');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [editingGoal, setEditingGoal] = useState<'daily' | 'weekly' | null>(null);
  const [goalInput, setGoalInput] = useState('');

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selected) {
      setDueDate(selected);
    }
  };

  const handleAddTask = () => {
    addTask({
      title: newTask,
      date: dueDate ? formatDueDate(dueDate) : undefined,
      dueDate: dueDate ?? undefined,
      type: newTaskType,
    });

    setNewTask('');
    setNewTaskType('task');
    setDueDate(null);
    setShowDatePicker(false);
    setShowAddTask(false);
  };

  const completedTasks = tasks.filter((task) => task.completed).length;

  const taskProgress =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  // Dashboard stats, derived from real session history and task data.
  const today = new Date();

  const todaysSessions = sessions.filter((session) => isSameDay(session.completedAt, today));
  const todaysMinutes = todaysSessions.reduce((sum, session) => sum + session.minutes, 0);

  const dailyProgressPercent =
    dailyGoalHours <= 0
      ? 0
      : Math.min(100, Math.round((todaysMinutes / 60 / dailyGoalHours) * 100));

  const weekStart = startOfWeek(today);
  const weeklyMinutes = sessions
    .filter((session) => session.completedAt >= weekStart)
    .reduce((sum, session) => sum + session.minutes, 0);
  const weeklyHours = weeklyMinutes / 60;
  const weeklyProgressPercent =
    weeklyGoalHours <= 0 ? 0 : Math.min(100, Math.round((weeklyHours / weeklyGoalHours) * 100));

  // Per-day breakdown for the current week, scaled against the daily goal so each day's
  // bar is visually comparable (e.g. "hit the daily goal" always reads as a full bar).
  const dailyBreakdown = WEEKDAY_LABELS.map((label, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);

    const minutes = sessions
      .filter((session) => isSameDay(session.completedAt, day))
      .reduce((sum, session) => sum + session.minutes, 0);

    const percentOfDailyGoal =
      dailyGoalHours <= 0 ? 0 : Math.min(100, Math.round((minutes / 60 / dailyGoalHours) * 100));

    return { label, isToday: isSameDay(day, today), minutes, percentOfDailyGoal };
  });

  const upcomingDeadlines = tasks
    .filter((task) => !task.completed && task.dueDate)
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
    .slice(0, 4);

  const openGoalEditor = (type: 'daily' | 'weekly') => {
    setGoalInput(String(type === 'daily' ? dailyGoalHours : weeklyGoalHours));
    setEditingGoal(type);
  };

  const saveGoal = () => {
    const parsed = parseFloat(goalInput);

    if (!Number.isNaN(parsed) && parsed > 0) {
      if (editingGoal === 'daily') {
        setDailyGoalHours(parsed);
      } else if (editingGoal === 'weekly') {
        setWeeklyGoalHours(parsed);
      }
    }

    setEditingGoal(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.six },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.title}>StudyMate</Text>
        </View>

        <View style={styles.menuWrap}>
          <Pressable
            style={({ pressed }) => [styles.profileBadge, pressed && styles.pressed]}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons name={showMenu ? 'close' : 'menu-outline'} size={22} color={theme.text} />
          </Pressable>

          {showMenu && (
            <View style={styles.dropdownMenu}>
              {MENU_ITEMS.map(({ label, icon, href }) => (
                <Pressable
                  key={href}
                  style={({ pressed }) => [styles.dropdownItem, pressed && styles.pressed]}
                  onPress={() => {
                    setShowMenu(false);
                    router.push(href);
                  }}
                >
                  <Ionicons name={icon} size={16} color={theme.tint} />
                  <Text style={styles.dropdownItemText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      <Text style={styles.subtitle}>Stay organised. Stay focused.</Text>

      {/* Dashboard stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statTile}>
          <Ionicons name="flame-outline" size={18} color={theme.tint} />
          <Text style={styles.statNumber}>{todaysSessions.length}</Text>
          <Text style={styles.statLabel}>Sessions today</Text>
        </View>

        <View style={styles.statTile}>
          <Ionicons name="time-outline" size={18} color={theme.tint} />
          <Text style={styles.statNumber}>{formatHours(todaysMinutes)}</Text>
          <Text style={styles.statLabel}>Studied today</Text>
        </View>

        <View style={styles.statTile}>
          <Ionicons name="checkmark-done-outline" size={18} color={theme.tint} />
          <Text style={styles.statNumber}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Sessions completed</Text>
        </View>

        <View style={styles.statTile}>
          <Ionicons name="book-outline" size={18} color={theme.tint} />
          <Text style={styles.statNumber}>{subjects.length}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
      </View>

      {/* Study Goals */}
      <Text style={styles.sectionTitle}>Study goals</Text>

      <View style={[styles.goalCard, styles.goalCardSpacing]}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Daily study goal</Text>

          {editingGoal !== 'daily' && (
            <Pressable hitSlop={8} onPress={() => openGoalEditor('daily')}>
              <Ionicons name="pencil-outline" size={15} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {editingGoal === 'daily' ? (
          <View style={styles.goalEditRow}>
            <TextInput
              style={styles.goalInput}
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Hours per day"
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />

            <Pressable
              style={({ pressed }) => [styles.goalSaveButton, pressed && styles.pressed]}
              onPress={saveGoal}
            >
              <Text style={styles.goalSaveText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.goalProgressText}>
              {formatHours(todaysMinutes)} of {dailyGoalHours}h today
            </Text>

            <View style={styles.goalBarBackground}>
              <View
                style={[
                  styles.goalBarFill,
                  { width: `${dailyProgressPercent > 0 ? Math.max(dailyProgressPercent, 4) : 0}%` },
                ]}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Weekly study goal</Text>

          {editingGoal !== 'weekly' && (
            <Pressable hitSlop={8} onPress={() => openGoalEditor('weekly')}>
              <Ionicons name="pencil-outline" size={15} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {editingGoal === 'weekly' ? (
          <View style={styles.goalEditRow}>
            <TextInput
              style={styles.goalInput}
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Hours per week"
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />

            <Pressable
              style={({ pressed }) => [styles.goalSaveButton, pressed && styles.pressed]}
              onPress={saveGoal}
            >
              <Text style={styles.goalSaveText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.goalProgressText}>
              {formatHours(weeklyMinutes)} of {weeklyGoalHours}h this week
            </Text>

            <View style={styles.goalBarBackground}>
              <View
                style={[
                  styles.goalBarFill,
                  { width: `${weeklyProgressPercent > 0 ? Math.max(weeklyProgressPercent, 4) : 0}%` },
                ]}
              />
            </View>

            <View style={styles.breakdownRow}>
              {dailyBreakdown.map((day) => (
                <View style={styles.breakdownColumn} key={day.label}>
                  <Text style={styles.breakdownHours}>
                    {day.minutes > 0 ? formatHours(day.minutes) : '–'}
                  </Text>

                  <View style={styles.breakdownBarTrack}>
                    <View
                      style={[
                        styles.breakdownBarFill,
                        {
                          height: `${
                            day.percentOfDailyGoal > 0 ? Math.max(day.percentOfDailyGoal, 6) : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.breakdownDayLabel,
                      day.isToday && styles.breakdownDayLabelToday,
                    ]}
                  >
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Upcoming Deadlines */}
      <Text style={styles.sectionTitle}>Upcoming deadlines</Text>

      {upcomingDeadlines.length === 0 ? (
        <View style={styles.smallEmptyCard}>
          <Ionicons name="calendar-clear-outline" size={22} color={theme.textSecondary} />
          <Text style={styles.smallEmptyText}>Nothing due soon.</Text>
        </View>
      ) : (
        <View style={styles.deadlinesCard}>
          {upcomingDeadlines.map((task, index) => (
            <Pressable
              key={task.id}
              style={[styles.deadlineRow, index > 0 && styles.deadlineRowDivider]}
              onPress={() => toggleTask(task.id)}
            >
              <View style={styles.checkbox}>
                {task.completed && <Ionicons name="checkmark" size={14} color="white" />}
              </View>

              <View style={styles.taskInfo}>
                <View style={styles.taskTitleRow}>
                  {task.type !== 'task' && (
                    <Ionicons name={taskTypeIcon(task.type)} size={13} color={theme.tint} />
                  )}
                  <Text style={styles.taskTitle}>{task.title}</Text>
                </View>

                <Text style={styles.taskDate}>
                  {task.subject ? `${task.subject} · ${task.date}` : task.date}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Task progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Today's progress</Text>

        <Text style={styles.progressNumber}>{taskProgress}%</Text>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${taskProgress}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {completedTasks} of {tasks.length} tasks completed
        </Text>
      </View>

      {/* Quick Access */}
      <Text style={styles.sectionTitle}>Quick access</Text>

      <View style={styles.quickRow}>
        <Pressable
          style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
          onPress={() => router.push('/subjects')}
        >
          <Ionicons name="book-outline" size={20} color={theme.tint} />

          <Text style={styles.quickTitle}>Subjects</Text>
          <Text style={styles.quickText}>View your subjects</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
          onPress={() => router.push('/timer')}
        >
          <Ionicons name="timer-outline" size={20} color={theme.tint} />

          <Text style={styles.quickTitle}>Study timer</Text>
          <Text style={styles.quickText}>Start a study session</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
          onPress={() => router.push('/calendar')}
        >
          <Ionicons name="calendar-outline" size={20} color={theme.tint} />

          <Text style={styles.quickTitle}>Calendar</Text>
          <Text style={styles.quickText}>Plan your sessions</Text>
        </Pressable>
      </View>

      {/* Tasks */}
      <View style={styles.taskHeader}>
        <Text style={styles.sectionTitle}>My tasks</Text>

        <Pressable
          style={({ pressed }) => [styles.smallAddButton, pressed && styles.pressed]}
          onPress={() => setShowAddTask(!showAddTask)}
        >
          <Ionicons name={showAddTask ? 'close' : 'add'} size={16} color={theme.tint} />
          <Text style={styles.smallAddButtonText}>{showAddTask ? 'Close' : 'Add'}</Text>
        </Pressable>
      </View>

      {/* Add Task */}
      {showAddTask && (
        <View style={styles.addTaskCard}>
          <Text style={styles.inputLabel}>Task name</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter task name"
            placeholderTextColor={theme.textSecondary}
            value={newTask}
            onChangeText={setNewTask}
          />

          <Text style={styles.inputLabel}>Type</Text>

          <View style={styles.typeChipRow}>
            {TASK_TYPES.map(({ type, label, icon }) => (
              <Pressable
                key={type}
                style={({ pressed }) => [
                  styles.typeChip,
                  newTaskType === type && styles.selectedTypeChip,
                  pressed && styles.pressed,
                ]}
                onPress={() => setNewTaskType(type)}
              >
                <Ionicons
                  name={icon}
                  size={14}
                  color={newTaskType === type ? 'white' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    newTaskType === type && styles.selectedTypeChipText,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Due date</Text>

          <Pressable
            style={({ pressed }) => [styles.dateField, pressed && styles.pressed]}
            onPress={() => setShowDatePicker(!showDatePicker)}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />

            <Text style={[styles.dateFieldText, !dueDate && styles.dateFieldPlaceholder]}>
              {dueDate ? formatDueDate(dueDate) : 'Select a due date'}
            </Text>

            {dueDate && (
              <Pressable
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  setDueDate(null);
                  setShowDatePicker(false);
                }}
              >
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </Pressable>

          {showDatePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={dueDate ?? new Date()}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                onChange={handleDateChange}
                accentColor={theme.tint}
              />

              {Platform.OS === 'ios' && (
                <Pressable
                  style={({ pressed }) => [styles.datePickerDone, pressed && styles.pressed]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={styles.formButtons}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={() => setShowAddTask(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
              onPress={handleAddTask}
            >
              <Text style={styles.saveText}>Add task</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={28} color={theme.textSecondary} />

          <Text style={styles.emptyTitle}>No tasks yet</Text>

          <Text style={styles.emptyText}>Add your first study task to get started.</Text>
        </View>
      ) : (
        tasks.map((task) => (
          <View style={styles.taskCard} key={task.id}>
            <Pressable style={styles.taskMain} onPress={() => toggleTask(task.id)}>
              <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                {task.completed && <Ionicons name="checkmark" size={14} color="white" />}
              </View>

              <View style={styles.taskInfo}>
                <View style={styles.taskTitleRow}>
                  {task.type !== 'task' && (
                    <Ionicons
                      name={taskTypeIcon(task.type)}
                      size={13}
                      color={task.completed ? theme.textSecondary : theme.tint}
                    />
                  )}

                  <Text style={[styles.taskTitle, task.completed && styles.completedTaskTitle]}>
                    {task.title}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.taskDate,
                    task.completed && { color: theme.success },
                  ]}
                >
                  {task.completed
                    ? 'Completed'
                    : task.subject
                      ? `${task.subject} · ${task.date}`
                      : task.date}
                </Text>
              </View>
            </Pressable>

            <Pressable
              hitSlop={8}
              style={({ pressed }) => pressed && styles.pressed}
              onPress={() => deleteTask(task.id)}
            >
              <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    content: {
      paddingHorizontal: 20,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    greeting: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },

    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginTop: 2,
      letterSpacing: -0.3,
    },

    menuWrap: {
      position: 'relative',
    },

    profileBadge: {
      width: 40,
      height: 40,
      borderRadius: Radius.pill,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },

    dropdownMenu: {
      position: 'absolute',
      top: 48,
      right: 0,
      minWidth: 190,
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      paddingVertical: 6,
      zIndex: 100,
      elevation: 8,
      ...CardShadow,
    },

    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 11,
      paddingHorizontal: 14,
    },

    dropdownItemText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },

    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      marginTop: 6,
      marginBottom: 20,
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },

    statTile: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      padding: 14,
      gap: 4,
      ...CardShadow,
    },

    statNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginTop: 2,
    },

    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },


    goalCard: {
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 20,
      ...CardShadow,
    },

    goalCardSpacing: {
      marginBottom: 10,
    },

    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },

    goalTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },

    goalProgressText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 10,
    },

    goalBarBackground: {
      height: 8,
      borderRadius: 10,
      backgroundColor: theme.background,
    },

    goalBarFill: {
      height: 8,
      borderRadius: 10,
      backgroundColor: theme.tint,
    },

    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 18,
    },

    breakdownColumn: {
      flex: 1,
      alignItems: 'center',
    },

    breakdownHours: {
      fontSize: 10,
      color: theme.textSecondary,
      marginBottom: 6,
    },

    breakdownBarTrack: {
      width: 10,
      height: 50,
      borderRadius: 5,
      backgroundColor: theme.background,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },

    breakdownBarFill: {
      width: '100%',
      borderRadius: 5,
      backgroundColor: theme.tint,
    },

    breakdownDayLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 6,
      fontWeight: '600',
    },

    breakdownDayLabelToday: {
      color: theme.tint,
    },

    goalEditRow: {
      flexDirection: 'row',
      gap: 8,
    },

    goalInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.small,
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      backgroundColor: theme.background,
      color: theme.text,
    },

    goalSaveButton: {
      backgroundColor: theme.tint,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: Radius.small,
      justifyContent: 'center',
    },

    goalSaveText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 13,
    },

    smallEmptyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 20,
    },

    smallEmptyText: {
      color: theme.textSecondary,
      fontSize: 13,
    },

    deadlinesCard: {
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      marginBottom: 20,
      overflow: 'hidden',
      ...CardShadow,
    },

    deadlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },

    deadlineRowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },

    progressCard: {
      backgroundColor: theme.tint,
      borderRadius: Radius.large,
      padding: 20,
      marginBottom: 28,
    },

    progressTitle: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 14,
      fontWeight: '600',
    },

    progressNumber: {
      color: 'white',
      fontSize: 34,
      fontWeight: '700',
      marginTop: 8,
    },

    progressBackground: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 10,
      marginTop: 14,
    },

    progressBar: {
      height: 6,
      backgroundColor: 'white',
      borderRadius: 10,
    },

    progressText: {
      color: 'rgba(255,255,255,0.8)',
      marginTop: 10,
      fontSize: 13,
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
    },

    quickRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
      marginBottom: 4,
    },

    quickCard: {
      flex: 1,
      backgroundColor: theme.card,
      padding: 14,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      gap: 8,
      ...CardShadow,
    },

    quickTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },

    quickText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: -4,
    },

    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 30,
      marginBottom: 14,
    },

    smallAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.tintSoft,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: Radius.small,
    },

    smallAddButtonText: {
      color: theme.tint,
      fontWeight: '600',
      fontSize: 13,
    },

    addTaskCard: {
      backgroundColor: theme.card,
      padding: 18,
      borderRadius: Radius.medium,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      ...CardShadow,
    },

    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 7,
    },

    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.small,
      padding: 12,
      fontSize: 16,
      marginBottom: 14,
      backgroundColor: theme.background,
      color: theme.text,
    },

    typeChipRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },

    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },

    selectedTypeChip: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },

    typeChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    selectedTypeChipText: {
      color: 'white',
    },

    dateField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.small,
      padding: 12,
      marginBottom: 14,
      backgroundColor: theme.background,
    },

    dateFieldText: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },

    dateFieldPlaceholder: {
      color: theme.textSecondary,
    },

    datePickerWrap: {
      backgroundColor: theme.background,
      borderRadius: Radius.small,
      marginBottom: 14,
      overflow: 'hidden',
    },

    datePickerDone: {
      alignSelf: 'flex-end',
      paddingVertical: 8,
      paddingHorizontal: 16,
    },

    datePickerDoneText: {
      color: theme.tint,
      fontWeight: '600',
      fontSize: 15,
    },

    formButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },

    cancelButton: {
      padding: 12,
    },

    cancelText: {
      color: theme.textSecondary,
      fontWeight: '600',
    },

    saveButton: {
      backgroundColor: theme.tint,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: Radius.small,
    },

    saveText: {
      color: 'white',
      fontWeight: '600',
    },

    taskCard: {
      backgroundColor: theme.card,
      padding: 15,
      borderRadius: Radius.medium,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      ...CardShadow,
    },

    taskMain: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    checkboxCompleted: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },

    taskInfo: {
      flex: 1,
    },

    taskTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    taskTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },

    completedTaskTitle: {
      textDecorationLine: 'line-through',
      color: theme.textSecondary,
    },

    taskDate: {
      color: theme.textSecondary,
      marginTop: 3,
      fontSize: 13,
    },

    emptyCard: {
      backgroundColor: theme.card,
      padding: 28,
      borderRadius: Radius.medium,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      gap: 10,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },

    emptyText: {
      color: theme.textSecondary,
      textAlign: 'center',
      fontSize: 13,
    },

    pressed: {
      opacity: 0.6,
    },
  });
}
