import { router } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function SubjectsScreen() {
  const [subjects, setSubjects] = useState([
    'Artificial Intelligence',
    'Cybersecurity',
    'Database Systems',
  ]);

  const [newSubject, setNewSubject] = useState('');

  const addSubject = () => {
    if (newSubject.trim() === '') {
      return;
    }

    setSubjects([
      ...subjects,
      newSubject.trim(),
    ]);

    setNewSubject('');
  };

  const deleteSubject = (subject: string) => {
    setSubjects(
      subjects.filter(
        (item) => item !== subject
      )
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
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
          Subjects
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <Text style={styles.subtitle}>
        Manage your study subjects
      </Text>

      {/* Add Subject */}
      <View style={styles.addCard}>
        <Text style={styles.inputLabel}>
          New Subject
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter subject name"
          value={newSubject}
          onChangeText={setNewSubject}
        />

        <Pressable
          style={styles.addButton}
          onPress={addSubject}
        >
          <Text style={styles.addButtonText}>
            + Add Subject
          </Text>
        </Pressable>
      </View>

      {/* Subject List */}
      <Text style={styles.sectionTitle}>
        My Subjects
      </Text>

      {subjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
          </Text>

          <Text style={styles.emptyTitle}>
            No subjects yet
          </Text>

          <Text style={styles.emptyText}>
            Add a subject to get started.
          </Text>
        </View>
      ) : (
        subjects.map((subject) => (
          <View
            style={styles.subjectCard}
            key={subject}
          >
            <Text style={styles.subjectIcon}>
            </Text>

            <Text style={styles.subjectName}>
              {subject}
            </Text>

            <Pressable
              onPress={() =>
                deleteSubject(subject)
              }
            >
              <Text style={styles.deleteButton}>
                🗑️
              </Text>
            </Pressable>
          </View>
        ))
      )}

      {/* Home Button */}
      <Pressable
        style={styles.homeButton}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.homeButtonText}>
          ← Back to Home
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 25,
  },

  addCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 15,
    marginBottom: 30,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },

  addButton: {
    backgroundColor: '#4f46e5',
    padding: 13,
    borderRadius: 10,
  },

  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  subjectCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  subjectIcon: {
    fontSize: 25,
    marginRight: 15,
  },

  subjectName: {
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
  },

  deleteButton: {
    fontSize: 20,
  },

  emptyCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },

  homeButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
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