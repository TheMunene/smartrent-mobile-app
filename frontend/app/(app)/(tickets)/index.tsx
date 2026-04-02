import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import api from '../../../utils/api';

export default function TicketsListScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tenant/maintenance');
      setTickets(res.data.tickets || []);
    } catch (e) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchTickets(); }, []);

  const statusColors: any = {
    open: '#3B82F6', in_progress: Colors.warning, assigned: Colors.primaryLight, resolved: Colors.success,
  };

  const priorityColors: any = { high: Colors.error, medium: Colors.warning, low: Colors.primaryLight, urgent: '#DC2626' };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity testID={`ticket-${item.id}`} style={styles.card} activeOpacity={0.7}>
      <View style={[styles.priorityBar, { backgroundColor: priorityColors[item.priority] || Colors.light.textSecondary }]} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColors[item.status] || '#94A3B8'}15` }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] || '#94A3B8' }]}>
              {item.status?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
        <TouchableOpacity
          testID="create-ticket-btn"
          style={styles.addBtn}
          onPress={() => router.push('/(app)/(tickets)/create')}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.accent} />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>No maintenance tickets yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: Colors.light.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  priorityBar: { width: 4, height: 48, borderRadius: 2, marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.light.textPrimary, marginBottom: 4 },
  cardDesc: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textSecondary, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontFamily: 'DMSans_700Bold', fontSize: 9, textTransform: 'uppercase' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${Colors.primary}10` },
  categoryText: { fontFamily: 'DMSans_500Medium', fontSize: 10, color: Colors.primary },
  priorityText: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.light.textSecondary, textTransform: 'capitalize' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.light.textSecondary },
});
