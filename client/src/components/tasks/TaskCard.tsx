import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onToggle: (taskId: string) => void;
}

export function TaskCard({ task, isSelected, onToggle }: TaskCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onToggle(task.id)}
    >
      <View style={styles.header}>
        <Text style={[styles.title, isSelected && styles.titleSelected]}>
          {task.name}
        </Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
      <Text style={[styles.desc, isSelected && styles.descSelected]}>
        {task.description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: 14,
  },
  cardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 10,
  },
  titleSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  desc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  descSelected: {
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
});
