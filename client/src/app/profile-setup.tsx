import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '../constants/theme';
import { CommonStyles } from '../constants/commonStyles';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { apiRequest, ApiError } from '../utils/api';
import { getUserData, saveUserData, clearAuthSession } from '../utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import {
  validateName,
  validateIndianPhone,
  validateAddress,
} from '../utils/validation';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ from?: string }>();

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

  useEffect(() => {
    getUserData<User>().then((user) => {
      if (user?.name) setName(user.name);
      if (user?.phone) setPhone(user.phone.replace(/^\+91/, ''));
      if (user?.address) setAddress(user.address);
      if (user?.business_name) setBusinessName(user.business_name);
    });
  }, []);

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

      await saveUserData(response.data);
      queryClient.setQueryData(['userProfile'], response.data);

      if (params.from === 'home' || router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tasks');
      }
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
    <SafeAreaView style={CommonStyles.safeArea}>
      <KeyboardAvoidingView
        style={CommonStyles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={CommonStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={CommonStyles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/home');
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={CommonStyles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={CommonStyles.header}>
            <Text style={CommonStyles.title}>A few details</Text>
            <Text style={CommonStyles.subtitle}>
              Please provide your contact details so we can coordinate visits and deliveries smoothly.
            </Text>
          </View>
          <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />

          <View style={CommonStyles.form}>
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
              label="Mobile Number"
              placeholder="98765 43210"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('phone')}
              error={phoneError}
              keyboardType="phone-pad"
              prefix="+91"
              maxLength={10}
            />

            <Input
              label="Address & area"
              placeholder="Flat / Building, Road, Area, City"
              value={address}
              onChangeText={(val) => {
                setAddress(val);
                if (serverError) setServerError(null);
              }}
              onBlur={() => handleBlur('address')}
              error={addressError}
              multiline
              numberOfLines={2}
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

            <View style={CommonStyles.actionContainer}>
              <Button
                title="Save details"
                loading={loading}
                loadingText="Saving..."
                onPress={handleSaveProfile}
              />

              <TouchableOpacity
                style={{ marginTop: Spacing.md, alignItems: 'center', paddingVertical: 8 }}
                onPress={async () => {
                  queryClient.clear();
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
