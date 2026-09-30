import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Button } from './Button';

interface ErrorScreenProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export function ErrorScreen({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  secondaryAction,
}: ErrorScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{message}</Text>

        {onRetry && (
          <Button
            title={retryText}
            onPress={onRetry}
            style={{ width: '100%', marginTop: Spacing.md }}
          />
        )}

        {secondaryAction && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={secondaryAction.onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.secondaryText}>{secondaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 380,
  },
  icon: {
    fontSize: 42,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  secondaryBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
