import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorScreen } from '../components/ui/ErrorScreen';
import { EmptyState } from '../components/ui/EmptyState';
import { SelectedTaskCard } from '../components/home/SelectedTaskCard';
import { ProfileModal } from '../components/home/ProfileModal';
import { apiRequest } from '../utils/api';
import { clearAuthSession, getUserData } from '../utils/storage';
import { User, Task } from '../types';

export default function HomeScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cachedUser, tasksRes] = await Promise.all([
        getUserData<User>(),
        apiRequest<Task[]>('/tasks/selected'),
      ]);

      if (cachedUser) setUser(cachedUser);
      setSelectedTasks(tasksRes.data || []);
    } catch (e: any) {
      if (e?.code === 'UNAUTHORIZED' || e?.status === 401) {
        await clearAuthSession();
        router.replace('/login');
        return;
      }
      setError(e?.message || 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    setShowProfileModal(false);
    await clearAuthSession();
    router.replace('/login');
  };

  const handleRemoveTask = async (taskId: string) => {
    setSelectedTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await apiRequest(`/tasks/selected/${taskId}`, { method: 'DELETE' });
    } catch {
      loadData();
    }
  };

  // Group selected tasks by category
  const groupedSelected = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of selectedTasks) {
      if (!map[task.category]) map[task.category] = [];
      map[task.category].push(task);
    }
    return map;
  }, [selectedTasks]);

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  // 1. Loading State
  if (loading) {
    return <LoadingScreen message="Loading your services..." />;
  }

  // 2. Error State (No dead end: Try Again & Sign Out)
  if (error) {
    return (
      <ErrorScreen
        title="Unable to Load Services"
        message={error}
        onRetry={loadData}
        retryText="Try Again"
        secondaryAction={{
          label: 'Sign Out',
          onPress: handleLogout,
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar with Brand & Profile Icon */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandTitle}>Taskify</Text>
          <Text style={styles.brandSubtitle}>Home & Local Services</Text>
        </View>

        {/* Right Corner Profile Icon Button */}
        <TouchableOpacity
          style={styles.profileIconButton}
          onPress={() => setShowProfileModal(true)}
          activeOpacity={0.8}
          accessibilityLabel="Open Account and Profile"
        >
          <Text style={styles.profileIconText}>{userInitial}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header with + Add Tasks */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your Selected Tasks</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedTasks.length} active service{selectedTasks.length === 1 ? '' : 's'}
            </Text>
          </View>
          {selectedTasks.length > 0 && (
            <TouchableOpacity
              style={styles.addTasksBtn}
              onPress={() => router.push('/tasks')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.addTasksBtnText}>+ Add Tasks</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Task List or Empty State */}
        {selectedTasks.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No tasks selected yet"
            subtitle="Browse through our catalogue and pick the tasks you need assistance with."
            actionText="Explore Task Catalogue"
            onAction={() => router.push('/tasks')}
          />
        ) : (
          Object.entries(groupedSelected).map(([category, items]) => (
            <View key={category} style={styles.categoryBlock}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {items.map((item) => (
                <SelectedTaskCard
                  key={item.id}
                  task={item}
                  onRemove={handleRemoveTask}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Profile & Account Modal */}
      <ProfileModal
        visible={showProfileModal}
        user={user}
        onClose={() => setShowProfileModal(false)}
        onEditProfile={() => {
          setShowProfileModal(false);
          router.push('/profile-setup');
        }}
        onSignOut={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  profileIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  profileIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addTasksBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  addTasksBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryBlock: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: Spacing.sm,
  },
});
