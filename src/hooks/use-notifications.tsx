import * as Notifications from 'expo-notifications';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { taskTypeLabel } from '@/constants/task-types';
import { useStudySessions } from '@/hooks/use-study-sessions';
import { useTasks } from '@/hooks/use-tasks';
import { loadJSON, saveJSON } from '@/utils/storage';

const STORAGE_KEY = 'studymate.reminders';

/** How long before a scheduled study session to remind the user. */
const SESSION_REMINDER_MINUTES_BEFORE = 10;
/** Time of day (24h) deadline reminders fire on the due date. */
const DEADLINE_REMINDER_HOUR = 9;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type NotificationsContextValue = {
  remindersEnabled: boolean;
  /** True once the user has tried to enable reminders and the OS denied permission. */
  permissionDenied: boolean;
  enableReminders: () => Promise<void>;
  disableReminders: () => void;
  /** Fires a notification a few seconds from now — lets you verify permission + delivery
   * actually work without waiting for a real deadline or session reminder to come due. */
  sendTestNotification: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks();
  const { scheduledSessions } = useStudySessions();

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load the saved on/off preference, but re-verify against the OS in case the user
  // revoked notification permission from system settings since we last checked.
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const stored = await loadJSON<{ enabled: boolean }>(STORAGE_KEY);

      if (stored?.enabled) {
        const { status } = await Notifications.getPermissionsAsync();
        setRemindersEnabled(status === 'granted');
      }

      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveJSON(STORAGE_KEY, { enabled: remindersEnabled });
  }, [remindersEnabled, hydrated]);

  const enableReminders = async () => {
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
      setPermissionDenied(true);
      setRemindersEnabled(false);
      return;
    }

    setPermissionDenied(false);
    setRemindersEnabled(true);
  };

  const disableReminders = () => {
    setRemindersEnabled(false);
  };

  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      identifier: 'test-notification',
      content: {
        title: 'Test notification',
        body: "If you see this, StudyMate's reminders are working.",
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false },
    });
  };

  // Whenever tasks, scheduled sessions, or the on/off state change, throw out everything
  // this app previously scheduled and reschedule fresh — simplest way to stay correct as
  // items get added, edited, completed, or deleted.
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    (async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!remindersEnabled) {
        return;
      }

      const now = Date.now();

      for (const task of tasks) {
        if (task.completed || !task.dueDate) {
          continue;
        }

        const trigger = new Date(task.dueDate);
        trigger.setHours(DEADLINE_REMINDER_HOUR, 0, 0, 0);

        if (trigger.getTime() <= now) {
          continue;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: `task-${task.id}`,
          content: {
            title: `${taskTypeLabel(task.type)} due today`,
            body: task.subject ? `${task.title} — ${task.subject}` : task.title,
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
        });
      }

      for (const session of scheduledSessions) {
        const trigger = new Date(
          session.date.getTime() - SESSION_REMINDER_MINUTES_BEFORE * 60 * 1000
        );

        if (trigger.getTime() <= now) {
          continue;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: `session-${session.id}`,
          content: {
            title: 'Study session starting soon',
            body: session.subject
              ? `${session.subject} — ${session.minutes} min`
              : `${session.minutes} min session`,
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
        });
      }
    })();
  }, [tasks, scheduledSessions, remindersEnabled, hydrated]);

  return (
    <NotificationsContext.Provider
      value={{
        remindersEnabled,
        permissionDenied,
        enableReminders,
        disableReminders,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
}
