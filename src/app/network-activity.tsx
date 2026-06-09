import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Mock Pending Requests
const PENDING_REQUESTS = [
  { id: 'req1', name: 'Alex Mercer', type: 'Connection Request', detail: 'Midfielder • Lv. 9', image: require('@/assets/images/illustrations/athletes.png') },
  { id: 'req2', name: 'Blue Falcons FC', type: 'Match Invitation', detail: 'Sat, 18:30 vs Wolves', image: require('@/assets/images/illustrations/team_huddle.png') },
];

// Mock Connection Logs
const CONNECTION_LOGS = [
  { id: 'log1', text: 'Marcus J. accepted your match invite.', time: '2 hours ago', icon: 'checkmark-circle-outline', color: '#16a34a' },
  { id: 'log2', text: 'Elena S. sent a challenge request to Vanguard FC.', time: '1 day ago', icon: 'flash-outline', color: '#feae2c' },
  { id: 'log3', text: 'You connected with David W.', time: '3 days ago', icon: 'people-outline', color: '#05151e' },
];

export default function NetworkActivityScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [requests, setRequests] = useState(PENDING_REQUESTS);
  const [activeTab, setActiveTab] = useState<'pending' | 'logs'>('pending');

  const handleAction = (id: string, action: 'accept' | 'decline') => {
    // Remove from active list
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="headlineSm" style={styles.headerTitle}>
            Network Activity
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Tabs selector */}
          <View style={styles.tabSelectorRow}>
            <Pressable
              onPress={() => setActiveTab('pending')}
              style={[
                styles.tabBtn,
                activeTab === 'pending' && { borderBottomColor: theme.secondary }
              ]}
            >
              <ThemedText
                type="labelMd"
                style={{
                  color: activeTab === 'pending' ? theme.text : theme.textSecondary,
                  fontFamily: activeTab === 'pending' ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular'
                }}
              >
                PENDING ({requests.length})
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('logs')}
              style={[
                styles.tabBtn,
                activeTab === 'logs' && { borderBottomColor: theme.secondary }
              ]}
            >
              <ThemedText
                type="labelMd"
                style={{
                  color: activeTab === 'logs' ? theme.text : theme.textSecondary,
                  fontFamily: activeTab === 'logs' ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_400Regular'
                }}
              >
                ACTIVITY LOGS
              </ThemedText>
            </Pressable>
          </View>

          {/* Tab Content */}
          {activeTab === 'pending' ? (
            <View style={styles.section}>
              {requests.map(req => (
                <View key={req.id} style={[styles.requestCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                  <View style={styles.requestRow}>
                    <Image source={req.image} style={styles.avatarImage} contentFit="cover" />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText type="labelSm" style={{ color: theme.secondary, letterSpacing: 0.5 }}>
                        {req.type.toUpperCase()}
                      </ThemedText>
                      <ThemedText type="headlineSm" style={{ marginTop: 2 }}>{req.name}</ThemedText>
                      <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>{req.detail}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => handleAction(req.id, 'accept')}
                      style={[styles.acceptBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText type="labelMd" style={{ color: '#ffffff' }}>Accept</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleAction(req.id, 'decline')}
                      style={[styles.declineBtn, { borderColor: theme.outlineVariant }]}
                    >
                      <ThemedText type="labelMd" style={{ color: theme.textSecondary }}>Decline</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}

              {requests.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="mail-open-outline" size={48} color={theme.textSecondary + '66'} />
                  <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                    All caught up! No pending requests.
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <View style={[styles.logsCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level1]}>
                {CONNECTION_LOGS.map((log, idx) => (
                  <View key={log.id} style={[styles.logRow, idx > 0 && { borderTopWidth: 1, borderTopColor: '#0000000a' }]}>
                    <View style={[styles.logIconWrap, { backgroundColor: log.color + '1a' }]}>
                      <Ionicons name={log.icon as any} size={18} color={log.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText type="bodyMd" style={{ color: theme.text }}>{log.text}</ThemedText>
                      <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 2 }}>{log.time}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  tabSelectorRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#0000000a',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  requestCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  acceptBtn: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  logsCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  logIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
