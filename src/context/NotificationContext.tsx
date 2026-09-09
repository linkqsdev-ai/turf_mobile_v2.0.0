import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from './ToastContext';

export type NotificationType = 'bid' | 'booking' | 'tournament' | 'class' | 'system';
export type TargetRole = 'Player' | 'Owner' | 'Coach' | 'All';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  targetRole: TargetRole;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (item: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  isModalOpen: boolean;
  openNotificationModal: () => void;
  closeNotificationModal: () => void;
}

const STORAGE_KEY = '@turf_role_notifications_v2';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  // Player notifications
  {
    id: 'n1',
    title: 'Bid Match Challenge Active!',
    body: 'Rahul XI placed a 200 Coins bid challenge for Today, 8:00 PM at Skyline Turf Arena.',
    type: 'bid',
    targetRole: 'Player',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'n2',
    title: 'Booking Confirmed: Camp Nou Turf',
    body: 'Your slot for Mon, 24 Jun 2026 at 12:00 PM is confirmed. Booking Ref: TURF-8924.',
    type: 'booking',
    targetRole: 'Player',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'n3',
    title: 'Tournament Open: Champions League',
    body: 'Registration is now live! Entry fee ₹1,500. Grand prize ₹50,000.',
    type: 'tournament',
    targetRole: 'Player',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },

  // Owner notifications
  {
    id: 'n4',
    title: 'New Booking Received! (₹120)',
    body: 'Messi Player booked Court #1 at Camp Nou Turf for 6:00 PM.',
    type: 'booking',
    targetRole: 'Owner',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n5',
    title: 'Daily Revenue Summary: ₹14,500',
    body: '12 slot bookings confirmed today across all your registered turfs.',
    type: 'system',
    targetRole: 'Owner',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },

  // Coach notifications
  {
    id: 'n6',
    title: 'New Student Enrollment!',
    body: 'Alex Morgan enrolled in your Weekend Masterclass Session.',
    type: 'class',
    targetRole: 'Coach',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'n7',
    title: 'Session Reminder: 5:00 PM',
    body: 'Pro Net Coaching session scheduled at Skyline Turf, Court #2.',
    type: 'class',
    targetRole: 'Coach',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [rawNotifications, setRawNotifications] = useState<AppNotification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useUserProfile();
  const { showToast } = useToast();

  const userRole = (profile?.role || 'Player') as TargetRole;

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setRawNotifications(JSON.parse(stored));
        } else {
          setRawNotifications(INITIAL_NOTIFICATIONS);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
        }
      } catch (e) {
        console.error('NotificationContext: Failed to load', e);
      }
    })();
  }, []);

  // Filter notifications relevant to current active user role
  const roleNotifications = rawNotifications.filter(
    n => !n.targetRole || n.targetRole.toLowerCase() === 'all' || n.targetRole.toLowerCase() === userRole.toLowerCase()
  );

  const unreadCount = roleNotifications.filter(n => !n.isRead).length;

  const saveNotifications = useCallback(async (list: AppNotification[]) => {
    try {
      setRawNotifications(list);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('NotificationContext: Failed to save', e);
    }
  }, []);

  const addNotification = useCallback(
    (item: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
      const newNotif: AppNotification = {
        ...item,
        id: `notif-${Date.now()}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setRawNotifications(prev => {
        const next = [newNotif, ...prev];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      // Always trigger Push Notification Toast for immediate feedback!
      showToast({
        title: item.title,
        message: item.body,
        type: item.type === 'bid' || item.type === 'booking' ? 'success' : 'info',
        duration: 4000,
      });
    },
    [showToast]
  );

  const markAsRead = useCallback((id: string) => {
    setRawNotifications(prev => {
      const next = prev.map(n => (n.id === id ? { ...n, isRead: true } : n));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setRawNotifications(prev => {
      const next = prev.map(n =>
        n.targetRole === 'All' || n.targetRole === userRole ? { ...n, isRead: true } : n
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [userRole]);

  const clearAll = useCallback(() => {
    setRawNotifications(prev => {
      const next = prev.filter(n => n.targetRole !== 'All' && n.targetRole !== userRole);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [userRole]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: roleNotifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        isModalOpen,
        openNotificationModal: () => setIsModalOpen(true),
        closeNotificationModal: () => setIsModalOpen(false),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
