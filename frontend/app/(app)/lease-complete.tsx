import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function LeaseCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    unitNumber?: string;
    startDate?: string;
    endDate?: string;
    monthlyRent?: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated checkmark */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>All Set!</Text>
          <Text style={styles.subtitle}>Your lease has been signed successfully.</Text>

          {/* Lease summary card */}
          {params.unitNumber ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>LEASE SUMMARY</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Unit</Text>
                <Text style={styles.cardValue}>{params.unitNumber}</Text>
              </View>
              {params.startDate ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Start Date</Text>
                  <Text style={styles.cardValue}>{params.startDate}</Text>
                </View>
              ) : null}
              {params.endDate ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>End Date</Text>
                  <Text style={styles.cardValue}>{params.endDate}</Text>
                </View>
              ) : null}
              {params.monthlyRent ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Monthly Rent</Text>
                  <Text style={styles.cardValue}>
                    KSh {parseInt(params.monthlyRent).toLocaleString()}
                  </Text>
                </View>
              ) : null}
              <View style={styles.cardDivider} />
              <View style={styles.signedRow}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                <Text style={styles.signedText}>Signed & legally binding</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.hint}>
            You can view your lease anytime under Documents.
          </Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace('/(app)/(home)')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Go to Dashboard</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
  checkCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 36,
    color: Colors.light.textPrimary, textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular', fontSize: 16,
    color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 28,
  },
  card: {
    backgroundColor: Colors.light.surface, borderRadius: 16, padding: 20,
    width: '100%', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11,
    color: Colors.primary, letterSpacing: 1.5, textAlign: 'center', marginBottom: 16,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.light.textSecondary },
  cardValue: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textPrimary },
  cardDivider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 12 },
  signedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  signedText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.success },
  hint: {
    fontFamily: 'DMSans_400Regular', fontSize: 13,
    color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.primary },
});
