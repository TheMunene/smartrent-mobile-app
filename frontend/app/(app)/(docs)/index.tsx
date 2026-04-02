import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import api from '../../../utils/api';

export default function DocsHubScreen() {
  const router = useRouter();
  const [lease, setLease] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tenant/lease').catch(() => ({ data: { lease: null } })),
      api.get('/tenant/payments').catch(() => ({ data: { payments: [] } })),
      api.get('/tenant/notifications').catch(() => ({ data: { notifications: [] } })),
    ]).then(([leaseRes, paymentsRes, notifsRes]) => {
      setLease(leaseRes.data.lease);
      setPayments(paymentsRes.data.payments || []);
      setNotifications((notifsRes.data.notifications || []).filter((n: any) => n.type === 'broadcast').slice(0, 3));
      setLoading(false);
    });
  }, []);

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
        <Text style={styles.title}>Documents</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Lease Section */}
        <Text style={styles.sectionTitle}>Lease Agreement</Text>
        {lease ? (
          <TouchableOpacity
            testID="lease-card"
            style={styles.leaseCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/(docs)/lease')}
          >
            <View style={styles.leaseIconBg}>
              <Ionicons name="document-text" size={22} color={Colors.primary} />
            </View>
            <View style={styles.leaseContent}>
              <View style={styles.leaseHeader}>
                <View style={styles.leaseStatusBadge}>
                  <Text style={styles.leaseStatusText}>{lease.status?.toUpperCase() || 'ACTIVE'}</Text>
                </View>
              </View>
              <Text style={styles.leaseTitle}>Lease — Unit {lease.unitNumber}</Text>
              <Text style={styles.leaseDate}>{lease.startDate} – {lease.endDate}</Text>
              <Text style={styles.leaseCta}>Tap to view or sign</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active lease found</Text>
          </View>
        )}

        {/* Payment Receipts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Receipts</Text>
          <TouchableOpacity testID="view-all-receipts">
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.receiptsList}>
          {payments.slice(0, 3).map((p) => (
            <View key={p.id} style={styles.receiptCard}>
              <View style={styles.receiptIconBg}>
                <MaterialIcons name="receipt-long" size={20} color={Colors.primary} />
              </View>
              <View style={styles.receiptContent}>
                <Text style={styles.receiptTitle}>{p.month}</Text>
                <Text style={styles.receiptAmount}>KSh {p.amount?.toLocaleString()}</Text>
              </View>
              <TouchableOpacity testID={`receipt-view-${p.id}`} style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Deposit */}
        <TouchableOpacity
          testID="deposit-card"
          style={styles.depositCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(app)/(docs)/deposit')}
        >
          <View style={styles.depositLeft}>
            <Ionicons name="wallet" size={22} color={Colors.primary} />
            <View>
              <Text style={styles.depositTitle}>Deposit Status</Text>
              <Text style={styles.depositSub}>View deposit & request refund</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
        </TouchableOpacity>

        {/* Notices */}
        <Text style={styles.sectionTitle}>Notices</Text>
        {notifications.map((n) => (
          <View key={n.id} style={styles.noticeCard}>
            <View style={[styles.noticeIcon, { backgroundColor: `${Colors.warning}20` }]}>
              <Ionicons name="warning" size={18} color={Colors.warning} />
            </View>
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>{n.title}</Text>
              <Text style={styles.noticeMsg} numberOfLines={2}>{n.message}</Text>
            </View>
          </View>
        ))}
        {notifications.length === 0 && (
          <Text style={styles.emptyText}>No notices</Text>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: Colors.light.textPrimary },
  loading: { flex: 1, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary, marginBottom: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.primary },
  leaseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, marginBottom: 24,
  },
  leaseIconBg: { width: 48, height: 48, borderRadius: 14, backgroundColor: `${Colors.primary}10`, alignItems: 'center', justifyContent: 'center' },
  leaseContent: { flex: 1 },
  leaseHeader: { marginBottom: 4 },
  leaseStatusBadge: { alignSelf: 'flex-start', backgroundColor: `${Colors.success}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  leaseStatusText: { fontFamily: 'DMSans_700Bold', fontSize: 9, color: Colors.success },
  leaseTitle: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.light.textPrimary },
  leaseDate: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  leaseCta: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.primary, marginTop: 4 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary },
  receiptsList: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  receiptCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  receiptIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${Colors.primary}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  receiptContent: { flex: 1 },
  receiptTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textPrimary },
  receiptAmount: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary },
  viewBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: `${Colors.primary}10` },
  viewBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 12, color: Colors.primary },
  depositCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: `${Colors.accent}30`,
  },
  depositLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  depositTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.primary },
  depositSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary },
  noticeCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, gap: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  noticeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noticeContent: { flex: 1 },
  noticeTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: Colors.light.textPrimary, marginBottom: 4 },
  noticeMsg: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
});
