import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Task } from '../../types';

interface DeleteTaskModalProps {
  visible: boolean;
  task: Task | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTaskModal({
  visible,
  task,
  deleting,
  onConfirm,
  onCancel,
}: DeleteTaskModalProps) {
  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Top warning icon & title */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🗑️</Text>
            </View>
            <View style={styles.titleWrapper}>
              <Text style={styles.modalTitle}>Remove Service?</Text>
              <Text style={styles.modalSubtitle}>
                Are you sure you want to remove this task from your selected list?
              </Text>
            </View>
          </View>

          {/* Task preview card */}
          <View style={styles.taskPreviewCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{task.category}</Text>
            </View>
            <Text style={styles.taskName}>{task.name}</Text>
            <Text style={styles.taskDesc} numberOfLines={3}>
              {task.description}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Button
              title="Remove Task"
              variant="danger"
              loading={deleting}
              loadingText="Removing..."
              onPress={onConfirm}
            />

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={deleting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelBtnText}>Keep Service</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 46, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.errorLight,
    borderWidth: 1.5,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconText: {
    fontSize: 26,
  },
  titleWrapper: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  taskPreviewCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
