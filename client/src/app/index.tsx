import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, getUserData } from '../utils/storage';
import { Colors } from '../constants/theme';
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
        <ActivityIndicator size="large" color={Colors.primary} />
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
  },
});
