import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import api from '../../../utils/api';

export default function PayRentScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('+254 712 345 678');
  const [amount, setAmount] = useState('25,000');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const numAmount = parseInt(amount.replace(/,/g, ''));
      const res = await api.post('/tenant/payments/initiate', {
        amount: numAmount,
        phoneNumber: phone.replace(/\s/g, ''),
      });
      setSuccess(true);
      setTimeout(() => {
        Alert.alert('Payment Initiated', 'Check your phone for the M-Pesa STK push prompt.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }, 500);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity testID="pay-rent-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Pay Rent</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Amount Display */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount Due</Text>
            <Text style={styles.amountValue}>KSh 25,000</Text>
            <Text style={styles.amountSub}>Due March 5, 2025 • Unit A-12</Text>
          </View>

          {/* Payment Method */}
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodGrid}>
            <TouchableOpacity
              testID="mpesa-method-btn"
              style={[styles.methodCard, paymentMethod === 'mpesa' && styles.methodActive]}
              onPress={() => setPaymentMethod('mpesa')}
            >
              {paymentMethod === 'mpesa' && (
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={styles.methodCheck} />
              )}
              <View style={styles.methodIconBg}>
                <MaterialIcons name="payment" size={22} color={paymentMethod === 'mpesa' ? Colors.primary : Colors.light.textSecondary} />
              </View>
              <Text style={[styles.methodLabel, paymentMethod === 'mpesa' && styles.methodLabelActive]}>M-Pesa</Text>
            </TouchableOpacity>
            <View style={styles.methodCardDisabled}>
              <View style={styles.methodIconBg}>
                <MaterialIcons name="account-balance" size={22} color={Colors.light.textSecondary} />
              </View>
              <Text style={styles.methodLabel}>Bank</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming soon</Text>
              </View>
            </View>
          </View>

          {/* Input Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>M-Pesa Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="phone-portrait-outline" size={18} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput
                testID="mpesa-phone-input"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>KSh</Text>
              <TextInput
                testID="payment-amount-input"
                style={[styles.input, styles.inputBold]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.inputHint}>You can pay a partial amount</Text>
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rent Amount</Text>
              <Text style={styles.summaryValue}>KSh 25,000</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Late Fee</Text>
              <Text style={styles.summaryValue}>KSh 0</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotalValue}>KSh 25,000</Text>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            testID="submit-payment-btn"
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Pay KSh 25,000 via M-Pesa</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            You'll receive an M-Pesa STK push on your phone.{'\n'}Enter your PIN to confirm.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { padding: 4 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: Colors.light.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  amountCard: {
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 28, alignItems: 'center',
    marginBottom: 28, borderWidth: 1, borderColor: `${Colors.accent}30`,
  },
  amountLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, marginBottom: 4 },
  amountValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 36, color: Colors.primary },
  amountSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.light.textPrimary, marginBottom: 12 },
  methodGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  methodCard: {
    flex: 1, alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 2,
    borderColor: Colors.primary, backgroundColor: '#F0FDF4', gap: 8,
  },
  methodActive: {},
  methodCardDisabled: {
    flex: 1, alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.light.border, backgroundColor: '#F8FAFC', gap: 8, opacity: 0.6,
  },
  methodCheck: { position: 'absolute', top: 8, right: 8 },
  methodIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  methodLabel: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.light.textSecondary },
  methodLabelActive: { color: Colors.primary },
  comingSoonBadge: { backgroundColor: Colors.light.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  comingSoonText: { fontFamily: 'DMSans_700Bold', fontSize: 9, color: Colors.light.textSecondary, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.light.textSecondary, marginBottom: 6, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: Colors.light.border, borderRadius: 14, overflow: 'hidden',
  },
  inputIcon: { paddingLeft: 14 },
  currencyPrefix: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textSecondary, paddingLeft: 14 },
  input: {
    flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15, color: Colors.light.textPrimary,
    paddingVertical: 14, paddingHorizontal: 12,
  },
  inputBold: { fontFamily: 'DMSans_700Bold' },
  inputHint: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.light.textSecondary, marginTop: 6, marginLeft: 4 },
  summaryCard: {
    backgroundColor: '#F8FAFC', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: Colors.light.border, marginBottom: 28,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary },
  summaryValue: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary },
  summaryDivider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 10 },
  summaryTotal: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: Colors.light.textPrimary },
  summaryTotalValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.primary },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
  disclaimer: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
