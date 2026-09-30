import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, getUserData } from '../utils/storage';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import LoginScreen from './login';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        if (token) {
          setHasToken(true);
          const user = await getUserData();
          if (user && (!user.phone || !user.address)) {
            router.replace('/profile-setup');
          } else {
            router.replace('/home');
          }
          return;
        }
      } catch (e) {
        console.error('Error restoring session:', e);
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  if (checking || hasToken) {
    return (
      <View style={styles.splash}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <Text style={styles.brandTitle}>Taskify</Text>
          <Text style={styles.brandSubtitle}>Your Neighbourhood Services</Text>
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return <LoginScreen />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoLetter: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.md,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    letterSpacing: 0.2,
  },
  spinner: {
    marginTop: Spacing.xl,
  },
});
