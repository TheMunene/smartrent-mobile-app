import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../../constants/Colors';
import api from '../../../utils/api';

export default function LeaseScreen() {
  const router = useRouter();
  const [lease, setLease]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchLease();
  }, []);

  async function fetchLease() {
    try {
      const res = await api.get('/tenant/lease');
      setLease(res.data.lease);
    } catch {
      // no-op — lease stays null
    } finally {
      setLoading(false);
    }
  }

  const signed = lease?.status === 'active' && !!lease?.signedAt;
  const awaitingSignature = lease?.status === 'pending_signature' && !!lease?.docusignEnvelopeId;

  async function handleSign() {
    if (!lease?.docusignEnvelopeId) {
      Alert.alert('Not ready', 'Your lease has not been sent for signing yet. Contact your property manager.');
      return;
    }
    setSigning(true);
    try {
      const res = await api.post('/tenant/lease/signing-url');
      const { signingUrl } = res.data;

      await WebBrowser.openBrowserAsync(signingUrl, {
        dismissButtonStyle: 'close',
      });

      // Always refetch — openBrowserAsync resolves when the browser closes regardless
      // of result type (on iOS it often returns 'opened', not 'dismiss').
      // The signing-complete redirect updates the DB synchronously, so 1s is enough.
      setTimeout(async () => {
        await fetchLease();
        // fetchLease updates `lease` state; read freshly from API to check result
        try {
          const res = await api.get('/tenant/lease');
          const fresh = res.data.lease;
          if (fresh?.status === 'active' && fresh?.signedAt) {
            router.replace({
              pathname: '/(app)/lease-complete',
              params: {
                unitNumber: fresh.unitNumber,
                startDate: fresh.startDate,
                endDate: fresh.endDate,
                monthlyRent: String(fresh.monthlyRent ?? ''),
              },
            });
          }
        } catch {}
      }, 1000);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Could not open signing session. Try again.');
    } finally {
      setSigning(false);
    }
  }

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

        {/* Document summary card */}
        <View style={styles.docCard}>
          <Text style={styles.docTitle}>LEASE AGREEMENT</Text>

          <View style={styles.docSection}>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Unit</Text>
              <Text style={styles.docValue}>{lease?.unitNumber || '—'}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Monthly Rent</Text>
              <Text style={styles.docValue}>KSh {(lease?.monthlyRent || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Term</Text>
              <Text style={styles.docValue}>{lease?.startDate || '—'} – {lease?.endDate || '—'}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Status</Text>
              <Text style={[styles.docValue, signed ? styles.statusSigned : styles.statusPending]}>
                {signed ? 'Signed' : awaitingSignature ? 'Awaiting your signature' : lease?.status || 'No lease'}
              </Text>
            </View>
          </View>

          <View style={styles.docDivider} />

          <Text style={styles.docClause}>
            This lease is managed by SmartRent. The full document — including all terms, conditions,
            and pre-filled details — is available for review in the DocuSign signing session below.
          </Text>
        </View>

        {/* Signed banner */}
        {signed && (
          <View style={styles.signedBanner}>
            <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
            <View style={styles.signedBannerText}>
              <Text style={styles.signedBannerTitle}>Lease signed</Text>
              <Text style={styles.signedBannerSub}>
                Signed on {lease.signedAt ? new Date(lease.signedAt).toLocaleDateString('en-KE') : '—'}
              </Text>
            </View>
          </View>
        )}

        {/* Sign button */}
        {!signed && (
          <TouchableOpacity
            testID="sign-lease-btn"
            style={[styles.signBtn, !awaitingSignature && styles.signBtnDisabled]}
            onPress={handleSign}
            disabled={!awaitingSignature || signing}
            activeOpacity={0.8}
          >
            {signing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="pencil" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.signBtnText}>
                  {awaitingSignature ? 'Sign Lease Agreement' : 'Lease not ready for signing'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {!signed && awaitingSignature && (
          <Text style={styles.signingHint}>
            You'll be taken to a secure DocuSign session to review and sign your lease.
            Your signature is legally binding under Kenyan law.
          </Text>
        )}

        {!lease && (
          <Text style={styles.noLease}>No lease found. Contact your property manager.</Text>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.light.background },
  loading:         { flex: 1, justifyContent: 'center' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:         { padding: 4 },
  headerTitle:     { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary },
  scrollContent:   { paddingHorizontal: 20, paddingBottom: 40 },
  docCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  docTitle:        { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.primary, textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  docSection:      { gap: 12 },
  docRow:          { flexDirection: 'row', justifyContent: 'space-between' },
  docLabel:        { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.light.textSecondary },
  docValue:        { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textPrimary, flex: 1, textAlign: 'right' },
  statusSigned:    { color: Colors.success },
  statusPending:   { color: Colors.accent },
  docDivider:      { height: 1, backgroundColor: Colors.light.border, marginVertical: 16 },
  docClause:       { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, lineHeight: 20 },
  signedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: `${Colors.success}15`, borderRadius: 14, padding: 16, marginBottom: 24,
  },
  signedBannerText:  { flex: 1 },
  signedBannerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.success },
  signedBannerSub:   { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  signBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  signBtnDisabled: { opacity: 0.45 },
  signBtnText:     { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
  signingHint:     { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  noLease:         { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 24 },
});
