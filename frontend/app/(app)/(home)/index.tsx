import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Animated, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { tenant } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [latestAlert, setLatestAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchDashboard = async () => {
    try {
      const [dashRes, notifRes] = await Promise.all([
        api.get('/tenant/dashboard'),
        api.get('/tenant/notifications'),
      ]);
      setDashboard(dashRes.data);
      const notifications: any[] = notifRes.data?.notifications || [];
      const unread = notifications.find((n) => !n.read) || null;
      setLatestAlert(unread);
    } catch (e) {
      console.log('Dashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const quickActions = [
    { icon: 'build-outline', label: 'Raise\nTicket', route: '/(app)/(tickets)/create', color: Colors.primary },
    { icon: 'document-text-outline', label: 'Documents', route: '/(app)/(docs)/', color: Colors.primaryLight },
    { icon: 'card-outline', label: 'Pay\nRent', route: '/(app)/(home)/pay-rent', color: Colors.accent },
    { icon: 'wallet-outline', label: 'Deposit', route: '/(app)/(docs)/deposit', color: Colors.warning },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const d = dashboard;
  const payments = d?.payment;
  const stats = d?.stats;
  const deposit = d?.deposit;
  const lease = d?.lease;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{tenant?.name || 'Tenant'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              testID="notification-bell"
              style={styles.bellBtn}
              onPress={() => router.push('/(app)/(home)/notices')}
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
              {(stats?.unreadNotifications || 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              testID="avatar-btn"
              style={styles.avatarCircle}
              onPress={() => router.push('/(app)/(more)/')}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>{tenant?.avatar || 'T'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Alert Banner — only shown when there's an unread notification */}
          {latestAlert && (
            <TouchableOpacity testID="alert-banner" style={styles.alertBanner} activeOpacity={0.8} onPress={() => router.push('/(app)/(home)/notices')}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={18} color={Colors.warning} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{latestAlert.title}</Text>
                <Text style={styles.alertSub} numberOfLines={1}>{latestAlert.message}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          )}

          <PaymentCard payments={payments} deposit={deposit} lease={lease} tenant={tenant} router={router} />

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                testID={`quick-action-${i}`}
                style={styles.actionCard}
                activeOpacity={0.7}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Tickets */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Tickets</Text>
            <TouchableOpacity testID="view-all-tickets" onPress={() => router.push('/(app)/(tickets)/')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <TicketsList />

          {/* Recent Payments */}
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          <RecentPayments />

          <View style={{ height: 20 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function getDueDate(leaseStartDate: string, next = false): string {
  if (!leaseStartDate) return 'this month';
  const dueDay = new Date(leaseStartDate).getDate();
  const now = new Date();
  const month = next ? now.getMonth() + 1 : now.getMonth();
  const date = new Date(now.getFullYear(), month, dueDay);
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function PaymentCard({ payments, deposit, lease, tenant, router }: any) {
  const monthlyRent = payments?.monthlyRent || 0;
  const rentStatus = payments?.currentMonthStatus || 'unpaid';
  const depositPaid = deposit?.paid !== false; // treat missing deposit info as paid (admin-recorded)
  const depositAmount = deposit?.amount || 0;

  // Deposit unpaid takes priority
  if (deposit && !deposit.paid && depositAmount > 0) {
    return (
      <LinearGradient colors={['#92400E', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rentCard}>
        <Text style={styles.rentLabel}>Deposit Due</Text>
        <Text style={styles.rentAmount}>KSh {depositAmount.toLocaleString()}</Text>
        <Text style={styles.rentDue}>Security deposit • Unit {tenant?.unitNumber || ''}</Text>
        <View style={styles.rentActions}>
          <TouchableOpacity
            testID="pay-deposit-btn"
            style={styles.payBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(app)/(docs)/deposit')}
          >
            <MaterialIcons name="payment" size={18} color="#92400E" />
            <Text style={[styles.payBtnText, { color: '#92400E' }]}>Pay Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="payment-history-btn" style={styles.historyBtn} activeOpacity={0.8} onPress={() => router.push('/(app)/(docs)/')}>
            <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // STK sent, awaiting PIN
  if (rentStatus === 'pending') {
    return (
      <LinearGradient colors={['#1E3A5F', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rentCard}>
        <Text style={styles.rentLabel}>Payment Pending</Text>
        <Text style={styles.rentAmount}>KSh {monthlyRent.toLocaleString()}</Text>
        <Text style={styles.rentDue}>STK push sent — enter your M-Pesa PIN to confirm</Text>
        <View style={styles.rentActions}>
          <TouchableOpacity testID="payment-history-btn" style={[styles.historyBtn, { flex: 1, justifyContent: 'center' }]} activeOpacity={0.8} onPress={() => router.push('/(app)/(docs)/')}>
            <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.historyBtnText}>View History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Rent confirmed — all paid up
  if (rentStatus === 'confirmed') {
    return (
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rentCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
          <Text style={styles.rentLabel}>You're all paid up</Text>
        </View>
        <Text style={styles.rentAmount}>KSh {monthlyRent.toLocaleString()}</Text>
        <Text style={styles.rentDue}>Next rent due: {getDueDate(lease?.startDate, true)}</Text>
        <View style={styles.rentActions}>
          <TouchableOpacity testID="payment-history-btn" style={[styles.historyBtn, { flex: 1, justifyContent: 'center' }]} activeOpacity={0.8} onPress={() => router.push('/(app)/(docs)/')}>
            <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.historyBtnText}>View History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Overdue
  if (rentStatus === 'overdue') {
    return (
      <LinearGradient colors={['#7F1D1D', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rentCard}>
        <Text style={styles.rentLabel}>Rent Overdue</Text>
        <Text style={styles.rentAmount}>KSh {monthlyRent.toLocaleString()}</Text>
        <Text style={styles.rentDue}>Was due {getDueDate(lease?.startDate)} • Unit {tenant?.unitNumber || ''}</Text>
        <View style={styles.rentActions}>
          <TouchableOpacity testID="pay-rent-btn" style={styles.payBtn} activeOpacity={0.8} onPress={() => router.push('/(app)/(home)/pay-rent')}>
            <MaterialIcons name="payment" size={18} color="#7F1D1D" />
            <Text style={[styles.payBtnText, { color: '#7F1D1D' }]}>Pay Now</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="payment-history-btn" style={styles.historyBtn} activeOpacity={0.8} onPress={() => router.push('/(app)/(docs)/')}>
            <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Default: unpaid
  return (
    <LinearGradient colors={[Colors.primary, Colors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rentCard}>
      <Text style={styles.rentLabel}>Rent Due</Text>
      <Text style={styles.rentAmount}>KSh {monthlyRent.toLocaleString()}</Text>
      <Text style={styles.rentDue}>Due {getDueDate(lease?.startDate)} • Unit {tenant?.unitNumber || ''}</Text>
      <View style={styles.rentActions}>
        <TouchableOpacity testID="pay-rent-btn" style={styles.payBtn} activeOpacity={0.8} onPress={() => router.push('/(app)/(home)/pay-rent')}>
          <MaterialIcons name="payment" size={18} color={Colors.primary} />
          <Text style={styles.payBtnText}>Pay via M-Pesa</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="payment-history-btn" style={styles.historyBtn} activeOpacity={0.8} onPress={() => router.push('/(app)/(docs)/')}>
          <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function TicketsList() {
  const [tickets, setTickets] = useState<any[]>([]);
  const router = useRouter();
  useEffect(() => {
    api.get('/tenant/maintenance').then(res => setTickets(res.data.tickets || [])).catch(() => {});
  }, []);

  const statusColors: any = { open: '#3B82F6', in_progress: Colors.warning, assigned: Colors.primaryLight, resolved: Colors.success };

  return (
    <View style={styles.ticketList}>
      {tickets.slice(0, 3).map((t, i) => (
        <TouchableOpacity
          key={t.id}
          style={[styles.ticketCard, i < tickets.length - 1 && styles.ticketCardBorder]}
          activeOpacity={0.7}
          onPress={() => router.push(`/(app)/(tickets)/${t.id}` as any)}
        >
          <View style={[styles.ticketPriority, { backgroundColor: t.priority === 'high' ? Colors.error : t.priority === 'medium' ? Colors.warning : Colors.primaryLight }]} />
          <View style={styles.ticketContent}>
            <Text style={styles.ticketTitle}>{t.title}</Text>
            <View style={styles.ticketMeta}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColors[t.status] || '#94A3B8'}20` }]}>
                <Text style={[styles.statusText, { color: statusColors[t.status] || '#94A3B8' }]}>
                  {t.status?.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.ticketTime}>
                <Ionicons name="time-outline" size={12} color={Colors.light.textSecondary} />
                <Text style={styles.ticketTimeText}>{t.category}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      ))}
      {tickets.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={32} color={Colors.accent} />
          <Text style={styles.emptyText}>No active tickets</Text>
        </View>
      )}
    </View>
  );
}

function RecentPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  useEffect(() => {
    api.get('/tenant/payments').then(res => setPayments(res.data.payments || [])).catch(() => {});
  }, []);

  return (
    <>
      <View style={styles.paymentsList}>
        {payments.slice(0, 3).map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.paymentCard}
            activeOpacity={0.7}
            onPress={() => setSelected(p)}
          >
            <View style={styles.paymentIconBg}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>{p.month} Rent</Text>
              <Text style={styles.paymentDate}>{p.paidAt || 'Pending'}</Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>KSh {p.amount?.toLocaleString()}</Text>
              <View style={[styles.paymentStatus, { backgroundColor: p.status === 'confirmed' ? `${Colors.success}20` : `${Colors.warning}20` }]}>
                <Text style={[styles.paymentStatusText, { color: p.status === 'confirmed' ? Colors.success : Colors.warning }]}>
                  {p.status === 'confirmed' ? 'PAID' : 'PENDING'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <PaymentDetailModal payment={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function PaymentDetailModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  if (!payment) return null;
  const isPaid = payment.status === 'confirmed';
  return (
    <Modal visible={!!payment} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <TouchableOpacity style={pmStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={pmStyles.sheet}>
        <View style={pmStyles.handle} />
        <View style={[pmStyles.iconRow, { backgroundColor: isPaid ? `${Colors.success}15` : `${Colors.warning}15` }]}>
          <Ionicons name={isPaid ? 'checkmark-circle' : 'time'} size={32} color={isPaid ? Colors.success : Colors.warning} />
        </View>
        <Text style={pmStyles.title}>{payment.month} Rent Payment</Text>
        <Text style={[pmStyles.status, { color: isPaid ? Colors.success : Colors.warning }]}>
          {isPaid ? 'CONFIRMED' : 'PENDING'}
        </Text>
        <View style={pmStyles.divider} />
        <View style={pmStyles.row}>
          <Text style={pmStyles.label}>Amount</Text>
          <Text style={pmStyles.value}>KSh {payment.amount?.toLocaleString()}</Text>
        </View>
        {payment.mpesaRef && (
          <View style={pmStyles.row}>
            <Text style={pmStyles.label}>M-Pesa Ref</Text>
            <Text style={pmStyles.value}>{payment.mpesaRef}</Text>
          </View>
        )}
        <View style={pmStyles.row}>
          <Text style={pmStyles.label}>Method</Text>
          <Text style={pmStyles.value}>{payment.method === 'mpesa' ? 'M-Pesa' : payment.method || 'M-Pesa'}</Text>
        </View>
        {payment.paidAt && (
          <View style={pmStyles.row}>
            <Text style={pmStyles.label}>Date Paid</Text>
            <Text style={pmStyles.value}>{new Date(payment.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
        )}
        <TouchableOpacity style={pmStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={pmStyles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const pmStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(6,78,59,0.35)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 20 },
  iconRow: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary, marginBottom: 4 },
  status: { fontFamily: 'DMSans_700Bold', fontSize: 12, letterSpacing: 1, marginBottom: 20 },
  divider: { width: '100%', height: 1, backgroundColor: Colors.light.border, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  label: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary },
  value: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textPrimary },
  closeBtn: {
    marginTop: 8, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center',
  },
  closeBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#FFFFFF' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  greeting: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary },
  userName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: Colors.light.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { position: 'relative', padding: 8, backgroundColor: '#FFFFFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  badge: { position: 'absolute', top: 2, right: 2, backgroundColor: Colors.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontFamily: 'DMSans_700Bold', fontSize: 9, color: '#FFF' },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#FFF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningDim,
    padding: 14, borderRadius: 14, marginBottom: 16, gap: 12,
  },
  alertIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(252,211,77,0.3)', alignItems: 'center', justifyContent: 'center' },
  alertContent: { flex: 1 },
  alertTitle: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.light.textPrimary },
  alertSub: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  rentCard: { borderRadius: 20, padding: 24, marginBottom: 24 },
  rentLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  rentAmount: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 36, color: '#FFFFFF', marginVertical: 4 },
  rentDue: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  rentActions: { flexDirection: 'row', gap: 12 },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flex: 1, justifyContent: 'center' },
  payBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: Colors.primary },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  historyBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary, marginBottom: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.primary },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionCard: {
    width: (width - 76) / 4, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 4,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  actionIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.light.textPrimary, textAlign: 'center', lineHeight: 14 },
  ticketList: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  ticketCard: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  ticketCardBorder: { borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  ticketPriority: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  ticketContent: { flex: 1 },
  ticketTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textPrimary, marginBottom: 6 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontFamily: 'DMSans_700Bold', fontSize: 10, textTransform: 'uppercase' },
  ticketTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ticketTimeText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.light.textSecondary },
  emptyState: { padding: 32, alignItems: 'center', gap: 8 },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary },
  paymentsList: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  paymentIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.primary}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  paymentContent: { flex: 1 },
  paymentTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textPrimary },
  paymentDate: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: Colors.light.textPrimary },
  paymentStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  paymentStatusText: { fontFamily: 'DMSans_700Bold', fontSize: 10 },
});
