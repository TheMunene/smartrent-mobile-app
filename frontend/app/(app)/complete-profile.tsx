import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function CompleteProfileScreen() {
  const { token, setTenantData } = useAuth();
  const router = useRouter();

  const [idNumber, setIdNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!idNumber || !emergencyContactName || !emergencyContactPhone) {
      setError('Please fill in your ID number and emergency contact details');
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.put('/tenant/profile', { idNumber, emergencyContactName, emergencyContactPhone });
      await api.put('/tenant/profile/password', { currentPassword, newPassword });

      // Refresh tenant to get profileComplete: true
      const { data } = await api.get('/tenant/auth/me');
      if (data.tenant && token) {
        await setTenantData(data.tenant, token);
      }

      // Navigate based on pending lease
      try {
        const leaseRes = await api.get('/tenant/lease');
        if (leaseRes.data.lease?.status === 'pending_signature') {
          router.replace('/(app)/(docs)/lease');
          return;
        }
      } catch {}

      router.replace('/(app)/(home)');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="person-circle" size={40} color={Colors.accent} />
            </View>
            <Text style={styles.headerTitle}>Complete Your Profile</Text>
            <Text style={styles.headerSub}>
              Before you access your tenancy, we need a few details from you.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Identity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identity</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>National ID Number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12345678"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={idNumber}
                  onChangeText={setIdNumber}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact's full name"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={emergencyContactName}
                  onChangeText={setEmergencyContactName}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+254700000000"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={emergencyContactPhone}
                  onChangeText={setEmergencyContactPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Password */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Set Your Password</Text>
            <Text style={styles.sectionHint}>
              You received a temporary password by email. Enter it below, then choose a new one.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Temporary Password <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-open-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your temporary password"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <Text style={styles.inputLabel}>Confirm New Password <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Complete Profile</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  headerIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.accentDim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24,
    color: Colors.light.textPrimary, textAlign: 'center', marginBottom: 8,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular', fontSize: 14,
    color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 22,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)', padding: 12, borderRadius: 10,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.error, flex: 1 },
  section: {
    backgroundColor: Colors.light.surface, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16,
    color: Colors.light.textPrimary, marginBottom: 16,
  },
  sectionHint: {
    fontFamily: 'DMSans_400Regular', fontSize: 13,
    color: Colors.light.textSecondary, lineHeight: 20, marginBottom: 16, marginTop: -8,
  },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontFamily: 'DMSans_500Medium', fontSize: 13,
    color: Colors.light.textSecondary, marginBottom: 6, marginLeft: 2,
  },
  required: { color: Colors.error },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.background, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15,
    color: Colors.light.textPrimary, paddingVertical: 13, paddingHorizontal: 12,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
});
