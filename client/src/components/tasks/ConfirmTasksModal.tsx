import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Task } from '../../types';

interface ConfirmTasksModalProps {
  visible: boolean;
  selectedTasks: Task[];
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmTasksModal({
  visible,
  selectedTasks,
  saving,
  onConfirm,
  onCancel,
}: ConfirmTasksModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.badge}>Confirm Selection</Text>
            <Text style={styles.modalTitle}>Confirm your services</Text>
            <Text style={styles.modalSubtitle}>
              You have selected {selectedTasks.length} service(s) from our catalogue:
            </Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {selectedTasks.map((t) => (
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
              onPress={onConfirm}
            />
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={styles.modalCancelText}>Modify selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
