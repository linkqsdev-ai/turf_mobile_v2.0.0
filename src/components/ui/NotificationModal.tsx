import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useNotifications, AppNotification } from '@/context/NotificationContext';
import { Shadows, Spacing } from '@/constants/theme';

type TimeTab = 'Today' | 'This Week' | 'Earlier';

export function NotificationModal() {
  const theme = useTheme();
  const { profile } = useUserProfile();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    isModalOpen,
    closeNotificationModal,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<TimeTab>('Today');
  const [showAllUnfiltered, setShowAllUnfiltered] = useState(false);
  const roleName = profile?.role || 'Player';

  // Categorize notifications by time periods
  const { todayList, weekList, earlierList } = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    const today: AppNotification[] = [];
    const week: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    for (const notif of notifications) {
      const createdTime = new Date(notif.createdAt).getTime();
      const diff = now - createdTime;

      if (diff <= oneDayMs) {
        today.push(notif);
      } else if (diff <= sevenDaysMs) {
        week.push(notif);
      } else {
        earlier.push(notif);
      }
    }

    return { todayList: today, weekList: week, earlierList: earlier };
  }, [notifications]);

  const displayedList = useMemo(() => {
    if (showAllUnfiltered) return notifications;
    if (activeTab === 'Today') return todayList;
    if (activeTab === 'This Week') return weekList;
    return earlierList;
  }, [showAllUnfiltered, activeTab, notifications, todayList, weekList, earlierList]);

  const getNotifIcon = (type: string, title: string = '') => {
    const t = title.toLowerCase();
    if (t.includes('ai') || t.includes('smart') || t.includes('learning')) {
      return { name: 'bulb-outline' as const, color: '#8b5cf6', dotColor: '#8b5cf6' };
    }
    if (t.includes('data') || t.includes('analysis') || t.includes('summary') || t.includes('revenue')) {
      return { name: 'trending-up-outline' as const, color: '#3b82f6', dotColor: '#8b5cf6' };
    }
    if (t.includes('system') || t.includes('maintenance') || t.includes('update')) {
      return { name: 'construct-outline' as const, color: '#64748b', dotColor: '#8b5cf6' };
    }

    switch (type) {
      case 'bid':
        return { name: 'flash-outline' as const, color: '#6366f1', dotColor: '#6366f1' };
      case 'booking':
        return { name: 'calendar-outline' as const, color: '#10b981', dotColor: '#10b981' };
      case 'tournament':
        return { name: 'trophy-outline' as const, color: '#f59e0b', dotColor: '#f59e0b' };
      case 'class':
        return { name: 'school-outline' as const, color: '#8b5cf6', dotColor: '#8b5cf6' };
      default:
        return { name: 'notifications-outline' as const, color: '#3b82f6', dotColor: '#8b5cf6' };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return `${Math.floor(days / 7)}w ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <Modal
      visible={isModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={closeNotificationModal}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.drawerContainer, { backgroundColor: theme.background }]}>
          {/* Top Card Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
                AI Notification Center
              </ThemedText>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                onPress={() => setShowAllUnfiltered((prev) => !prev)}
                style={[
                  styles.seeAllBtn,
                  { borderColor: theme.outlineVariant + '40', backgroundColor: showAllUnfiltered ? theme.primary + '15' : 'transparent' },
                ]}
                hitSlop={6}
              >
                <ThemedText
                  style={[
                    styles.seeAllText,
                    { color: showAllUnfiltered ? theme.primary : theme.textSecondary },
                  ]}
                >
                  {showAllUnfiltered ? 'Filtered' : 'See All'}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={closeNotificationModal}
                style={[styles.closeBtn, { backgroundColor: theme.surfaceLow }]}
                hitSlop={8}
                accessibilityLabel="Close notifications"
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Segmented Time Capsule Tabs */}
          {!showAllUnfiltered && (
            <View style={[styles.tabCapsuleContainer, { backgroundColor: theme.surfaceLow }]}>
              {(
                [
                  { key: 'Today', count: todayList.length },
                  { key: 'This Week', count: weekList.length },
                  { key: 'Earlier', count: earlierList.length },
                ] as const
              ).map((tab) => {
                const isSelected = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.tabCapsuleItem,
                      isSelected && [
                        styles.tabCapsuleSelected,
                        { backgroundColor: theme.surfaceLowest },
                        Shadows.level1,
                      ],
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.tabCapsuleText,
                        {
                          color: isSelected ? theme.text : theme.textSecondary,
                          fontFamily: isSelected ? 'Sora_600SemiBold' : 'Sora_500Medium',
                        },
                      ]}
                    >
                      {tab.key}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Quick Actions (Mark all read & Clear all) */}
          <View style={styles.actionRow}>
            <ThemedText style={[styles.badgeCountText, { color: theme.textSecondary }]}>
              {showAllUnfiltered
                ? `All Notifications (${notifications.length})`
                : `${activeTab} • ${displayedList.length} updates`}
              {unreadCount > 0 ? ` • ${unreadCount} unread` : ''}
            </ThemedText>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {unreadCount > 0 && (
                <Pressable onPress={markAllAsRead} hitSlop={6}>
                  <ThemedText style={[styles.actionLink, { color: theme.primary }]}>
                    Mark all read
                  </ThemedText>
                </Pressable>
              )}
              {notifications.length > 0 && (
                <Pressable onPress={clearAll} hitSlop={6}>
                  <ThemedText style={[styles.actionLink, { color: '#ef4444' }]}>
                    Clear all
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {/* Notification List Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {displayedList.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                <Ionicons name="notifications-outline" size={34} color={theme.textSecondary + '66'} />
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                  No notifications for {showAllUnfiltered ? roleName : activeTab.toLowerCase()}
                </ThemedText>
                <ThemedText style={[styles.emptySub, { color: theme.textSecondary }]}>
                  You're all caught up! New match alerts, slot bookings, and smart AI insights will appear here.
                </ThemedText>
              </View>
            ) : (
              displayedList.map((item, idx) => {
                const iconMeta = getNotifIcon(item.type, item.title);
                const isLast = idx === displayedList.length - 1;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => markAsRead(item.id)}
                    style={({ pressed }) => [
                      styles.notifRow,
                      {
                        borderBottomColor: isLast ? 'transparent' : theme.outlineVariant + '20',
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    {/* Left Circular Outline Icon Badge */}
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: theme.surfaceLowest,
                          borderColor: theme.outlineVariant + '35',
                        },
                        Shadows.level1,
                      ]}
                    >
                      <Ionicons name={iconMeta.name} size={18} color={iconMeta.color} />
                    </View>

                    {/* Middle Content Column */}
                    <View style={styles.contentColumn}>
                      {/* Top Row: Dot + Title + Timestamp */}
                      <View style={styles.titleRow}>
                        <View style={styles.titleDotWrap}>
                          <ThemedText style={[styles.purpleDot, { color: iconMeta.dotColor }]}>
                            •
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.notifTitle,
                              {
                                color: theme.text,
                                fontFamily: item.isRead ? 'Sora_500Medium' : 'Sora_600SemiBold',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
                          {formatTime(item.createdAt)}
                        </ThemedText>
                      </View>

                      {/* Description Text */}
                      <ThemedText
                        style={[styles.bodyText, { color: theme.textSecondary }]}
                      >
                        {item.body}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitleRow: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  seeAllText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11.5,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Segmented Time Capsule Control
  tabCapsuleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 3.5,
    borderRadius: 14,
    marginBottom: 10,
  },
  tabCapsuleItem: {
    flex: 1,
    paddingVertical: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabCapsuleSelected: {
    borderRadius: 11,
  },
  tabCapsuleText: {
    fontSize: 12,
  },

  // Actions row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 6,
  },
  badgeCountText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
  actionLink: {
    fontFamily: 'Sora_500Medium',
    fontSize: 11,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  purpleDot: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  notifTitle: {
    fontSize: 13,
    letterSpacing: -0.1,
    flex: 1,
  },
  timeText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
  },
  bodyText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    lineHeight: 16.5,
    marginTop: 3,
  },

  // Empty State
  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 42,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  emptyTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13.5,
    marginTop: 10,
  },
  emptySub: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
});
