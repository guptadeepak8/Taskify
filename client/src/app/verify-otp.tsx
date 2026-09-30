import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { apiRequest, ApiError } from '../utils/api';
import { saveToken, saveUserData } from '../utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { VerifyOtpResponse } from '../types';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ email?: string; reason?: string }>();
  const email = (params.email || '').trim().toLowerCase();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    params.reason === 'unverified'
      ? 'Please verify your email address to continue.'
      : null
  );

  const [countdown, setCountdown] = useState(30);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleaned);
    if (serverError) setServerError(null);
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setServerError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setServerError('Missing email address. Please register or log in again.');
      return;
    }

    setServerError(null);
    setLoading(true);

    try {
      const response = await apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp: code }),
      });

      const { token, user } = response.data;

      queryClient.clear();
      await saveToken(token);
      await saveUserData(user);
      queryClient.setQueryData(['userProfile'], user);

      router.replace('/profile-setup');
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Verification failed. Please check the code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setServerError(null);
    setSuccessMessage(null);
    setResending(true);

    try {
      const response = await apiRequest<{ message: string }>('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      setSuccessMessage(response.message || 'A new code has been sent to your email.');
      setOtp('');
      setCountdown(30);
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
        if (error.code === 'RESEND_COOLDOWN' && error.details && (error.details as any).retryAfter) {
          setCountdown((error.details as any).retryAfter);
        }
      } else {
        setServerError('Unable to resend verification code. Please try again.');
      }
    } finally {
      setResending(false);
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
            <Text style={styles.badge}>Email Verification</Text>
            <Text style={styles.title}>Enter 6-digit code</Text>
            <Text style={styles.subtitle}>
              We sent a verification code to{' '}
              <Text style={styles.emailHighlight}>{email || 'your email'}</Text>. Enter the code below
              to activate your account.
            </Text>
          </View>

          {successMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />

          <Pressable style={styles.otpContainer} onPress={() => inputRef.current?.focus()}>
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const digit = otp[index] || '';
              const isCurrent = otp.length === index;
              const isFilled = digit !== '';
              const hasError = Boolean(serverError);

              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFilled && styles.otpBoxFilled,
                    isCurrent && styles.otpBoxFocused,
                    hasError && styles.otpBoxError,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={otp}
            onChangeText={(val) => {
              handleOtpChange(val);
              if (val.length === 6) {
                handleVerify(val);
              }
            }}
            keyboardType="number-pad"
            maxLength={6}
            textContentType="oneTimeCode"
            autoFocus
          />

          <View style={styles.actionContainer}>
            <Button
              title="Verify & Continue"
              loading={loading}
              loadingText="Verifying..."
              disabled={otp.length !== 6}
              onPress={() => handleVerify()}
            />
          </View>

          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Resend code in <Text style={styles.countdownNumber}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={resending}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.resendLink}>
                  {resending ? 'Sending...' : 'Resend verification code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footerLinkContainer}>
            <TouchableOpacity
              onPress={() => router.replace('/login')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backLink}>Back to log in</Text>
            </TouchableOpacity>
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
  emailHighlight: {
    color: Colors.text,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  successText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    width: '100%',
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxFocused: {
    borderColor: Colors.borderFocus,
    borderWidth: 2,
  },
  otpBoxError: {
    borderColor: Colors.error,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  actionContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  countdownText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  countdownNumber: {
    fontWeight: '600',
    color: Colors.text,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  footerLinkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  backLink: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
