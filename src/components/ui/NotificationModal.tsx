import React, { useState } from 'react';
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

  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread'>('All');
  const roleName = profile?.role || 'Player';

  const displayedList = notifications.filter(n => {
    if (activeFilter === 'Unread') return !n.isRead;
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return { name: 'hand-left' as const, color: '#5D68E8', bg: '#5D68E81A' };
      case 'booking':
        return { name: 'calendar' as const, color: '#10B981', bg: '#10B9811A' };
      case 'tournament':
        return { name: 'trophy' as const, color: '#F59E0B', bg: '#F59E0B1A' };
      case 'class':
        return { name: 'school' as const, color: '#8B5CF6', bg: '#8B5CF61A' };
      default:
        return { name: 'notifications' as const, color: '#3B82F6', bg: '#3B82F61A' };
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
      return `${Math.floor(hours / 24)}d ago`;
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
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.outlineVariant + '33' }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.bellWrap, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="notifications" size={20} color={theme.primary} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <ThemedText type="headlineLg" style={{ fontFamily: 'Sora_600SemiBold' }}>
                  Notifications
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <ThemedText type="labelSm" style={{ color: theme.textSecondary }}>
                    {unreadCount} unread
                  </ThemedText>
                </View>
              </View>
            </View>

            <Pressable onPress={closeNotificationModal} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* Filter Bar & Quick Actions */}
          <View style={styles.actionRow}>
            <View style={styles.tabGroup}>
              <Pressable
                onPress={() => setActiveFilter('All')}
                style={[
                  styles.tabChip,
                  activeFilter === 'All' && { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText
                  type="labelMd"
                  style={{
                    color: activeFilter === 'All' ? '#ffffff' : theme.textSecondary,
                    fontFamily: 'Sora_600SemiBold',
                  }}
                >
                  All ({notifications.length})
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setActiveFilter('Unread')}
                style={[
                  styles.tabChip,
                  activeFilter === 'Unread' && { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText
                  type="labelMd"
                  style={{
                    color: activeFilter === 'Unread' ? '#ffffff' : theme.textSecondary,
                    fontFamily: 'Sora_600SemiBold',
                  }}
                >
                  Unread ({unreadCount})
                </ThemedText>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              {unreadCount > 0 && (
                <Pressable onPress={markAllAsRead}>
                  <ThemedText type="labelSm" style={{ color: theme.primary, fontFamily: 'Sora_600SemiBold' }}>
                    Mark all read
                  </ThemedText>
                </Pressable>
              )}
              {notifications.length > 0 && (
                <Pressable onPress={clearAll}>
                  <ThemedText type="labelSm" style={{ color: '#EF4444', fontFamily: 'Sora_600SemiBold' }}>
                    Clear all
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {/* List Content */}
          <ScrollView contentContainerStyle={styles.listContent}>
            {displayedList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
                <ThemedText type="bodyMd" style={{ color: theme.textSecondary, marginTop: 12, textAlign: 'center' }}>
                  No notifications for {roleName} role.
                </ThemedText>
              </View>
            ) : (
              displayedList.map(item => {
                const iconMeta = getNotifIcon(item.type);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => markAsRead(item.id)}
                    style={({ pressed }) => [
                      styles.notifCard,
                      Shadows.level1,
                      {
                        backgroundColor: item.isRead ? theme.surfaceLowest : theme.primary + '0A',
                        borderColor: item.isRead ? theme.outlineVariant + '33' : theme.primary + '40',
                        transform: [{ scale: pressed ? 0.99 : 1 }],
                      },
                    ]}
                  >
                    {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                    <View style={[styles.iconBox, { backgroundColor: iconMeta.bg }]}>
                      <Ionicons name={iconMeta.name} size={20} color={iconMeta.color} />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ThemedText
                          type="bodyMd"
                          style={{
                            fontFamily: item.isRead ? 'Sora_600SemiBold' : 'Sora_600SemiBold',
                            flex: 1,
                            marginRight: 6,
                          }}
                        >
                          {item.title}
                        </ThemedText>
                        <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 10 }}>
                          {formatTime(item.createdAt)}
                        </ThemedText>
                      </View>

                      <ThemedText
                        type="bodySm"
                        style={{ color: theme.textSecondary, marginTop: 3, fontSize: 11.5, lineHeight: 16 }}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    padding: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'flex-start',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
});
