import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { TasksSkeleton } from '../components/ui/Skeleton';
import { ErrorScreen } from '../components/ui/ErrorScreen';
import { EmptyState } from '../components/ui/EmptyState';
import { TaskCard } from '../components/tasks/TaskCard';
import { ConfirmTasksModal } from '../components/tasks/ConfirmTasksModal';
import { apiRequest, ApiError } from '../utils/api';
import { Task } from '../types';

const CATEGORY_ICONS: Record<string, string> = {
  'Home Services': '🏠',
  'Errands & Daily Tasks': '📦',
  'Health & Medical': '🩺',
  'Travel & Tourism': '✈️',
};

export default function TasksScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery<Task[]>({
    queryKey: ['catalogueTasks'],
    queryFn: async () => {
      const res = await apiRequest<Task[]>('/tasks');
      return res.data || [];
    },
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<string[]>({
    queryKey: ['catalogueCategories'],
    queryFn: async () => {
      const res = await apiRequest<string[]>('/tasks/categories');
      return res.data || [];
    },
  });

  const { data: serverSelected = [] } = useQuery<Task[]>({
    queryKey: ['selectedTasks'],
    queryFn: async () => {
      const res = await apiRequest<Task[]>('/tasks/selected');
      return res.data || [];
    },
  });

  if (!hasInitializedSelection && serverSelected.length > 0) {
    const preSelected = new Set(serverSelected.map((t) => t.id));
    setSelectedIds(preSelected);

    if (!expandedCategory && tasks.length > 0) {
      const firstPicked = tasks.find((t) => preSelected.has(t.id));
      if (firstPicked) {
        setExpandedCategory(firstPicked.category);
      }
    }
    setHasInitializedSelection(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest<Task[]>('/tasks/select', {
        method: 'POST',
        body: JSON.stringify({ taskIds: ids }),
      });
      return res.data || [];
    },
    onSuccess: (updatedTasks) => {
      queryClient.setQueryData(['selectedTasks'], updatedTasks);
      setShowConfirmModal(false);
      router.replace('/home');
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Failed to save selected services. Please try again.');
      }
      setShowConfirmModal(false);
    },
  });

  const filteredTasks = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
    );
  }, [tasks, searchQuery]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const cat of categories) {
      groups[cat] = [];
    }
    for (const task of filteredTasks) {
      if (!groups[task.category]) groups[task.category] = [];
      groups[task.category].push(task);
    }
    return groups;
  }, [filteredTasks, categories]);

  const selectedTaskList = useMemo(() => {
    return tasks.filter((t) => selectedIds.has(t.id));
  }, [tasks, selectedIds]);

  const toggleTask = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSaveConfirmed = () => {
    if (selectedIds.size === 0) {
      setServerError('Please select at least one service before continuing.');
      setShowConfirmModal(false);
      return;
    }
    setServerError(null);
    saveMutation.mutate(Array.from(selectedIds));
  };

  if ((isTasksLoading || isCategoriesLoading) && tasks.length === 0) {
    return <TasksSkeleton />;
  }

  if (isTasksError && tasks.length === 0) {
    return (
      <ErrorScreen
        title="Failed to Load Catalogue"
        message={(tasksError as Error)?.message || 'Failed to load services. Please check your internet connection.'}
        onRetry={() => refetchTasks()}
        retryText="Retry Connection"
        secondaryAction={{
          label: '‹ Go Back',
          onPress: () => router.back(),
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>What do you need help with?</Text>
          <Text style={styles.subtitle}>
            Pick a category, then choose your services. You can add details next.
          </Text>
        </View>

        <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks (e.g. plumbing, cleaning, courier)..."
            placeholderTextColor={Colors.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No services found"
            subtitle={`We couldn't find any tasks matching "${searchQuery}". Try a different keyword or clear your search to view all categories.`}
            actionText="Clear Search"
            actionVariant="outline"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((category) => {
              const isExpanded = expandedCategory === category || searchQuery.trim().length > 0;
              const categoryTasks = groupedTasks[category] || [];
              const icon = CATEGORY_ICONS[category] || '📋';
              const selectedInCatCount = categoryTasks.filter((t) => selectedIds.has(t.id)).length;

              return (
                <View
                  key={category}
                  style={[
                    styles.cardWrapper,
                    isExpanded && styles.cardWrapperExpanded,
                  ]}
                >
                  {isExpanded && <View style={styles.goldIndicator} />}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.categoryHeader}
                    onPress={() =>
                      setExpandedCategory((prev) => (prev === category ? null : category))
                    }
                  >
                    <View
                      style={[
                        styles.iconBox,
                        isExpanded && styles.iconBoxActive,
                      ]}
                    >
                      <Text style={styles.iconText}>
                        {selectedInCatCount > 0 ? '✓' : icon}
                      </Text>
                    </View>

                    <View style={styles.categoryTitleWrapper}>
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text style={styles.categorySubtitle}>
                        {categoryTasks.length} services available
                      </Text>
                    </View>

                    {selectedInCatCount > 0 && (
                      <View style={styles.catSelectedBadge}>
                        <Text style={styles.catSelectedBadgeText}>{selectedInCatCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.subSectionLabel}>CHOOSE SERVICES</Text>
                      <View style={styles.serviceCardsContainer}>
                        {categoryTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isSelected={selectedIds.has(task.id)}
                            onToggle={toggleTask}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.bottomBar}>
          <Button
            title={selectedIds.size > 0 ? `Continue (${selectedIds.size} selected)` : 'Continue'}
            disabled={selectedIds.size === 0}
            loading={saveMutation.isPending}
            loadingText="Saving services..."
            onPress={() => setShowConfirmModal(true)}
          />
        </View>
      </View>

      <ConfirmTasksModal
        visible={showConfirmModal}
        selectedTasks={selectedTaskList}
        saving={saveMutation.isPending}
        onConfirm={handleSaveConfirmed}
        onCancel={() => setShowConfirmModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  clearSearch: {
    color: Colors.textSubtle,
    fontSize: 16,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 95,
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardWrapperExpanded: {
    backgroundColor: '#EBF5F0',
    borderColor: Colors.primary,
  },
  goldIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.accent,
    zIndex: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxActive: {
    backgroundColor: Colors.primary,
  },
  iconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  categoryTitleWrapper: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  catSelectedBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  catSelectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  subSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  serviceCardsContainer: {
    gap: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
});
