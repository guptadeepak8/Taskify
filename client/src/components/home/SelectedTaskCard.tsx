import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';
import { Task } from '../../types';

interface SelectedTaskCardProps {
  task: Task;
  onRemove: (taskId: string) => void;
}

export function SelectedTaskCard({ task, onRemove }: SelectedTaskCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.bullet} />
      <View style={styles.textWrapper}>
        <Text style={styles.name}>{task.name}</Text>
        <Text style={styles.desc}>{task.description}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => onRemove(task.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={`Remove ${task.name}`}
      >
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    alignSelf: 'center',
  },
  removeBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
