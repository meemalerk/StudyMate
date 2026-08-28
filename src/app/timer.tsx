import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
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
import { useNotifications } from '@/hooks/use-notifications';
import { useStudySessions } from '@/hooks/use-study-sessions';
import { useSubjects } from '@/hooks/use-subjects';
import { useTheme } from '@/hooks/use-theme';

const durations = [25, 45, 60];
const MAX_CUSTOM_MINUTES = 300;
const TIMER_NOTIFICATION_ID = 'timer-completion';

export default function TimerScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { logSession } = useStudySessions();
  const { subjects } = useSubjects();
  const { remindersEnabled } = useNotifications();

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutesText, setCustomMinutesText] = useState('');
  const isCustomDuration = !durations.includes(selectedMinutes);

  const hasLoggedRef = useRef(false);
  // Absolute completion time (epoch ms) — the source of truth for the countdown. Computing
  // remaining time from this instead of just decrementing a counter keeps the timer accurate
  // even after `setInterval` is throttled or paused while the app is backgrounded.
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      return;
    }

    const tick = () => {
      if (endTimeRef.current === null) {
        return;
      }

      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        setRunning(false);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [running]);

  // Recompute the remaining time the instant the app returns to the foreground, instead of
  // waiting for the next (possibly delayed) interval tick.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !running || endTimeRef.current === null) {
        return;
      }

      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        setRunning(false);
      }
    });

    return () => subscription.remove();
  }, [running]);

  // Log a completed session exactly once each time the countdown reaches zero, and clear any
  // pending completion notification since the app is open and the user can already see this.
  useEffect(() => {
    if (secondsLeft === 0) {
      if (!hasLoggedRef.current) {
        hasLoggedRef.current = true;
        logSession({ minutes: selectedMinutes, subject: selectedSubject });
        Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
      }
    } else {
      hasLoggedRef.current = false;
    }
  }, [secondsLeft, selectedMinutes, selectedSubject, logSession]);

  const selectDuration = (minutes: number) => {
    setSelectedMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setRunning(false);
    setShowCustomInput(false);
    endTimeRef.current = null;
    Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
  };

  const openCustomInput = () => {
    setCustomMinutesText(isCustomDuration ? String(selectedMinutes) : '');
    setShowCustomInput(true);
  };

  /** Applies a typed custom minute value immediately, as-you-type — no confirm step needed.
   * Returns the applied minute value, or null if the text wasn't a valid duration. */
  const applyCustomMinutes = (text: string): number | null => {
    const parsed = Math.floor(Number(text));

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    const clamped = Math.min(parsed, MAX_CUSTOM_MINUTES);
    setSelectedMinutes(clamped);
    setSecondsLeft(clamped * 60);
    return clamped;
  };

  const handleCustomMinutesChange = (text: string) => {
    setCustomMinutesText(text);
    applyCustomMinutes(text);
  };

  const resetTimer = () => {
    setSecondsLeft(selectedMinutes * 60);
    setRunning(false);
    endTimeRef.current = null;
    Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
  };

  /** Starts (or resumes) the countdown for the given duration, and — if reminders are
   * enabled — schedules a local notification for the exact completion time, so it still
   * arrives even if the app is backgrounded or the phone is locked. */
  const startCountdown = (seconds: number, subject: string | undefined) => {
    const endTime = Date.now() + seconds * 1000;
    endTimeRef.current = endTime;
    setSecondsLeft(seconds);
    setRunning(true);

    if (remindersEnabled) {
      Notifications.scheduleNotificationAsync({
        identifier: TIMER_NOTIFICATION_ID,
        content: {
          title: 'Study session complete',
          body: subject ? `Your ${subject} session has finished.` : 'Your study session has finished.',
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endTime) },
      });
    } else {
      Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
    }
  };

  const handleStartPause = () => {
    if (running) {
      setRunning(false);
      endTimeRef.current = null;
      Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
      return;
    }

    if (showCustomInput) {
      const applied = applyCustomMinutes(customMinutesText);
      setShowCustomInput(false);

      if (applied !== null) {
        startCountdown(applied * 60, selectedSubject);
        return;
      }
    }

    startCountdown(secondsLeft > 0 ? secondsLeft : selectedMinutes * 60, selectedSubject);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const formattedTime =
    `${minutes.toString().padStart(2, '0')}:` + `${seconds.toString().padStart(2, '0')}`;

  const statusLabel = running
    ? 'Studying'
    : secondsLeft === 0
      ? 'Session complete'
      : 'Ready to study';

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

        <Text style={styles.title}>Study timer</Text>

        <View style={styles.headerSpace} />
      </View>

      <Text style={styles.subtitle}>Focus on your studies</Text>

      {/* Timer */}
      <View style={styles.timerCircle}>
        <View
          style={[
            styles.timerRing,
            secondsLeft === 0 && { borderColor: 'rgba(255,255,255,0.6)' },
          ]}
        />

        <Text style={styles.timerText}>{formattedTime}</Text>

        <View style={styles.timerStatusPill}>
          <Text style={styles.timerLabel}>{statusLabel}</Text>
        </View>
      </View>

      {/* Duration */}
      <Text style={styles.sectionTitle}>Study duration</Text>

      <View style={styles.durationContainer}>
        {durations.map((duration) => (
          <Pressable
            key={duration}
            style={({ pressed }) => [
              styles.durationButton,
              selectedMinutes === duration && styles.selectedDuration,
              pressed && styles.pressed,
            ]}
            onPress={() => selectDuration(duration)}
          >
            <Text
              style={[
                styles.durationText,
                selectedMinutes === duration && styles.selectedDurationText,
              ]}
            >
              {duration} min
            </Text>
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.durationButton,
            isCustomDuration && styles.selectedDuration,
            pressed && styles.pressed,
          ]}
          onPress={openCustomInput}
        >
          <Text
            style={[styles.durationText, isCustomDuration && styles.selectedDurationText]}
          >
            {isCustomDuration ? `${selectedMinutes} min` : 'Custom'}
          </Text>
        </Pressable>
      </View>

      {showCustomInput && (
        <View style={styles.customDurationRow}>
          <TextInput
            style={styles.customDurationInput}
            placeholder="Minutes"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={customMinutesText}
            onChangeText={handleCustomMinutesChange}
            onSubmitEditing={() => setShowCustomInput(false)}
            returnKeyType="done"
            autoFocus
          />

          <Pressable
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
            onPress={() => setShowCustomInput(false)}
          >
            <Ionicons name="close" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Subject */}
      {subjects.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Subject (optional)</Text>

          <View style={styles.subjectChipRow}>
            <Pressable
              style={({ pressed }) => [
                styles.subjectChip,
                !selectedSubject && styles.selectedSubjectChip,
                pressed && styles.pressed,
              ]}
              onPress={() => setSelectedSubject(undefined)}
            >
              <Text
                style={[
                  styles.subjectChipText,
                  !selectedSubject && styles.selectedSubjectChipText,
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
                  selectedSubject === subject && styles.selectedSubjectChip,
                  pressed && styles.pressed,
                ]}
                onPress={() => setSelectedSubject(subject)}
              >
                <Text
                  style={[
                    styles.subjectChipText,
                    selectedSubject === subject && styles.selectedSubjectChipText,
                  ]}
                >
                  {subject}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Start / Pause */}
      <Pressable
        style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
        onPress={handleStartPause}
      >
        <Ionicons name={running ? 'pause' : 'play'} size={16} color="white" />
        <Text style={styles.startButtonText}>{running ? 'Pause' : 'Start'}</Text>
      </Pressable>

      {/* Reset */}
      <Pressable
        style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        onPress={resetTimer}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </Pressable>

      {!remindersEnabled && (
        <Text style={styles.remindersHint}>
          Turn on Reminders in Settings to get notified when this session ends, even if you
          leave the app.
        </Text>
      )}

      {/* Tip */}
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb-outline" size={16} color={theme.tint} />
          <Text style={styles.tipTitle}>Study tip</Text>
        </View>

        <Text style={styles.tipText}>
          Put your phone away and focus on one task until the timer finishes.
        </Text>
      </View>
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
    },

    timerCircle: {
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: theme.tint,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 36,
      marginBottom: 32,
    },

    timerRing: {
      position: 'absolute',
      width: 240,
      height: 240,
      borderRadius: 120,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.2)',
    },

    timerText: {
      color: 'white',
      fontSize: 48,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      letterSpacing: -1,
    },

    timerStatusPill: {
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: Radius.pill,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },

    timerLabel: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 14,
    },

    durationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 20,
    },

    durationButton: {
      flex: 1,
      backgroundColor: theme.card,
      paddingVertical: 13,
      alignItems: 'center',
      borderRadius: Radius.medium,
      borderWidth: 1,
      borderColor: theme.border,
    },

    selectedDuration: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },

    durationText: {
      fontWeight: '600',
      color: theme.textSecondary,
      fontSize: 14,
    },

    selectedDurationText: {
      color: 'white',
    },

    customDurationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: -10,
      marginBottom: 20,
    },

    customDurationInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.small,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 14,
      backgroundColor: theme.card,
      color: theme.text,
    },

    subjectChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },

    subjectChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },

    selectedSubjectChip: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },

    subjectChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    selectedSubjectChipText: {
      color: 'white',
    },

    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.tint,
      padding: 16,
      borderRadius: Radius.medium,
      marginBottom: 10,
    },

    startButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },

    resetButton: {
      backgroundColor: theme.card,
      padding: 15,
      borderRadius: Radius.medium,
      borderWidth: 1,
      borderColor: theme.border,
    },

    resetButtonText: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    remindersHint: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 12,
      lineHeight: 17,
      paddingHorizontal: 10,
    },

    tipCard: {
      backgroundColor: theme.tintSoft,
      padding: 16,
      borderRadius: Radius.medium,
      marginTop: 24,
    },

    tipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },

    tipTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },

    tipText: {
      color: theme.textSecondary,
      lineHeight: 20,
      fontSize: 13,
    },

    pressed: {
      opacity: 0.6,
    },
  });
}
