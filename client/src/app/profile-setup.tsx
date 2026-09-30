import React, { useState, useEffect } from 'react';
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
import { getUserData, saveUserData, clearAuthSession } from '../utils/storage';
import { User } from '../types';
import {
  validateName,
  validateIndianPhone,
  validateAddress,
} from '../utils/validation';

export default function ProfileSetupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    address: false,
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Pre-fill existing user info if available from registration
  useEffect(() => {
    getUserData<User>().then((user) => {
      if (user?.name) setName(user.name);
      if (user?.phone) setPhone(user.phone.replace(/^\+91/, ''));
      if (user?.address) setAddress(user.address);
      if (user?.business_name) setBusinessName(user.business_name);
    });
  }, []);

  // Real-time inline validations
  const nameError = touched.name ? validateName(name, true) : null;
  const phoneError = touched.phone ? validateIndianPhone(phone) : null;
  const addressError = touched.address ? validateAddress(address) : null;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSaveProfile = async () => {
    setTouched({ name: true, phone: true, address: true });

    const nErr = validateName(name, true);
    const pErr = validateIndianPhone(phone);
    const aErr = validateAddress(address);

    if (nErr || pErr || aErr) {
      return;
    }

    setServerError(null);
    setLoading(true);

    try {
      const response = await apiRequest<User>('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          business_name: businessName.trim() || undefined,
        }),
      });

      // Update persisted user object with completed profile details
      await saveUserData(response.data);

      // Successfully saved first-login profile -> proceed to task selection
      router.replace('/tasks');
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Failed to save profile details. Please try again.');
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
          {/* Back Navigation */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/home');
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>

          {/* Header section styled exactly after the reference image */}
          <View style={styles.header}>
            <Text style={styles.title}>A few details</Text>
            <Text style={styles.subtitle}>
              Please provide your contact details so we can coordinate visits and deliveries smoothly.
            </Text>
          </View>

          {/* Server Error Banner */}
          <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />

          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Full name"
              placeholder="e.g. Vikram Singh"
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
              label="Indian mobile number"
              placeholder="e.g. 9876543210"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('phone')}
              error={phoneError}
              keyboardType="phone-pad"
            />

            <Input
              label="Address & area"
              placeholder="Flat / Building, Area, City"
              value={address}
              onChangeText={(val) => {
                setAddress(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('address')}
              error={addressError}
              autoCapitalize="sentences"
            />

            <Input
              label="Business name (optional)"
              placeholder="e.g. Singh Electric Works"
              value={businessName}
              onChangeText={(val) => {
                setBusinessName(val);
                if (serverError) setServerError(null);
              }}
              autoCapitalize="words"
            />

            {/* Primary Action Button (Matches "Saving..." state in reference image) */}
            <View style={styles.actionContainer}>
              <Button
                title="Save details"
                loading={loading}
                loadingText="Saving..."
                onPress={handleSaveProfile}
              />

              <TouchableOpacity
                style={{ marginTop: Spacing.md, alignItems: 'center', paddingVertical: 8 }}
                onPress={async () => {
                  await clearAuthSession();
                  router.replace('/login');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 14, color: Colors.textMuted, fontWeight: '500' }}>
                  Sign out and use another account
                </Text>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
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
});
