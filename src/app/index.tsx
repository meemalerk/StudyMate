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

type Task = {
  id: number;
  title: string;
  date: string;
  completed: boolean;
};

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Complete AI Assignment',
      date: 'Due tomorrow',
      completed: false,
    },
    {
      id: 2,
      title: 'Study Cybersecurity',
      date: 'Due Friday',
      completed: false,
    },
    {
      id: 3,
      title: 'Finish Project Report',
      date: 'Completed',
      completed: true,
    },
  ]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newDate, setNewDate] = useState('');

  const addTask = () => {
    if (newTask.trim() === '') {
      return;
    }

    const task: Task = {
      id: Date.now(),
      title: newTask,
      date: newDate || 'No due date',
      completed: false,
    };

    setTasks([...tasks, task]);

    setNewTask('');
    setNewDate('');
    setShowAddTask(false);
  };

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks(
      tasks.filter((task) => task.id !== id)
    );
  };

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedTasks / tasks.length) * 100
        );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          

          <Text style={styles.title}>
            StudyMate
          </Text>
        </View>

        <Text style={styles.profile}>👤</Text>
      </View>

      <Text style={styles.subtitle}>
        Stay organised. Stay focused.
      </Text>

      {/* Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>
          Today's Progress
        </Text>

        <Text style={styles.progressNumber}>
          {progress}%
        </Text>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {completedTasks} of {tasks.length} tasks completed
        </Text>
      </View>

      {/* Quick Access */}
      <Text style={styles.sectionTitle}>
        Quick Access
      </Text>

      <Pressable
        style={styles.quickCard}
        onPress={() => router.push('/subjects')}
      >
        <Text style={styles.quickIcon}>
        </Text>

        <View>
          <Text style={styles.quickTitle}>
            Subjects
          </Text>

          <Text style={styles.quickText}>
            View your subjects
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.quickCard}
        onPress={() => router.push('/timer')}
      >
        <Text style={styles.quickIcon}>
        </Text>

        <View>
          <Text style={styles.quickTitle}>
            Study Timer
          </Text>

          <Text style={styles.quickText}>
            Start a study session
          </Text>
        </View>
      </Pressable>

      {/* Tasks */}
      <View style={styles.taskHeader}>
        <Text style={styles.sectionTitle}>
          My Tasks
        </Text>

        <Pressable
          style={styles.smallAddButton}
          onPress={() =>
            setShowAddTask(!showAddTask)
          }
        >
          <Text style={styles.smallAddButtonText}>
            + Add
          </Text>
        </Pressable>
      </View>

      {/* Add Task */}
      {showAddTask && (
        <View style={styles.addTaskCard}>
          <Text style={styles.inputLabel}>
            Task name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter task name"
            value={newTask}
            onChangeText={setNewTask}
          />

          <Text style={styles.inputLabel}>
            Due date
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: Due Friday"
            value={newDate}
            onChangeText={setNewDate}
          />

          <View style={styles.formButtons}>
            <Pressable
              style={styles.cancelButton}
              onPress={() =>
                setShowAddTask(false)
              }
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={styles.saveButton}
              onPress={addTask}
            >
              <Text style={styles.saveText}>
                Add Task
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
          </Text>

          <Text style={styles.emptyTitle}>
            No tasks yet
          </Text>

          <Text style={styles.emptyText}>
            Add your first study task to get started.
          </Text>
        </View>
      ) : (
        tasks.map((task) => (
          <View
            style={styles.taskCard}
            key={task.id}
          >
            <Pressable
              style={styles.taskMain}
              onPress={() =>
                toggleTask(task.id)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  task.completed &&
                    styles.checkboxCompleted,
                ]}
              >
                {task.completed && (
                  <Text style={styles.checkmark}>
                    ✓
                  </Text>
                )}
              </View>

              <View style={styles.taskInfo}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.completed &&
                      styles.completedTaskTitle,
                  ]}
                >
                  {task.title}
                </Text>

                <Text style={styles.taskDate}>
                  {task.completed
                    ? 'Completed'
                    : task.date}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                deleteTask(task.id)
              }
            >
              <Text style={styles.deleteButton}>
                🗑️
              </Text>
            </Pressable>
          </View>
        ))
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
  },

  greeting: {
    fontSize: 16,
    color: '#666',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 3,
  },

  profile: {
    fontSize: 30,
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    marginBottom: 25,
  },

  progressCard: {
    backgroundColor: '#4f46e5',
    borderRadius: 18,
    padding: 22,
    marginBottom: 30,
  },

  progressTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  progressNumber: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
  },

  progressBackground: {
    height: 10,
    backgroundColor: '#c7d2fe',
    borderRadius: 10,
    marginTop: 10,
  },

  progressBar: {
    height: 10,
    backgroundColor: 'white',
    borderRadius: 10,
  },

  progressText: {
    color: 'white',
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  quickCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 15,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quickIcon: {
    fontSize: 30,
    marginRight: 15,
  },

  quickTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  quickText: {
    color: '#666',
    marginTop: 5,
  },

  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },

  smallAddButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 10,
  },

  smallAddButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  addTaskCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },

  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },

  cancelButton: {
    padding: 12,
  },

  cancelText: {
    color: '#666',
    fontWeight: 'bold',
  },

  saveButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  saveText: {
    color: 'white',
    fontWeight: 'bold',
  },

  taskCard: {
    backgroundColor: 'white',
    padding: 17,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  taskMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  checkboxCompleted: {
    backgroundColor: '#4f46e5',
  },

  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },

  taskInfo: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#888',
  },

  taskDate: {
    color: '#666',
    marginTop: 5,
  },

  deleteButton: {
    fontSize: 20,
    marginLeft: 10,
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
});