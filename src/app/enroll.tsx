import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function EnrollScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const title = (params.title as string) || 'Summer Camp Enrollment';
  const priceRaw = (params.price as string) || '4999';
  const dates = (params.dates as string) || 'Summer 2024';
  const location = (params.location as string) || 'TBD';
  const image = params.image || require('@/assets/images/illustrations/coaching_class_premium.png');
  const themeColor = (params.themeColor as string) || '#fbbf24';

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');

  const basePrice = parseInt(priceRaw.replace(/[^0-9]/g, ''), 10);
  const serviceFee = 150;
  const total = basePrice + serviceFee;

  const handleEnroll = () => {
    if (!name || !age || !phone) {
      Alert.alert('Missing Fields', 'Please fill out all participant details before enrolling.');
      return;
    }
    Alert.alert(
      "Enrollment Confirmed!",
      `You have successfully enrolled ${name} in the ${title}.\nTotal Paid: ₹${total}`,
      [
        {
          text: "Back to Home",
          onPress: () => {
            router.dismissAll();
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  return (
    <GradientContainer screenName="booking" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            Registration
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero Banner */}
          <View style={styles.heroCard}>
            <Image 
              source={typeof image === 'string' && /^\d+$/.test(image) ? parseInt(image, 10) : (typeof image === 'string' ? { uri: image } : image)} 
              style={styles.heroImage} 
              contentFit="cover" 
            />
            <View style={styles.heroOverlay}>
              <ThemedText type="headlineMd" style={{ color: '#ffffff', fontFamily: 'Sora_800ExtraBold' }}>
                {title}
              </ThemedText>
              
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#ffffffaa" />
                  <ThemedText type="labelSm" style={{ color: '#ffffffcc', marginLeft: 4 }}>{dates}</ThemedText>
                </View>
                <View style={styles.heroMetaItem}>
                  <Ionicons name="location-outline" size={14} color="#ffffffaa" />
                  <ThemedText type="labelSm" style={{ color: '#ffffffcc', marginLeft: 4 }}>{location}</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Participant Details Form */}
          <View style={styles.section}>
            <ThemedText type="headlineSm" style={{ marginBottom: Spacing.sm }}>Participant Details</ThemedText>
            
            <View style={[styles.formContainer, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }, Shadows.level1]}>
              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 4 }}>Full Name</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={theme.textSecondary + '80'}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 4 }}>Age</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                    placeholder="e.g. 14"
                    placeholderTextColor={theme.textSecondary + '80'}
                    keyboardType="numeric"
                    value={age}
                    onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 4 }}>Contact Phone</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceLow, color: theme.text, borderColor: theme.outlineVariant + '44' }]}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={theme.textSecondary + '80'}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/[^0-9+\s\-()]/g, ''))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 8 }}>Skill Level</ThemedText>
                <View style={styles.skillRow}>
                  {['Beginner', 'Intermediate', 'Advanced'].map(lvl => {
                    const isActive = skillLevel === lvl;
                    return (
                      <Pressable 
                        key={lvl}
                        onPress={() => setSkillLevel(lvl)}
                        style={[
                          styles.skillPill, 
                          isActive ? { backgroundColor: themeColor } : { backgroundColor: theme.surfaceHigh }
                        ]}
                      >
                        <ThemedText type="labelSm" style={{ color: isActive ? '#000000' : theme.textSecondary, fontFamily: isActive ? 'Sora_700Bold' : 'Sora_500Medium' }}>
                          {lvl}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.section}>
            <ThemedText type="headlineSm" style={{ marginBottom: Spacing.sm }}>Payment Summary</ThemedText>
            
            <View style={[styles.summaryCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }, Shadows.level1]}>
              <View style={styles.summaryRow}>
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary }}>Enrollment Fee</ThemedText>
                <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>₹{basePrice}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary }}>Taxes & Service Fee</ThemedText>
                <ThemedText type="bodyMd" style={{ fontFamily: 'Sora_700Bold' }}>₹{serviceFee}</ThemedText>
              </View>
              
              <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '44' }]} />
              
              <View style={styles.summaryRow}>
                <ThemedText type="headlineSm">Total Due</ThemedText>
                <ThemedText type="headlineSm" style={{ color: themeColor === '#fbbf24' ? theme.primary : themeColor, fontFamily: 'Sora_800ExtraBold' }}>
                  ₹{total}
                </ThemedText>
              </View>
            </View>
          </View>

        </ScrollView>

        {/* Sticky Footer */}
        <View style={[styles.stickyFooter, { backgroundColor: theme.surfaceLowest, borderTopColor: theme.outlineVariant + '22' }]}>
          <View style={styles.footerInfo}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>Total (incl. taxes)</ThemedText>
            <ThemedText type="headlineSm" style={{ fontFamily: 'Sora_800ExtraBold' }}>₹{total}</ThemedText>
          </View>
          <Pressable 
            onPress={handleEnroll}
            style={[styles.payBtn, { backgroundColor: themeColor === '#fbbf24' ? theme.primary : themeColor }]}
          >
            <Ionicons name="card-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <ThemedText type="labelMd" style={{ color: '#ffffff', fontFamily: 'Sora_700Bold', fontSize: 15 }}>
              Pay & Enroll
            </ThemedText>
          </Pressable>
        </View>

      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  backButton: { padding: 6 },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 16 },
  scrollContent: { paddingBottom: 120 },
  heroCard: {
    height: 200,
    marginHorizontal: Spacing.containerMargin,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#00000088',
    padding: Spacing.lg,
    justifyContent: 'flex-end',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center' },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.containerMargin,
  },
  formContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  inputGroup: { marginBottom: Spacing.md },
  inputRow: { flexDirection: 'row' },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
  },
  skillRow: { flexDirection: 'row', gap: Spacing.sm },
  skillPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  divider: { height: 1, marginVertical: Spacing.md },
  stickyFooter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.md,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  footerInfo: { flex: 1 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
});
