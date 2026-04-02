import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';

type SettingsItem = { icon: string; lib: 'ion' | 'mat'; label: string; badge?: string };
type SettingsSection = { title: string; items: SettingsItem[] };

const sections: SettingsSection[] = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', lib: 'ion', label: 'Personal Information' },
      { icon: 'phone-portrait-outline', lib: 'ion', label: 'M-Pesa Number' },
      { icon: 'lock-closed-outline', lib: 'ion', label: 'Change Password' },
      { icon: 'notifications-outline', lib: 'ion', label: 'Notification Preferences' },
    ],
  },
  {
    title: 'Tenancy',
    items: [
      { icon: 'business-outline', lib: 'ion', label: 'My Unit Details' },
      { icon: 'document-text-outline', lib: 'ion', label: 'Lease Information' },
      { icon: 'time-outline', lib: 'ion', label: 'Payment History' },
      { icon: 'wallet-outline', lib: 'ion', label: 'Deposit Status', badge: 'Pending' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', lib: 'ion', label: 'Help Center' },
      { icon: 'people-outline', lib: 'ion', label: 'Contact Management' },
      { icon: 'flag-outline', lib: 'ion', label: 'Report a Problem' },
      { icon: 'information-circle-outline', lib: 'ion', label: 'About SmartRent' },
    ],
  },
];

export default function SettingsScreen() {
  const { tenant, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleItemPress = (label: string) => {
    if (label === 'Lease Information') router.push('/(app)/(docs)/lease');
    else if (label === 'Deposit Status') router.push('/(app)/(docs)/deposit');
    else if (label === 'Payment History') router.push('/(app)/(home)/pay-rent');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{tenant?.avatar || 'T'}</Text>
            </View>
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={12} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.profileName}>{tenant?.name || 'Tenant'}</Text>
          <Text style={styles.profileUnit}>Unit {tenant?.unitNumber || 'A-12'} • Terex Court</Text>
          <TouchableOpacity testID="edit-profile-btn" style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  testID={`settings-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  style={[styles.settingsItem, idx < section.items.length - 1 && styles.settingsItemBorder]}
                  onPress={() => handleItemPress(item.label)}
                  activeOpacity={0.6}
                >
                  <View style={styles.settingsLeft}>
                    <View style={styles.settingsIconBg}>
                      <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.settingsRight}>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity testID="sign-out-btn" style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>SmartRent v2.4.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: Colors.primary },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  profileSection: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  avatarText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, color: '#FFFFFF' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  profileName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: Colors.light.textPrimary },
  profileUnit: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary, marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  editBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.primary },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'DMSans_700Bold', fontSize: 11, color: Colors.light.textSecondary, letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.primary}10`, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.light.textPrimary },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: Colors.warningDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontFamily: 'DMSans_700Bold', fontSize: 9, color: '#B45309', textTransform: 'uppercase' },
  signOutBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.light.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  signOutText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: Colors.error },
  versionText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 12 },
});
