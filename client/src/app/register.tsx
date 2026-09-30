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
import { RegisterResponse } from '../types';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
} from '../utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const nameError = touched.name ? validateName(name) : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmPasswordError = touched.confirmPassword
    ? validateConfirmPassword(password, confirmPassword)
    : null;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRegister = async () => {
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cpErr = validateConfirmPassword(password, confirmPassword);

    if (nErr || eErr || pErr || cpErr) {
      return;
    }

    setServerError(null);
    setLoading(true);

    try {
      const response = await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      });
      router.push({
        pathname: '/verify-otp',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Something went wrong. Please try again.');
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

          <View style={styles.header}>
            <Text style={styles.badge}>Get Started</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Register with Taskify to coordinate neighborhood home services and tasks seamlessly.
            </Text>
          </View>

          <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />
          <View style={styles.form}>
            <Input
              label="Full name (optional)"
              placeholder="e.g. Aarav Sharma"
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('name')}
              error={nameError}
              autoCapitalize="words"
            />

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
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('password')}
              error={passwordError}
              isPassword
            />

            <Input
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('confirmPassword')}
              error={confirmPasswordError}
              isPassword
            />

            <View style={styles.actionContainer}>
              <Button
                title="Create account"
                loading={loading}
                loadingText="Creating account..."
                onPress={handleRegister}
              />
            </View>

            {/* Login Link */}
            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.loginLink}>Log in</Text>
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
  badge: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
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
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
});
