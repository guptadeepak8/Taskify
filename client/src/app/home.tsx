import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Button } from '../components/ui/Button';
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
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your services...</Text>
      </SafeAreaView>
    );
  }

  // 2. Error State (No dead end: Try Again & Sign Out)
  if (error) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <View style={styles.stateCard}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={styles.stateTitle}>Unable to Load Services</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <Button
            title="Try Again"
            onPress={loadData}
            style={{ width: '100%', marginTop: Spacing.md }}
          />
          <TouchableOpacity
            style={styles.stateSecondaryBtn}
            onPress={handleLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.stateSecondaryText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
        

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your Selected Tasks</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedTasks.length} active service{selectedTasks.length === 1 ? '' : 's'}
            </Text>
          </View>
          {selectedTasks.length > 0 && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/tasks')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.editBtnText}>Modify Tasks</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Task List or Empty State */}
        {selectedTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No tasks selected yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse through our catalogue and pick the tasks you need assistance with.
            </Text>
            <Button
              title="Explore Task Catalogue"
              onPress={() => router.push('/tasks')}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        ) : (
          <>
            {Object.entries(groupedSelected).map(([category, items]) => (
              <View key={category} style={styles.categoryBlock}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.taskCard}>
                    <View style={styles.taskBullet} />
                    <View style={styles.taskTextWrapper}>
                      <Text style={styles.taskName}>{item.name}</Text>
                      <Text style={styles.taskDesc}>{item.description}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeTaskBtn}
                      onPress={() => handleRemoveTask(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={`Remove ${item.name}`}
                    >
                      <Text style={styles.removeTaskBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            {/* Bottom Modify Action - Only visible when tasks exist */}
            <View style={styles.actionsContainer}>
              <Button
                title="Add or Change Tasks"
                variant="primary"
                onPress={() => router.push('/tasks')}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Profile & Account Modal (Triggered by Top Right Icon) */}
      <Modal
        visible={showProfileModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowProfileModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalTopRow}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>{userInitial}</Text>
              </View>
              <View style={styles.modalUserMeta}>
                <Text style={styles.modalUserName}>{user?.name || 'User Profile'}</Text>
                <Text style={styles.modalUserEmail}>{user?.email || ''}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* Profile Information List */}
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionHeading}>Account Details</Text>

              {user?.phone ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              ) : null}

              {user?.address ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{user.address}</Text>
                </View>
              ) : null}

              {user?.business_name ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Business</Text>
                  <Text style={styles.infoValue}>{user.business_name}</Text>
                </View>
              ) : null}
            </View>

            {/* Actions: Edit Profile & Sign out */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => {
                  setShowProfileModal(false);
                  router.push('/profile-setup');
                }}
              >
                <Text style={styles.editProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleLogout}
              >
                <Text style={styles.signOutBtnText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 380,
  },
  stateIcon: {
    fontSize: 42,
    marginBottom: Spacing.sm,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  stateSecondaryBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  stateSecondaryText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500',
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
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  userSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
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
  editBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  editBtnText: {
    fontSize: 13,
    color: Colors.primaryDark,
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
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  taskBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: 12,
  },
  taskTextWrapper: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  removeTaskBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    alignSelf: 'center',
  },
  removeTaskBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginVertical: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  actionsContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  // Profile Popup Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 46, 0.45)',
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  modalUserMeta: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  modalUserEmail: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  closeIcon: {
    fontSize: 18,
    color: Colors.textMuted,
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  infoSection: {
    marginBottom: Spacing.md,
  },
  infoSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
    width: 70,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  modalActions: {
    marginTop: Spacing.sm,
    gap: 8,
  },
  editProfileBtn: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  editProfileBtnText: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  signOutBtnText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
