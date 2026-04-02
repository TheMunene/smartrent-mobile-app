import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import api from '../../../utils/api';

export default function LeaseScreen() {
  const router = useRouter();
  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    api.get('/tenant/lease').then(res => {
      setLease(res.data.lease);
      if (res.data.lease?.signedAt) setSigned(true);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!signed && !signatureDrawn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [signed, signatureDrawn]);

  const handleSign = async () => {
    if (!agreed) {
      Alert.alert('Agreement Required', 'Please agree to the terms and conditions first.');
      return;
    }
    setSigning(true);
    try {
      await api.post('/tenant/lease/sign');
      setSigned(true);
      Alert.alert('Success', 'Lease signed successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to sign lease');
    } finally {
      setSigning(false);
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
      <View style={styles.header}>
        <TouchableOpacity testID="lease-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lease Agreement</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Document Card */}
        <View style={styles.docCard}>
          <Text style={styles.docTitle}>LEASE AGREEMENT</Text>

          <View style={styles.docSection}>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Parties</Text>
              <Text style={styles.docValue}>Terex Court Management and {lease?.tenantName || 'Grace M.'}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Unit</Text>
              <Text style={styles.docValue}>{lease?.unitNumber || 'A-12'}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Monthly Rent</Text>
              <Text style={styles.docValue}>KSh {(lease?.monthlyRent || 25000).toLocaleString()}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Term</Text>
              <Text style={styles.docValue}>{lease?.startDate || 'Jan 2025'} – {lease?.endDate || 'Dec 2025'}</Text>
            </View>
          </View>

          <View style={styles.docDivider} />

          <Text style={styles.docClause}>
            1. PREMISES: The Landlord hereby leases to Tenant and Tenant hereby leases from Landlord that certain real property...
          </Text>
          <Text style={styles.docClause}>
            2. RENT: Tenant shall pay Landlord a monthly rent of KSh {(lease?.monthlyRent || 25000).toLocaleString()}, payable in advance on the first day of each month...
          </Text>

          <View style={styles.scrollHint}>
            <Ionicons name="chevron-down" size={18} color={Colors.light.textSecondary} />
            <Text style={styles.scrollHintText}>Scroll to view full document</Text>
          </View>
        </View>

        {/* Signature Section */}
        <Text style={styles.signatureTitle}>Your Signature</Text>
        <Animated.View style={[styles.signatureCanvas, signed && styles.signatureCanvasSigned, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            testID="signature-canvas"
            style={styles.signatureInner}
            onPress={() => {
              if (!signed) {
                setSignatureDrawn(true);
                pulseAnim.stopAnimation();
                pulseAnim.setValue(1);
              }
            }}
            activeOpacity={0.7}
          >
            {signed || signatureDrawn ? (
              <View style={styles.signedContent}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
                <Text style={styles.signedText}>{signed ? 'Signed' : 'Signature Captured'}</Text>
              </View>
            ) : (
              <View style={styles.unsignedContent}>
                <Ionicons name="create-outline" size={28} color={Colors.accent} />
                <Text style={styles.unsignedText}>Tap to sign here</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Agreement Checkbox */}
        {!signed && (
          <TouchableOpacity
            testID="agree-checkbox"
            style={styles.agreeRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={styles.agreeText}>I agree to the terms and conditions of this lease agreement</Text>
          </TouchableOpacity>
        )}

        {/* Sign Button */}
        {!signed && (
          <TouchableOpacity
            testID="sign-lease-btn"
            style={[styles.signBtn, (!agreed || !signatureDrawn) && styles.signBtnDisabled]}
            onPress={handleSign}
            disabled={!agreed || !signatureDrawn || signing}
            activeOpacity={0.8}
          >
            {signing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.signBtnText}>Sign Lease Agreement</Text>
            )}
          </TouchableOpacity>
        )}

        {signed && (
          <View style={styles.signedBanner}>
            <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
            <Text style={styles.signedBannerText}>Lease signed successfully</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loading: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  docCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  docTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.primary, textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  docSection: { gap: 12 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between' },
  docLabel: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.light.textSecondary },
  docValue: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textPrimary, flex: 1, textAlign: 'right' },
  docDivider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 16 },
  docClause: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, lineHeight: 20, marginBottom: 12 },
  scrollHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
  scrollHintText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.light.textSecondary },
  signatureTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.light.textPrimary, marginBottom: 12 },
  signatureCanvas: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.accent,
    borderRadius: 16, overflow: 'hidden', marginBottom: 20,
  },
  signatureCanvasSigned: { borderStyle: 'solid', borderColor: Colors.success },
  signatureInner: { height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4' },
  signedContent: { alignItems: 'center', gap: 8 },
  signedText: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.success },
  unsignedContent: { alignItems: 'center', gap: 8 },
  unsignedText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.accent },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.light.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  agreeText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, flex: 1 },
  signBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  signBtnDisabled: { opacity: 0.5 },
  signBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
  signedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${Colors.success}15`, borderRadius: 14, padding: 16,
  },
  signedBannerText: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.success },
});
