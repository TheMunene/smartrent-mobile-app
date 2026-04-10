import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider, showToast } from '../context/ToastContext';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

SplashScreen.preventAutoHideAsync();

function SSEListener() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token || Platform.OS === 'web') return;
    let cancelled = false;

    const connectSSE = async () => {
      try {
        const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
        const response = await fetch(`${BACKEND_URL}/api/realtime/events?type=tenant`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          const text = decoder.decode(value);
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'payment:confirmed') {
                showToast(`Payment of KSh ${event.data?.amount?.toLocaleString()} confirmed!`, 'success');
              } else if (event.type === 'broadcast:new') {
                showToast(event.data?.subject || 'New notice from your property', 'info');
              } else if (event.type === 'ticket:status_changed') {
                showToast(`Ticket "${event.data?.title}" was updated`, 'info');
              } else if (event.type === 'notification:new') {
                showToast(event.data?.title || 'New notification', 'info');
              }
            } catch {}
          }
        }
      } catch {}
    };

    connectSSE();
    return () => { cancelled = true; };
  }, [token]);

  return null;
}

function RootNav() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>SmartRent</Text>
      </View>
    );
  }

  return (
    <>
      <SSEListener />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <RootNav />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
  },
});
