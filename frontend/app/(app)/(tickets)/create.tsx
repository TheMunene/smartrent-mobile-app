import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import api from '../../../utils/api';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = ['Plumbing', 'Electrical', 'Structural', 'Appliance', 'Pest Control', 'General'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function CreateTicketScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('Plumbing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setPhotos(prev => [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for the issue');
      return;
    }
    setLoading(true);
    try {
      await api.post('/tenant/maintenance', {
        title: title.trim(),
        description: description.trim(),
        priority: priority.toLowerCase(),
        category,
        photos,
      });
      Alert.alert('Success', 'Your ticket has been submitted!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity testID="create-ticket-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Raise a Ticket</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Category Pills */}
          <Text style={styles.sectionTitle}>Issue Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                testID={`category-${cat.toLowerCase()}`}
                style={[styles.pill, category === cat && styles.pillActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={styles.sectionTitle}>Issue Title</Text>
          <TextInput
            testID="ticket-title-input"
            style={styles.textInput}
            placeholder="Brief title of the issue..."
            placeholderTextColor={Colors.light.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={styles.sectionTitle}>Describe the Issue</Text>
          <TextInput
            testID="ticket-description-input"
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe what's wrong in detail..."
            placeholderTextColor={Colors.light.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Priority */}
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityGrid}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p}
                testID={`priority-${p.toLowerCase()}`}
                style={[styles.priorityCard, priority === p && styles.priorityActive]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photos */}
          <Text style={styles.sectionTitle}>Attach Photos</Text>
          <TouchableOpacity testID="add-photo-btn" style={styles.photoUpload} onPress={pickImage} activeOpacity={0.7}>
            <Ionicons name="camera" size={28} color={Colors.primary} />
            <Text style={styles.photoUploadText}>Add Photo</Text>
          </TouchableOpacity>
          {photos.length > 0 && (
            <View style={styles.photoRow}>
              {photos.map((_, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Ionicons name="image" size={20} color={Colors.accent} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => setPhotos(prev => prev.filter((__, idx) => idx !== i))}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            testID="submit-ticket-btn"
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Ticket</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.light.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: Colors.light.textPrimary, marginBottom: 10, marginTop: 20 },
  pills: { gap: 10, paddingBottom: 4 },
  pill: { height: 40, paddingHorizontal: 20, borderRadius: 20, backgroundColor: `${Colors.primary}10`, borderWidth: 1, borderColor: `${Colors.primary}20`, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.primary },
  pillTextActive: { color: '#FFFFFF' },
  textInput: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: `${Colors.primary}20`,
    padding: 16, fontFamily: 'DMSans_400Regular', fontSize: 15, color: Colors.light.textPrimary,
  },
  textArea: { minHeight: 120 },
  priorityGrid: { flexDirection: 'row', gap: 8 },
  priorityCard: {
    flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.light.border, backgroundColor: '#FFFFFF', alignItems: 'center',
  },
  priorityActive: { borderWidth: 2, borderColor: Colors.primary, backgroundColor: `${Colors.primary}10` },
  priorityText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.light.textSecondary },
  priorityTextActive: { fontFamily: 'DMSans_700Bold', color: Colors.primary },
  photoUpload: {
    height: 120, borderWidth: 2, borderStyle: 'dashed', borderColor: `${Colors.primary}40`,
    borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  photoUploadText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.primary },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  photoThumb: {
    width: 56, height: 56, borderRadius: 10, backgroundColor: `${Colors.accent}15`,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', marginTop: 32, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
});
