import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BorderRadius } from '@/constants/theme';

const COACH_DATA = {
  id: '1',
  name: 'Rohan Patel',
  sport: 'Football',
  experience: '10 Years',
  rating: 4.9,
  languages: 'English, Hindi, Marathi',
  location: 'Mumbai, Maharashtra',
  image: require('@/assets/images/illustrations/football_player.png'),
  verified: true,
  bio: 'Passionate football coach with 10 years of experience training youth and competitive players. Specialized in modern football techniques and tactical awareness.',
  achievements: ['National Champion 2015', 'U-17 State Championship Coach', 'FIFA Certified', 'Youth Development Specialist'],
  certifications: ['FIFA Level 2', 'Sports Science Diploma', 'Nutrition Certification', 'First Aid Certified'],
  specializations: ['Football', 'Speed Training', 'Tactical Training', 'Kids Coaching', 'Competitive Training'],
  programs: [
    { id: '1', title: 'Personal Training', desc: 'One-on-one coaching', price: '₹500/hr' },
    { id: '2', title: 'Group Training', desc: 'Team sessions (5-10 players)', price: '₹200/person' },
    { id: '3', title: 'Summer Camp', desc: '2-week intensive program', price: '₹5000' },
    { id: '4', title: 'Weekend Batch', desc: 'Sat-Sun sessions', price: '₹2000/month' },
  ],
  reviews: [
    { id: '1', name: 'Arjun Kumar', rating: 5, text: 'Excellent coach! Improved my game significantly.' },
    { id: '2', name: 'Priya Singh', rating: 4.5, text: 'Great technique teaching and very patient with kids.' },
  ],
};

export default function CoachProfile() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']}>
        {/* Header with Back Button */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.secondary} />
          </Pressable>
          <Pressable onPress={() => {}}>
            <Ionicons name="share-social" size={24} color={theme.secondary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={COACH_DATA.image} style={styles.profileImage} />
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          </View>
        </View>

        <View style={styles.profileInfo}>
          <ThemedText type="headlineLg">{COACH_DATA.name}</ThemedText>
          <View style={styles.metaRow}>
            <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
              {COACH_DATA.sport} • {COACH_DATA.experience}
            </ThemedText>
          </View>
          <View style={styles.ratingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <ThemedText type="labelMd">{COACH_DATA.rating}</ThemedText>
            </View>
            <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>
              {COACH_DATA.languages}
            </ThemedText>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.textSecondary} />
            <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginLeft: 4 }}>
              {COACH_DATA.location}
            </ThemedText>
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: theme.surfaceLowest, borderRadius: BorderRadius.lg }]}>
          <ThemedText type="labelMd">About</ThemedText>
          <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 8 }}>
            {COACH_DATA.bio}
          </ThemedText>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <ThemedText type="labelMd" style={{ marginBottom: 12 }}>Achievements</ThemedText>
          {COACH_DATA.achievements.map(achievement => (
            <View key={achievement} style={styles.achievementItem}>
              <Ionicons name="checkmark-done" size={18} color="#22c55e" />
              <ThemedText type="bodySm" style={{ marginLeft: 8 }}>
                {achievement}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <ThemedText type="labelMd" style={{ marginBottom: 12 }}>Certifications</ThemedText>
          <View style={styles.certGrid}>
            {COACH_DATA.certifications.map(cert => (
              <View key={cert} style={[styles.certBadge, { backgroundColor: theme.surfaceHigh }]}>
                <Ionicons name="ribbon" size={16} color="#22c55e" />
                <ThemedText type="labelSm" style={{ marginLeft: 6 }}>
                  {cert}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Specializations */}
        <View style={styles.section}>
          <ThemedText type="labelMd" style={{ marginBottom: 12 }}>Specializations</ThemedText>
          <View style={styles.tagRow}>
            {COACH_DATA.specializations.map(spec => (
              <View key={spec} style={[styles.tag, { backgroundColor: '#22c55e' }]}>
                <ThemedText type="labelSm" style={{ color: '#ffffff' }}>
                  {spec}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Programs */}
        <View style={styles.section}>
          <ThemedText type="labelMd" style={{ marginBottom: 12 }}>Training Programs</ThemedText>
          {COACH_DATA.programs.map(prog => (
            <View key={prog.id} style={[styles.programCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant }]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="headlineSm">{prog.title}</ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {prog.desc}
                </ThemedText>
              </View>
              <ThemedText type="labelMd" style={{ color: '#22c55e' }}>
                {prog.price}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <ThemedText type="labelMd" style={{ marginBottom: 12 }}>Reviews</ThemedText>
          {COACH_DATA.reviews.map(review => (
            <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.surfaceLowest }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="headlineSm">{review.name}</ThemedText>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Ionicons key={i} name="star" size={14} color={i < review.rating ? '#f59e0b' : '#cbd5e1'} />
                    ))}
                </View>
              </View>
              <ThemedText type="bodySm" style={{ color: theme.textSecondary, marginTop: 8 }}>
                {review.text}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomActions, { backgroundColor: theme.background }]}>
        <Pressable style={styles.actionBtn}>
          <MaterialCommunityIcons name="phone" size={20} color="#22c55e" />
          <ThemedText type="labelMd" style={{ color: '#22c55e', marginLeft: 8 }}>Call</ThemedText>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <MaterialCommunityIcons name="whatsapp" size={20} color="#22c55e" />
          <ThemedText type="labelMd" style={{ color: '#22c55e', marginLeft: 8 }}>WhatsApp</ThemedText>
        </Pressable>
        <Pressable style={[styles.actionBtn, { backgroundColor: '#22c55e', flex: 1.2 }]}>
          <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Book Session</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.containerMargin, paddingVertical: Spacing.md },
  scrollContent: { paddingHorizontal: Spacing.containerMargin, paddingBottom: 120 },
  profileHeader: { alignItems: 'center', marginVertical: Spacing.lg, position: 'relative' },
  profileImage: { width: 140, height: 140, borderRadius: 70 },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 50 },
  profileInfo: { alignItems: 'center', marginVertical: Spacing.md },
  metaRow: { marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  section: { marginVertical: Spacing.lg, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.md },
  achievementItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  certGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  certBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  programCard: { paddingHorizontal: 12, paddingVertical: 12, marginVertical: 8, borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  reviewCard: { paddingHorizontal: 12, paddingVertical: 12, marginVertical: 8, borderRadius: BorderRadius.lg },
  bottomActions: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.containerMargin, paddingVertical: Spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
});
