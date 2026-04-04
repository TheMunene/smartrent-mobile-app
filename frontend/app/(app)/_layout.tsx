import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Platform, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { tenant, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !tenant) return;
    if (tenant.profileComplete === false) {
      router.replace('/(app)/complete-profile');
    }
  }, [tenant?.profileComplete, loading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tickets)"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color }) => <MaterialIcons name="confirmation-number" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(docs)"
        options={{
          title: 'Docs',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="complete-profile"
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="lease-complete"
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
