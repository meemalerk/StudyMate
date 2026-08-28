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

import { CardShadow, Radius, Spacing, Theme } from '@/constants/theme';
import { useStudySessions } from '@/hooks/use-study-sessions';
import { useSubjects } from '@/hooks/use-subjects';
import { useTasks } from '@/hooks/use-tasks';
import { useTheme } from '@/hooks/use-theme';
import {
  formatHours,
  formatMonthYear,
  getMonthGrid,
  isSameDay,
  startOfMonth,
} from '@/utils/date';

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Whether a scheduled session's date carries a meaningful time-of-day (vs. the midnight
 * default when no time was picked). */
function hasTime(date: Date): boolean {
  return date.getHours() !== 0 || date.getMinutes() !== 0;
}

export default function CalendarScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { tasks } = useTasks();
  const { subjects } = useSubjects();
  const {
    sessions,
    scheduledSessions,
    addScheduledSession,
    deleteScheduledSession,
    completeScheduledSession,
  } = useStudySessions();

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState('');
  const [sessionSubject, setSessionSubject] = useState<string | undefined>(undefined);
  const [sessionTime, setSessionTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const monthGrid = useMemo(() => getMonthGrid(viewMonth), [viewMonth]);

  const dayHasActivity = (day: Date) =>
    scheduledSessions.some((session) => isSameDay(session.date, day)) ||
    tasks.some((task) => task.dueDate && isSameDay(task.dueDate, day));

  const goToPreviousMonth = () => {
    setViewMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1));
  };

  const selectDate = (day: Date) => {
    setSelectedDate(day);
    setShowAddSession(false);
    setShowTimePicker(false);
  };

  const scheduledForSelectedDate = scheduledSessions
    .filter((session) => isSameDay(session.date, selectedDate))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const deadlinesForSelectedDate = tasks.filter(
    (task) => task.dueDate && isSameDay(task.dueDate, selectedDate)
  );

  const completedForSelectedDate = sessions
    .filter((session) => isSameDay(session.completedAt, selectedDate))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());

  const handleSessionTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selected) {
      setSessionTime(selected);
    }
  };

  const addSession = () => {
    const minutes = Math.floor(Number(sessionMinutes));

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    const date = new Date(selectedDate);

    if (sessionTime) {
      date.setHours(sessionTime.getHours(), sessionTime.getMinutes(), 0, 0);
    }

    addScheduledSession({ date, minutes, subject: sessionSubject });

    setSessionMinutes('');
    setSessionSubject(undefined);
    setSessionTime(null);
    setShowTimePicker(false);
    setShowAddSession(false);
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

        <Text style={styles.title}>Study calendar</Text>

        <View style={styles.headerSpace} />
      </View>

      <Text style={styles.subtitle}>Plan and track your study sessions</Text>

      {/* Month calendar */}
      <View style={styles.calendarCard}>
        <View style={styles.monthNav}>
          <Pressable hitSlop={8} onPress={goToPreviousMonth}>
            <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
          </Pressable>

          <Text style={styles.monthLabel}>{formatMonthYear(viewMonth)}</Text>

          <Pressable hitSlop={8} onPress={goToNextMonth}>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label) => (
            <Text style={styles.weekdayLabel} key={label}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {monthGrid.map((day, index) => {
            if (!day) {
              return <View style={styles.dayCell} key={`blank-${index}`} />;
            }

            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);

            return (
              <Pressable
                style={styles.dayCell}
                key={day.toISOString()}
                onPress={() => selectDate(day)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isSelected && styles.dayCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>

                <View
                  style={[styles.dayDot, dayHasActivity(day) && styles.dayDotVisible]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected date heading */}
      <Text style={styles.selectedDateHeading}>
        {selectedDate.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </Text>

      {/* Scheduled sessions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Scheduled sessions</Text>

        <Pressable
          style={({ pressed }) => [styles.smallAddButton, pressed && styles.pressed]}
          onPress={() => setShowAddSession(!showAddSession)}
        >
          <Ionicons name={showAddSession ? 'close' : 'add'} size={16} color={theme.tint} />
          <Text style={styles.smallAddButtonText}>{showAddSession ? 'Close' : 'Add'}</Text>
        </Pressable>
      </View>

      {showAddSession && (
        <View style={styles.addSessionCard}>
          <Text style={styles.inputLabel}>Duration (minutes)</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 30"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={sessionMinutes}
            onChangeText={setSessionMinutes}
          />

          {subjects.length > 0 && (
            <>
              <Text style={styles.inputLabel}>Subject (optional)</Text>

              <View style={styles.subjectChipRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.subjectChip,
                    !sessionSubject && styles.selectedSubjectChip,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setSessionSubject(undefined)}
                >
                  <Text
                    style={[
                      styles.subjectChipText,
                      !sessionSubject && styles.selectedSubjectChipText,
                    ]}
                  >
                    General
                  </Text>
                </Pressable>

                {subjects.map((subject) => (
                  <Pressable
                    key={subject}
                    style={({ pressed }) => [
                      styles.subjectChip,
                      sessionSubject === subject && styles.selectedSubjectChip,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSessionSubject(subject)}
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        sessionSubject === subject && styles.selectedSubjectChipText,
                      ]}
                    >
                      {subject}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text style={styles.inputLabel}>Time (optional)</Text>

          <Pressable
            style={({ pressed }) => [styles.taskDateField, pressed && styles.pressed]}
            onPress={() => setShowTimePicker(!showTimePicker)}
          >
            <Ionicons name="time-outline" size={15} color={theme.textSecondary} />

            <Text
              style={[styles.taskDateFieldText, !sessionTime && styles.taskDateFieldPlaceholder]}
            >
              {sessionTime
                ? sessionTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                : 'No specific time'}
            </Text>

            {sessionTime && (
              <Pressable
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  setSessionTime(null);
                  setShowTimePicker(false);
                }}
              >
                <Ionicons name="close-circle" size={15} color={theme.textSecondary} />
              </Pressable>
            )}
          </Pressable>

          {showTimePicker && (
            <View style={styles.timePickerWrap}>
              <DateTimePicker
                value={sessionTime ?? new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleSessionTimeChange}
                accentColor={theme.tint}
              />

              {Platform.OS === 'ios' && (
                <Pressable
                  style={({ pressed }) => [styles.datePickerDone, pressed && styles.pressed]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
            onPress={addSession}
          >
            <Text style={styles.saveText}>Schedule session</Text>
          </Pressable>
        </View>
      )}

      {scheduledForSelectedDate.length === 0 ? (
        <View style={styles.smallEmptyCard}>
          <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
          <Text style={styles.smallEmptyText}>No sessions scheduled for this day.</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {scheduledForSelectedDate.map((session, index) => (
            <View
              style={[styles.listRow, index > 0 && styles.listRowDivider]}
              key={session.id}
            >
              <Pressable
                hitSlop={8}
                onPress={() => completeScheduledSession(session.id)}
                style={styles.checkbox}
              />

              <View style={styles.listRowInfo}>
                <Text style={styles.listRowTitle}>{formatHours(session.minutes)} study session</Text>
                {(session.subject || hasTime(session.date)) && (
                  <Text style={styles.listRowSubtext}>
                    {[
                      session.subject,
                      hasTime(session.date)
                        ? session.date.toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                )}
              </View>

              <Pressable
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}
                onPress={() => deleteScheduledSession(session.id)}
              >
                <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Upcoming deadlines */}
      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Deadlines this day</Text>

      {deadlinesForSelectedDate.length === 0 ? (
        <View style={styles.smallEmptyCard}>
          <Ionicons name="flag-outline" size={20} color={theme.textSecondary} />
          <Text style={styles.smallEmptyText}>No deadlines on this day.</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {deadlinesForSelectedDate.map((task, index) => (
            <View style={[styles.listRow, index > 0 && styles.listRowDivider]} key={task.id}>
              <Ionicons
                name={task.completed ? 'checkmark-circle' : 'flag-outline'}
                size={18}
                color={task.completed ? theme.success : theme.textSecondary}
              />

              <View style={styles.listRowInfo}>
                <Text
                  style={[styles.listRowTitle, task.completed && styles.completedText]}
                >
                  {task.title}
                </Text>
                {task.subject && <Text style={styles.listRowSubtext}>{task.subject}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Completed sessions */}
      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Completed sessions</Text>

      {completedForSelectedDate.length === 0 ? (
        <View style={styles.smallEmptyCard}>
          <Ionicons name="checkmark-done-outline" size={20} color={theme.textSecondary} />
          <Text style={styles.smallEmptyText}>No completed sessions on this day.</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {completedForSelectedDate.map((session, index) => (
            <View
              style={[styles.listRow, index > 0 && styles.listRowDivider]}
              key={session.id}
            >
              <Ionicons name="checkmark-circle" size={18} color={theme.success} />

              <View style={styles.listRowInfo}>
                <Text style={styles.listRowTitle}>{formatHours(session.minutes)} studied</Text>
                {session.subject && <Text style={styles.listRowSubtext}>{session.subject}</Text>}
              </View>

              <Text style={styles.listRowTime}>
                {session.completedAt.toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}
        </View>
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
      marginBottom: 20,
    },

    calendarCard: {
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 22,
      ...CardShadow,
    },

    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },

    monthLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },

    weekdayRow: {
      flexDirection: 'row',
    },

    weekdayLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 4,
    },

    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },

    dayCell: {
      width: `${100 / 7}%`,
      alignItems: 'center',
      paddingVertical: 4,
    },

    dayCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },

    dayCircleToday: {
      borderWidth: 1,
      borderColor: theme.tint,
    },

    dayCircleSelected: {
      backgroundColor: theme.tint,
    },

    dayNumber: {
      fontSize: 13,
      color: theme.text,
      fontWeight: '500',
    },

    dayNumberSelected: {
      color: 'white',
      fontWeight: '700',
    },

    dayDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginTop: 3,
      backgroundColor: 'transparent',
    },

    dayDotVisible: {
      backgroundColor: theme.tint,
    },

    selectedDateHeading: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },

    sectionSpacing: {
      marginTop: 26,
      marginBottom: 12,
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

    addSessionCard: {
      backgroundColor: theme.card,
      padding: 16,
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
      marginBottom: 8,
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

    subjectChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },

    subjectChip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },

    selectedSubjectChip: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },

    subjectChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    selectedSubjectChipText: {
      color: 'white',
    },

    taskDateField: {
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

    taskDateFieldText: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    },

    taskDateFieldPlaceholder: {
      color: theme.textSecondary,
    },

    timePickerWrap: {
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

    saveButton: {
      backgroundColor: theme.tint,
      paddingVertical: 12,
      borderRadius: Radius.small,
    },

    saveText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: '600',
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
    },

    smallEmptyText: {
      color: theme.textSecondary,
      fontSize: 13,
      flex: 1,
    },

    listCard: {
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      overflow: 'hidden',
      ...CardShadow,
    },

    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 10,
    },

    listRowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },

    listRowInfo: {
      flex: 1,
    },

    listRowTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },

    completedText: {
      textDecorationLine: 'line-through',
      color: theme.textSecondary,
    },

    listRowSubtext: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },

    listRowTime: {
      fontSize: 12,
      color: theme.textSecondary,
    },

    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pressed: {
      opacity: 0.6,
    },
  });
}
