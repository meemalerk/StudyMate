import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const durations = [25, 45, 60];

export default function TimerScreen() {
  const [selectedMinutes, setSelectedMinutes] =
    useState(25);

  const [secondsLeft, setSecondsLeft] =
    useState(25 * 60);

  const [running, setRunning] =
    useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          setRunning(false);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const selectDuration = (minutes: number) => {
    setSelectedMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setRunning(false);
  };

  const resetTimer = () => {
    setSecondsLeft(
      selectedMinutes * 60
    );

    setRunning(false);
  };

  const minutes = Math.floor(
    secondsLeft / 60
  );

  const seconds = secondsLeft % 60;

  const formattedTime =
    `${minutes
      .toString()
      .padStart(2, '0')}:` +
    `${seconds
      .toString()
      .padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Study Timer
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <Text style={styles.subtitle}>
        Focus on your studies
      </Text>

      {/* Timer */}
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>
          {formattedTime}
        </Text>

        <Text style={styles.timerLabel}>
          {running
            ? 'Studying...'
            : secondsLeft === 0
            ? 'Session complete!'
            : 'Ready to study'}
        </Text>
      </View>

      {/* Duration */}
      <Text style={styles.sectionTitle}>
        Study Duration
      </Text>

      <View style={styles.durationContainer}>
        {durations.map((duration) => (
          <Pressable
            key={duration}
            style={[
              styles.durationButton,
              selectedMinutes === duration &&
                styles.selectedDuration,
            ]}
            onPress={() =>
              selectDuration(duration)
            }
          >
            <Text
              style={[
                styles.durationText,
                selectedMinutes === duration &&
                  styles.selectedDurationText,
              ]}
            >
              {duration} min
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Start / Pause */}
      <Pressable
        style={styles.startButton}
        onPress={() =>
          setRunning(!running)
        }
      >
        <Text style={styles.startButtonText}>
          {running
            ? '⏸ Pause'
            : '▶ Start'}
        </Text>
      </Pressable>

      {/* Reset */}
      <Pressable
        style={styles.resetButton}
        onPress={resetTimer}
      >
        <Text style={styles.resetButtonText}>
          Reset
        </Text>
      </Pressable>

      {/* Tip */}
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>
            Study Tip
        </Text>

        <Text style={styles.tipText}>
          Put your phone away and focus on one
          task until the timer finishes.
        </Text>
      </View>

      {/* Home */}
      <Pressable
        style={styles.homeButton}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.homeButtonText}>
          ← Back to Home
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 35,
    color: '#4f46e5',
    lineHeight: 38,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  headerSpace: {
    width: 40,
  },

  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },

  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4f46e5',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 35,
  },

  timerText: {
    color: 'white',
    fontSize: 55,
    fontWeight: 'bold',
  },

  timerLabel: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  durationButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  selectedDuration: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },

  durationText: {
    fontWeight: 'bold',
    color: '#555',
  },

  selectedDurationText: {
    color: 'white',
  },

  startButton: {
    backgroundColor: '#4f46e5',
    padding: 17,
    borderRadius: 12,
    marginBottom: 12,
  },

  startButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },

  resetButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  resetButtonText: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    color: '#555',
  },

  tipCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 15,
    marginTop: 25,
  },

  tipTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 7,
  },

  tipText: {
    color: '#666',
    lineHeight: 22,
  },

  homeButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  homeButtonText: {
    textAlign: 'center',
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 16,
  },
});