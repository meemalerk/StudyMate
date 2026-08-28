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
import { formatHours, startOfWeek } from '@/utils/date';

export default function SubjectsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { tasks, addTask, editTask, toggleTask, deleteTask } = useTasks();
  const { subjects, addSubject: addSubjectToStore, deleteSubject: deleteSubjectFromStore } = useSubjects();
  const { sessions, subjectGoals, setSubjectGoalHours, clearSubjectGoal } = useStudySessions();

  const [newSubject, setNewSubject] = useState('');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('task');
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);
  const [showTaskDatePicker, setShowTaskDatePicker] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<TaskType>('task');
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editDateChanged, setEditDateChanged] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const [editingGoalSubject, setEditingGoalSubject] = useState<string | null>(null);
  const [goalHoursInput, setGoalHoursInput] = useState('');

  const weekStart = startOfWeek(new Date());

  const weeklyMinutesForSubject = (subject: string) =>
    sessions
      .filter((session) => session.subject === subject && session.completedAt >= weekStart)
      .reduce((sum, session) => sum + session.minutes, 0);

  const openSubjectGoalEditor = (subject: string) => {
    setGoalHoursInput(subjectGoals[subject] ? String(subjectGoals[subject]) : '');
    setEditingGoalSubject(subject);
  };

  const saveSubjectGoal = (subject: string) => {
    const parsed = parseFloat(goalHoursInput);

    if (!Number.isNaN(parsed) && parsed > 0) {
      setSubjectGoalHours(subject, parsed);
    }

    setEditingGoalSubject(null);
  };

  const addSubject = () => {
    addSubjectToStore(newSubject);
    setNewSubject('');
  };

  const deleteSubject = (subject: string) => {
    deleteSubjectFromStore(subject);

    if (expandedSubject === subject) {
      setExpandedSubject(null);
    }
  };

  const resetTaskForm = () => {
    setNewTaskTitle('');
    setNewTaskType('task');
    setNewTaskDate(null);
    setShowTaskDatePicker(false);
  };

  const toggleExpanded = (subject: string) => {
    setExpandedSubject(expandedSubject === subject ? null : subject);
    resetTaskForm();
    setEditingTaskId(null);
    setShowEditDatePicker(false);
    setEditingGoalSubject(null);
  };

  const handleTaskDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTaskDatePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selected) {
      setNewTaskDate(selected);
    }
  };

  const addTaskToSubject = (subject: string) => {
    if (newTaskTitle.trim() === '') {
      return;
    }

    addTask({
      title: newTaskTitle,
      subject,
      date: newTaskDate ? formatDueDate(newTaskDate) : undefined,
      dueDate: newTaskDate ?? undefined,
      type: newTaskType,
    });

    resetTaskForm();
  };

  const startEditTask = (task: { id: number; title: string; type: TaskType }) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditType(task.type);
    setEditDate(null);
    setEditDateChanged(false);
    setShowEditDatePicker(false);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setShowEditDatePicker(false);
  };

  const handleEditDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowEditDatePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selected) {
      setEditDate(selected);
      setEditDateChanged(true);
    }
  };

  const saveEditTask = (id: number) => {
    if (editTitle.trim() === '') {
      return;
    }

    editTask(id, {
      title: editTitle,
      date: editDateChanged ? (editDate ? formatDueDate(editDate) : 'No due date') : undefined,
      dueDate: editDateChanged ? editDate : undefined,
      type: editType,
    });

    setEditingTaskId(null);
    setShowEditDatePicker(false);
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
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>

        <Text style={styles.title}>Subjects</Text>

        <View style={styles.headerSpace} />
      </View>

      <Text style={styles.subtitle}>Manage your study subjects</Text>

      {/* Add Subject */}
      <View style={styles.addCard}>
        <Text style={styles.inputLabel}>New subject</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter subject name"
          placeholderTextColor={theme.textSecondary}
          value={newSubject}
          onChangeText={setNewSubject}
        />

        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          onPress={addSubject}
        >
          <Text style={styles.addButtonText}>Add subject</Text>
        </Pressable>
      </View>

      {/* Subject List */}
      <Text style={styles.sectionTitle}>My subjects</Text>

      {subjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="book-outline" size={28} color={theme.textSecondary} />

          <Text style={styles.emptyTitle}>No subjects yet</Text>

          <Text style={styles.emptyText}>Add a subject to get started.</Text>
        </View>
      ) : (
        subjects.map((subject) => {
          const subjectTasks = tasks.filter((task) => task.subject === subject);
          const isExpanded = expandedSubject === subject;

          return (
            <View style={styles.subjectCard} key={subject}>
              <Pressable
                style={({ pressed }) => [styles.subjectRow, pressed && styles.pressed]}
                onPress={() => toggleExpanded(subject)}
              >
                <Ionicons name="book-outline" size={18} color={theme.tint} />

                <View style={styles.subjectNameGroup}>
                  <Text style={styles.subjectName}>{subject}</Text>
                  {subjectTasks.length > 0 && (
                    <Text style={styles.subjectTaskCount}>
                      {subjectTasks.length} {subjectTasks.length === 1 ? 'task' : 'tasks'}
                    </Text>
                  )}
                </View>

                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={theme.textSecondary}
                />

                <Pressable
                  hitSlop={8}
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                  onPress={() => deleteSubject(subject)}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                </Pressable>
              </Pressable>

              {isExpanded && (
                <View style={styles.subjectTasks}>
                  {/* Weekly goal for this subject */}
                  <View style={styles.subjectGoalCard}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalTitle}>Weekly goal</Text>

                      {editingGoalSubject !== subject && (
                        <Pressable hitSlop={8} onPress={() => openSubjectGoalEditor(subject)}>
                          <Ionicons
                            name="pencil-outline"
                            size={14}
                            color={theme.textSecondary}
                          />
                        </Pressable>
                      )}
                    </View>

                    {editingGoalSubject === subject ? (
                      <View style={styles.goalEditRow}>
                        <TextInput
                          style={styles.goalInput}
                          keyboardType="numeric"
                          value={goalHoursInput}
                          onChangeText={setGoalHoursInput}
                          placeholder="Hours per week"
                          placeholderTextColor={theme.textSecondary}
                          autoFocus
                        />

                        <Pressable
                          style={({ pressed }) => [
                            styles.editSaveButton,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => saveSubjectGoal(subject)}
                        >
                          <Text style={styles.editSaveText}>Save</Text>
                        </Pressable>

                        {subjectGoals[subject] && (
                          <Pressable
                            hitSlop={8}
                            onPress={() => {
                              clearSubjectGoal(subject);
                              setEditingGoalSubject(null);
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
                          </Pressable>
                        )}
                      </View>
                    ) : subjectGoals[subject] ? (
                      <>
                        <Text style={styles.goalProgressText}>
                          {formatHours(weeklyMinutesForSubject(subject))} of{' '}
                          {subjectGoals[subject]}h this week
                        </Text>

                        <View style={styles.goalBarBackground}>
                          <View
                            style={[
                              styles.goalBarFill,
                              (() => {
                                const percent = Math.min(
                                  100,
                                  Math.round(
                                    (weeklyMinutesForSubject(subject) /
                                      60 /
                                      subjectGoals[subject]) *
                                      100
                                  )
                                );
                                return { width: `${percent > 0 ? Math.max(percent, 4) : 0}%` };
                              })(),
                            ]}
                          />
                        </View>
                      </>
                    ) : (
                      <Text style={styles.noGoalText}>No goal set for this subject.</Text>
                    )}
                  </View>

                  {subjectTasks.length === 0 ? (
                    <Text style={styles.noTasksText}>No tasks for this subject yet.</Text>
                  ) : (
                    subjectTasks.map((task) =>
                      editingTaskId === task.id ? (
                        <View style={styles.editTaskBlock} key={task.id}>
                          <TextInput
                            style={styles.addTaskInput}
                            placeholder="Task name"
                            placeholderTextColor={theme.textSecondary}
                            value={editTitle}
                            onChangeText={setEditTitle}
                          />

                          <View style={styles.typeChipRow}>
                            {TASK_TYPES.map(({ type, label, icon }) => (
                              <Pressable
                                key={type}
                                style={({ pressed }) => [
                                  styles.typeChip,
                                  editType === type && styles.selectedTypeChip,
                                  pressed && styles.pressed,
                                ]}
                                onPress={() => setEditType(type)}
                              >
                                <Ionicons
                                  name={icon}
                                  size={12}
                                  color={editType === type ? 'white' : theme.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.typeChipText,
                                    editType === type && styles.selectedTypeChipText,
                                  ]}
                                >
                                  {label}
                                </Text>
                              </Pressable>
                            ))}
                          </View>

                          <Pressable
                            style={({ pressed }) => [
                              styles.taskDateField,
                              pressed && styles.pressed,
                            ]}
                            onPress={() => setShowEditDatePicker(!showEditDatePicker)}
                          >
                            <Ionicons
                              name="calendar-outline"
                              size={15}
                              color={theme.textSecondary}
                            />

                            <Text style={styles.taskDateFieldText}>
                              {editDateChanged
                                ? editDate
                                  ? formatDueDate(editDate)
                                  : 'No due date'
                                : task.date || 'No due date'}
                            </Text>

                            {((editDateChanged && editDate) ||
                              (!editDateChanged && task.date && task.date !== 'No due date')) && (
                              <Pressable
                                hitSlop={8}
                                onPress={(event) => {
                                  event.stopPropagation();
                                  setEditDate(null);
                                  setEditDateChanged(true);
                                }}
                              >
                                <Ionicons
                                  name="close-circle"
                                  size={15}
                                  color={theme.textSecondary}
                                />
                              </Pressable>
                            )}
                          </Pressable>

                          {showEditDatePicker && (
                            <View style={styles.datePickerWrap}>
                              <DateTimePicker
                                value={editDate ?? new Date()}
                                mode="date"
                                minimumDate={new Date()}
                                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                                onChange={handleEditDateChange}
                                accentColor={theme.tint}
                              />

                              {Platform.OS === 'ios' && (
                                <Pressable
                                  style={({ pressed }) => [
                                    styles.datePickerDone,
                                    pressed && styles.pressed,
                                  ]}
                                  onPress={() => setShowEditDatePicker(false)}
                                >
                                  <Text style={styles.datePickerDoneText}>Done</Text>
                                </Pressable>
                              )}
                            </View>
                          )}

                          <View style={styles.editActions}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.editCancelButton,
                                pressed && styles.pressed,
                              ]}
                              onPress={cancelEditTask}
                            >
                              <Text style={styles.editCancelText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                              style={({ pressed }) => [
                                styles.editSaveButton,
                                pressed && styles.pressed,
                              ]}
                              onPress={() => saveEditTask(task.id)}
                            >
                              <Text style={styles.editSaveText}>Save</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.taskRow} key={task.id}>
                          <Pressable
                            style={styles.taskMain}
                            onPress={() => toggleTask(task.id)}
                          >
                            <View
                              style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
                            >
                              {task.completed && (
                                <Ionicons name="checkmark" size={12} color="white" />
                              )}
                            </View>

                            <View style={styles.taskTextGroup}>
                              <View style={styles.taskTitleRow}>
                                {task.type !== 'task' && (
                                  <Ionicons
                                    name={taskTypeIcon(task.type)}
                                    size={12}
                                    color={task.completed ? theme.textSecondary : theme.tint}
                                  />
                                )}

                                <Text
                                  style={[
                                    styles.taskTitle,
                                    task.completed && styles.completedTaskTitle,
                                  ]}
                                >
                                  {task.title}
                                </Text>
                              </View>

                              {task.date && task.date !== 'No due date' && (
                                <Text
                                  style={[
                                    styles.taskDate,
                                    task.completed && { color: theme.success },
                                  ]}
                                >
                                  {task.completed ? 'Completed' : task.date}
                                </Text>
                              )}
                            </View>
                          </Pressable>

                          <Pressable
                            hitSlop={8}
                            style={({ pressed }) => pressed && styles.pressed}
                            onPress={() => startEditTask(task)}
                          >
                            <Ionicons name="pencil-outline" size={16} color={theme.textSecondary} />
                          </Pressable>

                          <Pressable
                            hitSlop={8}
                            style={({ pressed }) => [styles.taskDeleteButton, pressed && styles.pressed]}
                            onPress={() => deleteTask(task.id)}
                          >
                            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
                          </Pressable>
                        </View>
                      )
                    )
                  )}

                  <View style={styles.addTaskRow}>
                    <TextInput
                      style={styles.addTaskInput}
                      placeholder="Add a task for this subject"
                      placeholderTextColor={theme.textSecondary}
                      value={newTaskTitle}
                      onChangeText={setNewTaskTitle}
                      onSubmitEditing={() => addTaskToSubject(subject)}
                      returnKeyType="done"
                    />

                    <Pressable
                      style={({ pressed }) => [styles.addTaskButton, pressed && styles.pressed]}
                      onPress={() => addTaskToSubject(subject)}
                    >
                      <Ionicons name="add" size={18} color="white" />
                    </Pressable>
                  </View>

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
                          size={12}
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

                  <Pressable
                    style={({ pressed }) => [styles.taskDateField, pressed && styles.pressed]}
                    onPress={() => setShowTaskDatePicker(!showTaskDatePicker)}
                  >
                    <Ionicons name="calendar-outline" size={15} color={theme.textSecondary} />

                    <Text
                      style={[
                        styles.taskDateFieldText,
                        !newTaskDate && styles.taskDateFieldPlaceholder,
                      ]}
                    >
                      {newTaskDate ? formatDueDate(newTaskDate) : 'No due date'}
                    </Text>

                    {newTaskDate && (
                      <Pressable
                        hitSlop={8}
                        onPress={(event) => {
                          event.stopPropagation();
                          setNewTaskDate(null);
                          setShowTaskDatePicker(false);
                        }}
                      >
                        <Ionicons name="close-circle" size={15} color={theme.textSecondary} />
                      </Pressable>
                    )}
                  </Pressable>

                  {showTaskDatePicker && (
                    <View style={styles.datePickerWrap}>
                      <DateTimePicker
                        value={newTaskDate ?? new Date()}
                        mode="date"
                        minimumDate={new Date()}
                        display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                        onChange={handleTaskDateChange}
                        accentColor={theme.tint}
                      />

                      {Platform.OS === 'ios' && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.datePickerDone,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => setShowTaskDatePicker(false)}
                        >
                          <Text style={styles.datePickerDoneText}>Done</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })
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
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    backButton: {
      width: 38,
      height: 38,
      borderRadius: Radius.pill,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },

    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
    },

    headerSpace: {
      width: 38,
    },

    subtitle: {
      textAlign: 'center',
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 8,
      marginBottom: 24,
    },

    addCard: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: Radius.medium,
      marginBottom: 28,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      ...CardShadow,
    },

    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
    },

    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.small,
      padding: 12,
      fontSize: 16,
      marginBottom: 12,
      backgroundColor: theme.background,
      color: theme.text,
    },

    addButton: {
      backgroundColor: theme.tint,
      padding: 13,
      borderRadius: Radius.small,
    },

    addButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: '600',
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 14,
    },

    subjectCard: {
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      overflow: 'hidden',
      ...CardShadow,
    },

    subjectRow: {
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    subjectNameGroup: {
      flex: 1,
    },

    subjectName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },

    subjectTaskCount: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },

    deleteButton: {
      marginLeft: 4,
    },

    subjectTasks: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      paddingTop: 10,
      gap: 10,
    },

    noTasksText: {
      color: theme.textSecondary,
      fontSize: 13,
    },

    subjectGoalCard: {
      backgroundColor: theme.card,
      borderRadius: Radius.small,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
    },

    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    goalTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },

    goalEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    goalInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.small,
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 13,
      backgroundColor: theme.background,
      color: theme.text,
    },

    goalProgressText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 8,
    },

    goalBarBackground: {
      height: 6,
      borderRadius: 10,
      backgroundColor: theme.background,
    },

    goalBarFill: {
      height: 6,
      borderRadius: 10,
      backgroundColor: theme.tint,
    },

    noGoalText: {
      fontSize: 12,
      color: theme.textSecondary,
    },

    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    taskMain: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },

    checkbox: {
      width: 18,
      height: 18,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },

    checkboxCompleted: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },

    taskTextGroup: {
      flex: 1,
    },

    taskTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    taskTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },

    typeChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
      marginBottom: 8,
    },

    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 10,
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
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    selectedTypeChipText: {
      color: 'white',
    },

    completedTaskTitle: {
      textDecorationLine: 'line-through',
      color: theme.textSecondary,
    },

    taskDate: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },

    taskDeleteButton: {
      marginLeft: 10,
    },

    editTaskBlock: {
      backgroundColor: theme.background,
      borderRadius: Radius.small,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      gap: 8,
    },

    editActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 2,
    },

    editCancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },

    editCancelText: {
      color: theme.textSecondary,
      fontWeight: '600',
      fontSize: 13,
    },

    editSaveButton: {
      backgroundColor: theme.tint,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: Radius.small,
    },

    editSaveText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 13,
    },

    addTaskRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },

    addTaskInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.small,
      paddingVertical: 9,
      paddingHorizontal: 12,
      fontSize: 14,
      backgroundColor: theme.background,
      color: theme.text,
    },

    addTaskButton: {
      width: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.tint,
      borderRadius: Radius.small,
    },

    taskDateField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.small,
      backgroundColor: theme.background,
    },

    taskDateFieldText: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
    },

    taskDateFieldPlaceholder: {
      color: theme.textSecondary,
    },

    datePickerWrap: {
      backgroundColor: theme.background,
      borderRadius: Radius.small,
      marginTop: 8,
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
      fontSize: 14,
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
