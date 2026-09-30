import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'outline';
}

export function EmptyState({
  icon = '📋',
  title,
  subtitle,
  actionText,
  onAction,
  actionVariant = 'primary',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionText && onAction && (
        <Button
          title={actionText}
          variant={actionVariant}
          onPress={onAction}
          style={{ marginTop: Spacing.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginVertical: Spacing.md,
  },
  icon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
