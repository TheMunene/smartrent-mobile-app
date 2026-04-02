import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import api from '../../../utils/api';

export default function DepositScreen() {
  const router = useRouter();
  const [deposit, setDeposit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [phone, setPhone] = useState('+254');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/tenant/deposit').then(res => setDeposit(res.data.deposit)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRefundRequest = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for the refund request.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/tenant/deposit/refund', { reason, phoneNumber: phone });
      Alert.alert('Submitted', 'Your refund request has been submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity testID="deposit-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deposit</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Status Indicator */}
          <View style={styles.statusRow}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
            <Text style={styles.statusText}>Held by Management</Text>
          </View>

          {/* Deposit Card */}
          <View style={styles.depositCard}>
            <Text style={styles.depositLabel}>Your Deposit</Text>
            <Text style={styles.depositAmount}>KSh {(deposit?.amount || 25000).toLocaleString()}</Text>
            <Text style={styles.depositDate}>Paid on {deposit?.paidOn || 'January 1, 2025'}</Text>
          </View>

          {/* Refund Section */}
          <Text style={styles.sectionTitle}>Request Refund</Text>

          {/* Policy Info */}
          <View style={styles.policyCard}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <View style={styles.policyContent}>
              <Text style={styles.policyTitle}>Refund Policy</Text>
              <Text style={styles.policyText}>{deposit?.refundPolicy || 'Deposit refunds are processed within 30 days of lease termination.'}</Text>
            </View>
          </View>

          {/* Reason Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reason for Request</Text>
            <TextInput
              testID="refund-reason-input"
              style={[styles.input, styles.textArea]}
              placeholder="Describe your reason..."
              placeholderTextColor={Colors.light.textSecondary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Refund M-Pesa Number</Text>
            <TextInput
              testID="refund-phone-input"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            testID="submit-refund-btn"
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleRefundRequest}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Refund Request</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.disclaimer}>By submitting, you agree to the inspection terms.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${Colors.primary}10`, borderRadius: 10, paddingVertical: 10, marginBottom: 20,
  },
  statusText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.primary },
  depositCard: {
    backgroundColor: '#F0FDF4', borderRadius: 20, padding: 32, alignItems: 'center',
    marginBottom: 28, borderWidth: 1, borderColor: `${Colors.accent}30`,
  },
  depositLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, marginBottom: 4 },
  depositAmount: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 36, color: Colors.primary },
  depositDate: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary, marginBottom: 16 },
  policyCard: {
    flexDirection: 'row', backgroundColor: `${Colors.primary}08`, borderRadius: 14,
    padding: 16, gap: 12, marginBottom: 24, borderWidth: 1, borderColor: `${Colors.primary}15`,
  },
  policyContent: { flex: 1 },
  policyTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.primary, marginBottom: 4 },
  policyText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.light.textSecondary, marginBottom: 6, marginLeft: 4 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: Colors.light.border,
    padding: 16, fontFamily: 'DMSans_400Regular', fontSize: 15, color: Colors.light.textPrimary,
  },
  textArea: { minHeight: 80 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
  disclaimer: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 12 },
});
