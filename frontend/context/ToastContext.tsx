import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Animated, View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
  warning: 'warning',
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: Colors.success,
  error: Colors.error,
  info: Colors.primary,
  warning: Colors.warning,
};

function ToastDisplay() {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  // Expose showToast via ref so provider can call it
  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message, type });
    slideAnim.setValue(-120);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
    timeoutRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3200);
  }, []);

  // Store ref on context ref
  React.useEffect(() => {
    toastRef.current = show;
  }, [show]);

  if (!toast) return null;

  const bg = TOAST_COLORS[toast.type];
  const icon = TOAST_ICONS[toast.type] as any;
  const topOffset = insets.top + (Platform.OS === 'ios' ? 8 : 12);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bg, top: topOffset, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
      <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
    </Animated.View>
  );
}

// Module-level ref so showToast can be called outside hooks
const toastRef = React.createRef<((message: string, type: ToastType) => void) | null>();
(toastRef as any).current = null;

export function showToast(message: string, type: ToastType = 'success') {
  toastRef.current?.(message, type);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const show = useCallback((message: string, type: ToastType = 'success') => {
    toastRef.current?.(message, type);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: show }}>
      {children}
      <ToastDisplay />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    zIndex: 99999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#FFF',
    flex: 1,
    lineHeight: 19,
  },
});
