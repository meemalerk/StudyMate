import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardShadow, Radius, Spacing, Theme } from '@/constants/theme';
import { useNotifications } from '@/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';
import { ThemePreference, useThemePreference } from '@/hooks/use-theme-preference';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    remindersEnabled,
    permissionDenied,
    enableReminders,
    disableReminders,
    sendTestNotification,
  } = useNotifications();
  const { themePreference, setThemePreference } = useThemePreference();

  const [testSent, setTestSent] = useState(false);

  const handleToggleReminders = (value: boolean) => {
    if (value) {
      enableReminders();
    } else {
      disableReminders();
    }
  };

  const handleSendTest = () => {
    sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 6000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.six },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>

        <Text style={styles.title}>Settings</Text>

        <View style={styles.headerSpace} />
      </View>

      <Text style={styles.subtitle}>Manage reminders, appearance, and more</Text>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowTextGroup}>
            <Text style={styles.rowTitle}>Reminders</Text>
            <Text style={styles.rowDescription}>
              Get notified for scheduled study sessions and upcoming deadlines
            </Text>
          </View>

          <Switch
            value={remindersEnabled}
            onValueChange={handleToggleReminders}
            trackColor={{ true: theme.tint }}
          />
        </View>

        {permissionDenied && !remindersEnabled && (
          <Text style={styles.deniedText}>
            Notifications permission was denied — enable it for StudyMate in your device
            Settings, then try again.
          </Text>
        )}

        {remindersEnabled && (
          <>
            <Pressable
              style={({ pressed }) => [styles.testButton, pressed && styles.pressed]}
              onPress={handleSendTest}
            >
              <Ionicons name="notifications-outline" size={15} color={theme.tint} />
              <Text style={styles.testButtonText}>Send test notification</Text>
            </Pressable>

            {testSent && (
              <Text style={styles.testSentText}>
                Sent — background or lock your phone now, it'll arrive in ~5 seconds.
              </Text>
            )}
          </>
        )}
      </View>

      {/* Appearance */}
      <Text style={styles.sectionTitle}>Appearance</Text>

      <View style={styles.card}>
        <Text style={styles.rowTitle}>Theme</Text>
        <Text style={styles.rowDescription}>Choose how StudyMate looks</Text>

        <View style={styles.themeOptionRow}>
          {THEME_OPTIONS.map(({ value, label, icon }) => {
            const isSelected = themePreference === value;

            return (
              <Pressable
                key={value}
                style={({ pressed }) => [
                  styles.themeOption,
                  isSelected && styles.themeOptionSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => setThemePreference(value)}
              >
                <Ionicons name={icon} size={20} color={isSelected ? 'white' : theme.tint} />
                <Text
                  style={[styles.themeOptionText, isSelected && styles.themeOptionTextSelected]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.footerText}>StudyMate · v1.0.0</Text>
    </ScrollView>
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

    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: Radius.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 26,
      ...CardShadow,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },

    rowTextGroup: {
      flex: 1,
    },

    rowTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },

    rowDescription: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 3,
    },

    deniedText: {
      fontSize: 12,
      color: theme.danger,
      marginTop: 10,
      lineHeight: 17,
    },

    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 14,
      paddingVertical: 11,
      borderRadius: Radius.small,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },

    testButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.tint,
    },

    testSentText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 10,
      textAlign: 'center',
      lineHeight: 17,
    },

    themeOptionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },

    themeOption: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: Radius.medium,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },

    themeOptionSelected: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },

    themeOptionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    themeOptionTextSelected: {
      color: 'white',
    },

    footerText: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },

    pressed: {
      opacity: 0.6,
    },
  });
}
