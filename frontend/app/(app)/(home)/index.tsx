import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Animated, Dimensions,
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/tenant/dashboard');
      setDashboard(res.data);
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
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{tenant?.avatar || 'T'}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Alert Banner */}
          <TouchableOpacity testID="alert-banner" style={styles.alertBanner} activeOpacity={0.8} onPress={() => router.push('/(app)/(home)/notices')}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={18} color={Colors.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Water Disruption — Tomorrow 9am–2pm</Text>
              <Text style={styles.alertSub}>Scheduled maintenance. Please store water.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
          </TouchableOpacity>

          {/* Rent Due Card */}
          <LinearGradient
            colors={[Colors.primary, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rentCard}
          >
            <Text style={styles.rentLabel}>Rent Due</Text>
            <Text style={styles.rentAmount}>KSh {(payments?.monthlyRent || 25000).toLocaleString()}</Text>
            <Text style={styles.rentDue}>Due March 5, 2025 • Unit {tenant?.unitNumber || 'A-12'}</Text>
            <View style={styles.rentActions}>
              <TouchableOpacity
                testID="pay-rent-btn"
                style={styles.payBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/(app)/(home)/pay-rent')}
              >
                <MaterialIcons name="payment" size={18} color={Colors.primary} />
                <Text style={styles.payBtnText}>Pay via M-Pesa</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="payment-history-btn" style={styles.historyBtn} activeOpacity={0.8}>
                <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.historyBtnText}>History</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

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

function TicketsList() {
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    api.get('/tenant/maintenance').then(res => setTickets(res.data.tickets || [])).catch(() => {});
  }, []);

  const statusColors: any = { open: '#3B82F6', in_progress: Colors.warning, assigned: Colors.primaryLight, resolved: Colors.success };

  return (
    <View style={styles.ticketList}>
      {tickets.slice(0, 3).map((t, i) => (
        <View key={t.id} style={[styles.ticketCard, i < tickets.length - 1 && styles.ticketCardBorder]}>
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
        </View>
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
  useEffect(() => {
    api.get('/tenant/payments').then(res => setPayments(res.data.payments || [])).catch(() => {});
  }, []);

  return (
    <View style={styles.paymentsList}>
      {payments.slice(0, 3).map((p) => (
        <View key={p.id} style={styles.paymentCard}>
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
        </View>
      ))}
    </View>
  );
}

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
