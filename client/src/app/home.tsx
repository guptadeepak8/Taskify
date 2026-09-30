import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { HomeSkeleton } from '../components/ui/Skeleton';
import { ErrorScreen } from '../components/ui/ErrorScreen';
import { EmptyState } from '../components/ui/EmptyState';
import { SelectedTaskCard } from '../components/home/SelectedTaskCard';
import { ProfileModal } from '../components/home/ProfileModal';
import { apiRequest } from '../utils/api';
import { clearAuthSession, getUserData } from '../utils/storage';
import { User, Task } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { data: user } = useQuery<User | null>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const u = await getUserData<User>();
      return u || null;
    },
  });

  const {
    data: selectedTasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ['selectedTasks'],
    queryFn: async () => {
      try {
        const res = await apiRequest<Task[]>('/tasks/selected');
        return res.data || [];
      } catch (err: any) {
        if (err?.code === 'UNAUTHORIZED' || err?.status === 401) {
          queryClient.clear();
          await clearAuthSession();
          router.replace('/login');
          return [];
        }
        throw err;
      }
    },
  });

  const removeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest(`/tasks/selected/${taskId}`, { method: 'DELETE' });
      return taskId;
    },
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: ['selectedTasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['selectedTasks']) || [];
      queryClient.setQueryData<Task[]>(['selectedTasks'], (old = []) =>
        old.filter((t) => t.id !== taskId)
      );
      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['selectedTasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['selectedTasks'] });
    },
  });

  const handleLogout = async () => {
    setShowProfileModal(false);
    queryClient.clear();
    await clearAuthSession();
    router.replace('/login');
  };

  const handleRemoveTask = (taskId: string) => {
    removeTaskMutation.mutate(taskId);
  };

  const groupedSelected = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of selectedTasks) {
      if (!map[task.category]) map[task.category] = [];
      map[task.category].push(task);
    }
    return map;
  }, [selectedTasks]);

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  if (isLoading && selectedTasks.length === 0) {
    return <HomeSkeleton />;
  }

  if (isError && selectedTasks.length === 0) {
    return (
      <ErrorScreen
        title="Unable to Load Services"
        message={(error as Error)?.message || 'Unable to connect to the server. Please check your internet connection.'}
        onRetry={() => refetch()}
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
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandTitle}>Taskify</Text>
          <Text style={styles.brandSubtitle}>Home & Local Services</Text>
        </View>

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

      <ProfileModal
        visible={showProfileModal}
        user={user ?? null}
        onClose={() => setShowProfileModal(false)}
        onEditProfile={() => {
          setShowProfileModal(false);
          router.push({
            pathname: '/profile-setup',
            params: { from: 'home' },
          });
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
