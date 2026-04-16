import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../utils/api';

interface PropertyInfo {
  name: string;
  address: string;
  propertyCode: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
}

export default function ContactScreen() {
  const router = useRouter();
  const { tenant } = useAuth();
  const { showToast } = useToast();
  const [info, setInfo] = useState<PropertyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenant/property-info')
      .then(res => setInfo(res.data.property))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const call = (phone: string) => {
    const tel = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${tel}`).catch(() => showToast('Could not open dialer', 'error'));
  };

  const email = (addr: string) => {
    Linking.openURL(`mailto:${addr}?subject=Inquiry from ${tenant?.name || 'Tenant'} (Unit ${tenant?.unitNumber})`).catch(() => showToast('Could not open email', 'error'));
  };

  const whatsapp = (phone: string) => {
    const num = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}`).catch(() => showToast('WhatsApp not available', 'error'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Contact & Support</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Property Manager */}
        <View style={styles.managerCard}>
          <View style={styles.managerAvatar}>
            <Ionicons name="person" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.managerInfo}>
            <Text style={styles.managerRole}>Property Manager</Text>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.managerName}>{info?.managerName || 'Property Manager'}</Text>
                <Text style={styles.managerProperty}>{info?.name || tenant?.propertyName}</Text>
              </>
            )}
          </View>
        </View>

        {!loading && info?.managerPhone && (
          <>
            <Text style={styles.sectionLabel}>REACH US</Text>
            <View style={styles.card}>
              <ContactAction
                icon="call"
                label="Call Manager"
                sub={info.managerPhone}
                color={Colors.success}
                onPress={() => call(info.managerPhone)}
              />
              <ContactAction
                icon="logo-whatsapp"
                label="WhatsApp"
                sub={info.managerPhone}
                color="#25D366"
                onPress={() => whatsapp(info.managerPhone)}
                divider
              />
              {info.managerEmail && (
                <ContactAction
                  icon="mail"
                  label="Send Email"
                  sub={info.managerEmail}
                  color={Colors.primary}
                  onPress={() => email(info.managerEmail)}
                  divider
                />
              )}
            </View>
          </>
        )}

        {/* Property Address */}
        {info?.address && (
          <>
            <Text style={styles.sectionLabel}>PROPERTY ADDRESS</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressIconBg}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressTitle}>{info.name}</Text>
                <Text style={styles.addressText}>{info.address}</Text>
                {info.propertyCode && <Text style={styles.propertyCode}>Code: {info.propertyCode}</Text>}
              </View>
            </View>
          </>
        )}

        {/* Help topics */}
        <Text style={styles.sectionLabel}>HELP TOPICS</Text>
        <View style={styles.card}>
          <HelpItem icon="card-outline" title="Rent Payments" body="Pay via M-Pesa STK push from the Pay Rent screen. Confirmations are sent via notification." />
          <HelpItem icon="build-outline" title="Maintenance Tickets" body="Submit tickets from the Tickets tab. Include photos for faster resolution. You'll be notified when status changes." divider />
          <HelpItem icon="document-text-outline" title="Lease & Documents" body="View your lease agreement, deposit status, and payment receipts from the Documents tab." divider />
          <HelpItem icon="lock-closed-outline" title="Account & Security" body="Change your password from Settings → Change Password. Keep your M-Pesa number up to date." divider />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactAction({ icon, label, sub, color, onPress, divider }: {
  icon: string; label: string; sub: string; color: string; onPress: () => void; divider?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[caStyles.wrap, divider && caStyles.divider]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[caStyles.iconBg, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={caStyles.label}>{label}</Text>
        <Text style={caStyles.sub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
    </TouchableOpacity>
  );
}

function HelpItem({ icon, title, body, divider }: {
  icon: string; title: string; body: string; divider?: boolean;
}) {
  return (
    <View style={[helpStyles.wrap, divider && helpStyles.divider]}>
      <View style={helpStyles.iconBg}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={helpStyles.title}>{title}</Text>
        <Text style={helpStyles.body}>{body}</Text>
      </View>
    </View>
  );
}

const caStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  iconBg: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textPrimary },
  sub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
});

const helpStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  iconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.primary}08`, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  title: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textPrimary, marginBottom: 3 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary },
  scrollContent: { padding: 16, gap: 8 },
  managerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: `${Colors.primary}20`,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    marginBottom: 8,
  },
  managerAvatar: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  managerInfo: { flex: 1 },
  managerRole: { fontFamily: 'DMSans_700Bold', fontSize: 11, color: Colors.primaryLight, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  managerName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: Colors.light.textPrimary },
  managerProperty: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold', fontSize: 11, color: Colors.light.textSecondary,
    letterSpacing: 1.2, marginTop: 10, marginBottom: 4, marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.light.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  addressIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.primary}10`, alignItems: 'center', justifyContent: 'center' },
  addressTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textPrimary, marginBottom: 2 },
  addressText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
  propertyCode: { fontFamily: 'DMSans_700Bold', fontSize: 11, color: Colors.primaryLight, marginTop: 4 },
});
