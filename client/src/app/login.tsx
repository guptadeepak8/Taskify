import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../constants/theme';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { apiRequest, ApiError } from '../utils/api';
import { saveToken, saveUserData } from '../utils/storage';
import { LoginResponse } from '../types';
import { validateEmail } from '../utils/validation';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Inline validations
  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password && !password.trim() ? 'Password is required' : null;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleLogin = async () => {
    setTouched({ email: true, password: true });

    const eErr = validateEmail(email);
    const pErr = !password.trim() ? 'Password is required' : null;

    if (eErr || pErr) {
      return;
    }

    setServerError(null);
    setLoading(true);

    try {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const { token, user } = response.data;

      // Persist session securely for returning app sessions
      await saveToken(token);
      await saveUserData(user);

      // Check if user has completed profile setup (phone & address)
      if (!user.phone || !user.address) {
        router.replace('/profile-setup');
      } else {
        router.replace('/home');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // If unverified, guide directly to OTP verification
        if (error.code === 'EMAIL_NOT_VERIFIED') {
          router.push({
            pathname: '/verify-otp',
            params: { email: email.trim().toLowerCase(), reason: 'unverified' },
          });
          return;
        }
        setServerError(error.message);
      } else {
        setServerError('Unable to log in. Please check your credentials or network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header section styled after the reference design */}
          <View style={styles.header}>
            <Text style={styles.title}>Log in to Taskify</Text>
            <Text style={styles.subtitle}>
              Enter your credentials to access your scheduled tasks and home services.
            </Text>
          </View>

          {/* Server Error Banner */}
          <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />

          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Email address"
              placeholder="name@example.com"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('email')}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('password')}
              error={passwordError}
              isPassword
            />

            {/* Action Button (Sage Green from Reference Image) */}
            <View style={styles.actionContainer}>
              <Button
                title="Log in"
                loading={loading}
                loadingText="Logging in..."
                onPress={handleLogin}
              />
            </View>

            {/* Switch to Register */}
            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/register')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  actionContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
});
