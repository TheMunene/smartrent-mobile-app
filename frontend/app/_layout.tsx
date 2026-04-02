import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

function ToastOverlay() {
  const [toast, setToast] = React.useState<{ message: string; type: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    let cancelled = false;

    const connectSSE = async () => {
      try {
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
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'payment:confirmed') {
                  showToast(`Payment of KSh ${event.data?.amount?.toLocaleString()} confirmed!`, 'success');
                } else if (event.type === 'broadcast:new') {
                  showToast(event.data?.subject || 'New notification', 'info');
                } else if (event.type === 'ticket:status_changed') {
                  showToast(`Ticket "${event.data?.title}" status updated`, 'info');
                }
              } catch {}
            }
          }
        }
      } catch (e) {
        // SSE connection failed silently, will retry
      }
    };

    // Only connect SSE on native, not web preview (can cause issues)
    if (Platform.OS !== 'web') {
      connectSSE();
    }

    return () => { cancelled = true; };
  }, [token]);

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  if (!toast) return null;

  return (
    <Animated.View style={[styles.toast, { opacity: fadeAnim, backgroundColor: toast.type === 'success' ? Colors.success : Colors.primary }]}>
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

function RootNav() {
  const { tenant, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>SmartRent</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)" />
      </Stack>
      <ToastOverlay />
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
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNav />
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
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
