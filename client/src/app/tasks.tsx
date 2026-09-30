import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { apiRequest, ApiError } from '../utils/api';
import { Task } from '../types';

// Category icons for visual styling
const CATEGORY_ICONS: Record<string, string> = {
  'Home Services': '🏠',
  'Errands & Daily Tasks': '📦',
  'Health & Medical': '🩺',
  'Travel & Tourism': '✈️',
  'Home Maintenance & Repairs': '🛠️',
  'Cleaning & Housekeeping': '🧹',
  'Delivery & Errand Services': '📦',
  'Personal & Care Services': '🤝',
};

export default function TasksScreen() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Confirm step modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch real seeded tasks, categories, and pre-selected tasks from the backend
  const loadData = useCallback(async () => {
    setLoading(true);
    setServerError(null);

    try {
      const [allTasksRes, categoriesRes, selectedRes] = await Promise.all([
        apiRequest<Task[]>('/tasks'),
        apiRequest<string[]>('/tasks/categories'),
        apiRequest<Task[]>('/tasks/selected').catch(() => ({ data: [] })),
      ]);

      const fetchedTasks = allTasksRes.data || [];
      const fetchedCategories = categoriesRes.data || [];

      setTasks(fetchedTasks);
      setCategories(fetchedCategories);

      if (selectedRes?.data && Array.isArray(selectedRes.data) && selectedRes.data.length > 0) {
        const preSelected = new Set(selectedRes.data.map((t) => t.id));
        setSelectedIds(preSelected);

        const firstPickedTask = fetchedTasks.find((t) => preSelected.has(t.id));
        if (firstPickedTask) {
          setExpandedCategory(firstPickedTask.category);
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Failed to load services. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter tasks dynamically based on search query
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

  // Group backend tasks by their database category
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

  // Real selected Task objects from database for confirmation
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

  const handleSaveConfirmed = async () => {
    if (selectedIds.size === 0) {
      setServerError('Please select at least one service before continuing.');
      setShowConfirmModal(false);
      return;
    }

    setSaving(true);
    setServerError(null);

    try {
      await apiRequest<Task[]>('/tasks/select', {
        method: 'POST',
        body: JSON.stringify({ taskIds: Array.from(selectedIds) }),
      });

      setShowConfirmModal(false);
      router.replace('/home');
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Failed to save selected services. Please try again.');
      }
      setShowConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  // 1. Full-screen Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading catalogue from database...</Text>
      </SafeAreaView>
    );
  }

  // 2. Full-screen Error State when initial load fails (No dead end: Retry & Go Back)
  if (serverError && tasks.length === 0) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <View style={styles.stateCard}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={styles.stateTitle}>Failed to Load Catalogue</Text>
          <Text style={styles.stateSubtitle}>{serverError}</Text>
          <Button
            title="Retry Connection"
            onPress={loadData}
            style={{ width: '100%', marginTop: Spacing.md }}
          />
          <TouchableOpacity
            style={styles.stateSecondaryBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.stateSecondaryText}>‹ Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Navigation & Header */}
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

        {/* Server Error Banner */}
        <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />

        {/* Real-time Task Search Bar */}
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

        {/* Category Accordion Cards or Empty Search Result State */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptySearchContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any tasks matching "{searchQuery}". Try a different keyword or clear your search to view all categories.
            </Text>
            <Button
              title="Clear Search"
              variant="outline"
              onPress={() => setSearchQuery('')}
              style={{ marginTop: Spacing.md }}
            />
          </View>
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
                {/* Gold left indicator bar for active category */}
                {isExpanded && <View style={styles.goldIndicator} />}

                {/* Category Header (Tap to expand/collapse) */}
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

                {/* Real Database Services List */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.subSectionLabel}>CHOOSE SERVICES</Text>
                    <View style={styles.serviceCardsContainer}>
                      {categoryTasks.map((task) => {
                        const isSelected = selectedIds.has(task.id);
                        return (
                          <TouchableOpacity
                            key={task.id}
                            activeOpacity={0.7}
                            style={[
                              styles.serviceCard,
                              isSelected && styles.serviceCardSelected,
                            ]}
                            onPress={() => toggleTask(task.id)}
                          >
                            <View style={styles.serviceCardHeader}>
                              <Text
                                style={[
                                  styles.serviceCardTitle,
                                  isSelected && styles.serviceCardTitleSelected,
                                ]}
                              >
                                {task.name}
                              </Text>

                              <View
                                style={[
                                  styles.checkbox,
                                  isSelected && styles.checkboxSelected,
                                ]}
                              >
                                {isSelected && <Text style={styles.checkmark}>✓</Text>}
                              </View>
                            </View>

                            <Text
                              style={[
                                styles.serviceCardDesc,
                                isSelected && styles.serviceCardDescSelected,
                              ]}
                            >
                              {task.description}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
        )}

        {/* Bottom Floating Bar */}
        <View style={styles.bottomBar}>
          <Button
            title={selectedIds.size > 0 ? `Continue (${selectedIds.size} selected)` : 'Continue'}
            disabled={selectedIds.size === 0}
            onPress={() => setShowConfirmModal(true)}
          />
        </View>
      </View>

      {/* Confirmation Step Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.badge}>Confirm Selection</Text>
              <Text style={styles.modalTitle}>Confirm your services</Text>
              <Text style={styles.modalSubtitle}>
                You have selected {selectedTaskList.length} service(s) from our catalogue:
              </Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedTaskList.map((t) => (
                <View key={t.id} style={styles.confirmItemCard}>
                  <Text style={styles.confirmItemCategory}>{t.category}</Text>
                  <Text style={styles.confirmItemName}>{t.name}</Text>
                  <Text style={styles.confirmItemDesc}>{t.description}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Confirm & Save"
                loading={saving}
                loadingText="Saving..."
                onPress={handleSaveConfirmed}
              />
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Modify selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: Colors.primary,
    fontWeight: '600',
  },
  emptySearchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500',
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
    backgroundColor: '#EBF5F0', // Soft mint tint from reference image
    borderColor: Colors.primary,
  },
  goldIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.accent, // Golden accent strip from reference image
    zIndex: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxActive: {
    backgroundColor: Colors.primary, // Dark forest green when expanded
  },
  iconText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  categoryTitleWrapper: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  categorySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  catSelectedBadge: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  serviceCardsContainer: {
    gap: 8,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: 14,
  },
  serviceCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 10,
  },
  serviceCardTitleSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  serviceCardDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  serviceCardDescSelected: {
    color: Colors.text,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 46, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    marginBottom: Spacing.md,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  modalScroll: {
    maxHeight: 280,
    marginVertical: Spacing.md,
  },
  confirmItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  confirmItemCategory: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  confirmItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  confirmItemDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  modalActions: {
    marginTop: Spacing.sm,
  },
  modalCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
