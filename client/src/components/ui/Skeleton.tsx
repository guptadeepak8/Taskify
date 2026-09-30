import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function HomeSkeleton() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View>
          <Skeleton width={110} height={24} borderRadius={6} />
          <Skeleton width={140} height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={42} height={42} borderRadius={21} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Skeleton width={160} height={20} borderRadius={6} />
            <Skeleton width={110} height={13} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={96} height={34} borderRadius={17} />
        </View>

        <View style={styles.cardsList}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.card}>
              <View style={styles.cardHeader}>
                <Skeleton width={90} height={18} borderRadius={9} />
                <Skeleton width={24} height={24} borderRadius={12} />
              </View>
              <Skeleton width="70%" height={18} borderRadius={6} style={{ marginTop: 12 }} />
              <Skeleton width="100%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

export function TasksSkeleton() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Skeleton width={60} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
        <Skeleton width={230} height={26} borderRadius={6} />
        <Skeleton width="85%" height={14} borderRadius={4} style={{ marginTop: 6, marginBottom: 16 }} />

        <Skeleton width="100%" height={48} borderRadius={12} style={{ marginBottom: 16 }} />

        <View style={styles.cardsList}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.categoryCard}>
              <View style={styles.categoryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Skeleton width={44} height={44} borderRadius={12} style={{ marginRight: 14 }} />
                  <View>
                    <Skeleton width={150} height={18} borderRadius={6} />
                    <Skeleton width={90} height={13} borderRadius={4} style={{ marginTop: 6 }} />
                  </View>
                </View>
                <Skeleton width={20} height={20} borderRadius={10} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Skeleton width="100%" height={48} borderRadius={12} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  skeleton: {
    backgroundColor: '#E2E8F0',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardsList: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 24,
  },
});
