import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { clearAuthSession, getUserData } from '../utils/storage';
import { User } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getUserData<User>().then(setUser);
  }, []);

  const handleLogout = async () => {
    await clearAuthSession();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.badge}>Welcome</Text>
        <Text style={styles.title}>Home Dashboard</Text>
        <Text style={styles.subtitle}>
          Logged in as {user?.email || 'User'}. Your session is active and persisted.
        </Text>
        <Button
          title="Log out"
          variant="outline"
          onPress={handleLogout}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    justifyContent: 'center',
    flex: 1,
  },
  badge: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
  },
});
