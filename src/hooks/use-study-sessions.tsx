import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { loadJSON, saveJSON } from '@/utils/storage';

const STORAGE_KEY = 'studymate.sessions';

export type StudySession = {
  id: number;
  minutes: number;
  completedAt: Date;
  subject?: string;
};

/** A planned session for a given calendar date — created from the Study Calendar,
 * distinct from `StudySession` which represents one already completed. */
export type ScheduledSession = {
  id: number;
  date: Date;
  minutes: number;
  subject?: string;
};

type SessionsContextValue = {
  sessions: StudySession[];
  logSession: (input: { minutes: number; subject?: string; completedAt?: Date }) => void;
  scheduledSessions: ScheduledSession[];
  addScheduledSession: (input: { date: Date; minutes: number; subject?: string }) => void;
  deleteScheduledSession: (id: number) => void;
  /** Marks a scheduled session done: removes it from the schedule and logs it as a
   * completed session (backdated to the date it was scheduled for). */
  completeScheduledSession: (id: number) => void;
  dailyGoalHours: number;
  setDailyGoalHours: (hours: number) => void;
  weeklyGoalHours: number;
  setWeeklyGoalHours: (hours: number) => void;
  /** Weekly hour goals per subject name. A subject with no entry has no goal set. */
  subjectGoals: Record<string, number>;
  setSubjectGoalHours: (subject: string, hours: number) => void;
  clearSubjectGoal: (subject: string) => void;
};

const SessionsContext = createContext<SessionsContextValue | null>(null);

const DEFAULT_DAILY_GOAL_HOURS = 2;
const DEFAULT_WEEKLY_GOAL_HOURS = 10;

/** Everything this store persists, with Date fields as ISO strings for JSON round-tripping. */
type PersistedState = {
  sessions: (Omit<StudySession, 'completedAt'> & { completedAt: string })[];
  scheduledSessions: (Omit<ScheduledSession, 'date'> & { date: string })[];
  dailyGoalHours: number;
  weeklyGoalHours: number;
  subjectGoals: Record<string, number>;
};

export function StudySessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [dailyGoalHours, setDailyGoalHours] = useState(DEFAULT_DAILY_GOAL_HOURS);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(DEFAULT_WEEKLY_GOAL_HOURS);
  const [subjectGoals, setSubjectGoals] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  // Load everything once on startup.
  useEffect(() => {
    (async () => {
      const stored = await loadJSON<PersistedState>(STORAGE_KEY);

      if (stored) {
        setSessions(
          stored.sessions.map((s) => ({ ...s, completedAt: new Date(s.completedAt) }))
        );
        setScheduledSessions(
          stored.scheduledSessions.map((s) => ({ ...s, date: new Date(s.date) }))
        );
        setDailyGoalHours(stored.dailyGoalHours ?? DEFAULT_DAILY_GOAL_HOURS);
        setWeeklyGoalHours(stored.weeklyGoalHours ?? DEFAULT_WEEKLY_GOAL_HOURS);
        setSubjectGoals(stored.subjectGoals ?? {});
      }

      setHydrated(true);
    })();
  }, []);

  // Persist on any change, once hydration has completed.
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    // JSON.stringify serializes Date fields to ISO strings automatically, matching
    // PersistedState's shape on disk even though the in-memory values are Date objects.
    saveJSON(STORAGE_KEY, {
      sessions,
      scheduledSessions,
      dailyGoalHours,
      weeklyGoalHours,
      subjectGoals,
    });
  }, [sessions, scheduledSessions, dailyGoalHours, weeklyGoalHours, subjectGoals, hydrated]);

  const logSession = ({
    minutes,
    subject,
    completedAt,
  }: {
    minutes: number;
    subject?: string;
    completedAt?: Date;
  }) => {
    if (minutes <= 0) {
      return;
    }

    setSessions((previous) => [
      ...previous,
      { id: Date.now(), minutes, completedAt: completedAt ?? new Date(), subject },
    ]);
  };

  const addScheduledSession = ({
    date,
    minutes,
    subject,
  }: {
    date: Date;
    minutes: number;
    subject?: string;
  }) => {
    if (minutes <= 0) {
      return;
    }

    setScheduledSessions((previous) => [
      ...previous,
      { id: Date.now(), date, minutes, subject },
    ]);
  };

  const deleteScheduledSession = (id: number) => {
    setScheduledSessions((previous) => previous.filter((session) => session.id !== id));
  };

  const completeScheduledSession = (id: number) => {
    const target = scheduledSessions.find((session) => session.id === id);

    if (!target) {
      return;
    }

    deleteScheduledSession(id);
    logSession({ minutes: target.minutes, subject: target.subject, completedAt: target.date });
  };

  const setSubjectGoalHours = (subject: string, hours: number) => {
    if (hours <= 0) {
      return;
    }

    setSubjectGoals((previous) => ({ ...previous, [subject]: hours }));
  };

  const clearSubjectGoal = (subject: string) => {
    setSubjectGoals((previous) => {
      const next = { ...previous };
      delete next[subject];
      return next;
    });
  };

  return (
    <SessionsContext.Provider
      value={{
        sessions,
        logSession,
        scheduledSessions,
        addScheduledSession,
        deleteScheduledSession,
        completeScheduledSession,
        dailyGoalHours,
        setDailyGoalHours,
        weeklyGoalHours,
        setWeeklyGoalHours,
        subjectGoals,
        setSubjectGoalHours,
        clearSubjectGoal,
      }}
    >
      {children}
    </SessionsContext.Provider>
  );
}

export function useStudySessions() {
  const context = useContext(SessionsContext);

  if (!context) {
    throw new Error('useStudySessions must be used within a StudySessionsProvider');
  }

  return context;
}
