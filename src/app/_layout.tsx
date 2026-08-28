import { Stack } from 'expo-router';

import { NotificationsProvider } from '@/hooks/use-notifications';
import { StudySessionsProvider } from '@/hooks/use-study-sessions';
import { SubjectsProvider } from '@/hooks/use-subjects';
import { TasksProvider } from '@/hooks/use-tasks';
import { ThemePreferenceProvider } from '@/hooks/use-theme-preference';

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <SubjectsProvider>
        <TasksProvider>
          <StudySessionsProvider>
            <NotificationsProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </NotificationsProvider>
          </StudySessionsProvider>
        </TasksProvider>
      </SubjectsProvider>
    </ThemePreferenceProvider>
  );
}
