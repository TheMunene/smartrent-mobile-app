import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../../constants/Colors';

const { width } = Dimensions.get('window');

const TYPE_CONFIG: Record<string, { icon: string; color: string; gradient: [string, string]; label: string }> = {
  payment: {
    icon: 'card',
    color: Colors.accent,
    gradient: [Colors.primary, '#059669'],
    label: 'Payment Notice',
  },
  maintenance: {
    icon: 'build',
    color: Colors.primaryLight,
    gradient: ['#0F766E', '#0891B2'],
    label: 'Maintenance Notice',
  },
  broadcast: {
    icon: 'megaphone',
    color: Colors.warning,
    gradient: ['#B45309', '#D97706'],
    label: 'Property Announcement',
  },
  general: {
    icon: 'notifications',
    color: Colors.primary,
    gradient: [Colors.primary, Colors.primaryLight],
    label: 'Notice',
  },
};

export default function NoticeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    read: string;
  }>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 16, useNativeDriver: true }),
    ]).start();
  }, []);

  const config = TYPE_CONFIG[params.type] || TYPE_CONFIG.general;
  const isRead = params.read === '1';

  const formattedDate = params.createdAt
    ? new Date(params.createdAt).toLocaleString('en-KE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Gradient header */}
      <LinearGradient colors={config.gradient} style={styles.gradientHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.iconCircle}>
            <Ionicons name={config.icon as any} size={32} color="#FFFFFF" />
          </View>
          <View style={[styles.typePill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.typePillText}>{config.label}</Text>
          </View>
          {!isRead && (
            <View style={styles.unreadPill}>
              <View style={styles.unreadDot} />
              <Text style={styles.unreadPillText}>Unread</Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title card */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>{params.title}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={13} color={Colors.light.textSecondary} />
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>

        {/* Message card */}
        <View style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <View style={[styles.messageIconBg, { backgroundColor: `${config.color}15` }]}>
              <Ionicons name="document-text-outline" size={16} color={config.color} />
            </View>
            <Text style={styles.messageHeaderText}>Full Message</Text>
          </View>
          <Text style={styles.messageText}>{params.message}</Text>
        </View>

        {/* Footer tip */}
        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.tipText}>
            Contact your property manager for questions about this notice.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </Animated.ScrollView>

      {/* Back button at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },

  gradientHeader: {
    paddingTop: 52,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: { alignItems: 'center', paddingTop: 16, gap: 12 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typePillText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  unreadPillText: { fontFamily: 'DMSans_700Bold', fontSize: 11, color: Colors.primary },

  scrollContent: { padding: 20, gap: 14 },

  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: Colors.light.textPrimary,
    lineHeight: 28,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary },

  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  messageIconBg: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  messageHeaderText: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  messageText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.light.textPrimary,
    lineHeight: 24,
  },

  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 12,
    padding: 14,
  },
  tipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
});
