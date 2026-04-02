import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import api from '../../../utils/api';

export default function NoticesScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/tenant/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      console.log('Notifications error:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/tenant/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return { name: 'card', color: Colors.accent };
      case 'maintenance': return { name: 'build', color: Colors.primaryLight };
      case 'broadcast': return { name: 'megaphone', color: Colors.warning };
      default: return { name: 'notifications', color: Colors.primary };
    }
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const icon = getIcon(item.type);
    return (
      <View style={[styles.card, !item.read && styles.cardUnread]}>
        {!item.read && <View style={styles.unreadDot} />}
        <View style={[styles.iconBox, { backgroundColor: `${icon.color}20` }]}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity testID="notices-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Notices</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity testID="mark-all-read-btn" onPress={markAllRead} style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{unreadCount} new</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: Colors.light.textPrimary },
  newBadge: { backgroundColor: Colors.error, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  newBadgeText: { fontFamily: 'DMSans_700Bold', fontSize: 11, color: '#FFF' },
  loading: { flex: 1, justifyContent: 'center' },
  list: { paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.light.border, backgroundColor: '#FFFFFF', gap: 12 },
  cardUnread: { backgroundColor: '#F0FDF4' },
  unreadDot: { position: 'absolute', top: 18, right: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.light.textPrimary, flex: 1, marginRight: 8 },
  cardTitleUnread: { fontFamily: 'PlusJakartaSans_700Bold', color: Colors.primary },
  cardTime: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.light.textSecondary },
  cardMessage: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },
});
