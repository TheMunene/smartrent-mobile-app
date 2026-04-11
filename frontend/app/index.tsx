import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Animated, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useRouter, Redirect } from 'expo-router';
import api from '../utils/api';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'findHome'>('login');
  const [email, setEmail] = useState('grace.muthoni@gmail.com');
  const [password, setPassword] = useState('password123');
  const [propertyCode, setPropertyCode] = useState('');
  const [propertyPreview, setPropertyPreview] = useState<{ propertyName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, tenant, savedProperty, clearSavedProperty } = useAuth();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (savedProperty) {
      setPropertyCode(savedProperty.propertyCode);
    }
  }, [savedProperty]);

  // If already logged in, redirect
  if (tenant) {
    return <Redirect href="/(app)/(home)" />;
  }

  const switchTab = (tab: 'login' | 'findHome') => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const verifyProperty = async (code: string) => {
    if (code.length < 3) { setPropertyPreview(null); return; }
    try {
      const { data } = await api.get(`/tenant/auth/verify-property?code=${code.toUpperCase()}`);
      if (data.propertyName) setPropertyPreview({ propertyName: data.propertyName });
      else setPropertyPreview(null);
    } catch {
      setPropertyPreview(null);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!savedProperty && !propertyCode) {
      setError('Please enter your property code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password, propertyCode || undefined);
      router.replace('/(app)/(home)');
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo Area */}
          <View style={styles.logoArea}>
            <View style={styles.logoIcon}>
              <Ionicons name="home" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.logoText}>SmartRent</Text>
            <Text style={styles.tagline}>Modern living, simplified</Text>
          </View>

          {/* Tab Toggle */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              testID="login-tab"
              style={[styles.tab, activeTab === 'login' && styles.tabActive]}
              onPress={() => switchTab('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="find-home-tab"
              style={[styles.tab, activeTab === 'findHome' && styles.tabActive]}
              onPress={() => switchTab('findHome')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'findHome' && styles.tabTextActive]}>Find a Home</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            {activeTab === 'login' ? (
              <View>
                <Text style={styles.welcomeTitle}>Welcome Back</Text>
                <Text style={styles.welcomeSub}>Sign in to manage your tenancy</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={Colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Property */}
                {savedProperty ? (
                  <View style={styles.propertyBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                    <View style={styles.propertyBadgeInfo}>
                      <Text style={styles.propertyBadgeName}>{savedProperty.propertyName}</Text>
                      <Text style={styles.propertyBadgeCode}>{savedProperty.propertyCode}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { clearSavedProperty(); setPropertyCode(''); setPropertyPreview(null); }}>
                      <Text style={styles.wrongPropertyText}>Wrong property?</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Property Code</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="business-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="SR-XXXXX"
                        placeholderTextColor="#64748B"
                        value={propertyCode}
                        onChangeText={(t) => { setPropertyCode(t.toUpperCase()); setPropertyPreview(null); }}
                        onBlur={() => verifyProperty(propertyCode)}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                    </View>
                    {propertyPreview ? (
                      <View style={styles.propertyPreview}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                        <Text style={styles.propertyPreviewText}>{propertyPreview.propertyName}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      testID="email-input"
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor="#64748B"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      testID="password-input"
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#64748B"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.light.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity testID="forgot-password-btn" style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="login-submit-btn"
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.comingSoonContainer}>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
                </View>
                <Text style={styles.comingSoonTitle}>Find Your Next Home</Text>
                <Text style={styles.comingSoonDesc}>
                  Soon you'll be able to browse verified units in Nairobi, view high-res photos, and check real-time pricing directly in the app.
                </Text>
                <View style={styles.featureList}>
                  {['Browse verified units', 'High-res photos', 'Real-time pricing'].map((f, i) => (
                    <View key={i} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity testID="notify-me-btn" style={styles.secondaryBtn} activeOpacity={0.8}>
                  <Ionicons name="notifications-outline" size={18} color={Colors.accent} />
                  <Text style={styles.secondaryBtnText}>Notify Me When Ready</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          <Text style={styles.footer}>Modern living solutions for Kenya</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logoArea: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(52,211,153,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, color: '#FFFFFF' },
  tagline: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  tabContainer: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
    padding: 4, marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: Colors.primary },
  formContainer: { flex: 1 },
  welcomeTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 4 },
  welcomeSub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.error, flex: 1 },
  propertyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  propertyBadgeInfo: { flex: 1 },
  propertyBadgeName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#FFFFFF' },
  propertyBadgeCode: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  wrongPropertyText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.accent, textDecorationLine: 'underline' },
  propertyPreview: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginLeft: 4 },
  propertyPreviewText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.accent },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  inputIcon: { paddingLeft: 14 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  input: {
    flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15, color: '#FFFFFF',
    paddingVertical: 14, paddingHorizontal: 12,
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.accent },
  primaryBtn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.primary },
  comingSoonContainer: { alignItems: 'center', paddingTop: 16 },
  comingSoonBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginBottom: 16,
  },
  comingSoonBadgeText: { fontFamily: 'DMSans_700Bold', fontSize: 12, color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
  comingSoonTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  comingSoonDesc: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  featureList: { width: '100%', gap: 12, marginBottom: 32 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5,
    borderColor: Colors.accent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24,
  },
  secondaryBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: Colors.accent },
  footer: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 24 },
});
