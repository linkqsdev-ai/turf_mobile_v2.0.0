import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Reanimated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Shadows } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback(({ title, message, type = 'info', duration = 3500 }: ToastOptions) => {
    const id = Date.now();
    setToast({ id, title, message, type, duration });

    if (duration > 0) {
      setTimeout(() => {
        setToast(current => (current?.id === id ? null : current));
      }, duration);
    }
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    showToast({ title, message, type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    showToast({ title, message, type: 'error', duration });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    showToast({ title, message, type: 'warning', duration });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    showToast({ title, message, type: 'info', duration });
  }, [showToast]);

  const getToastConfig = (type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle-outline' as const,
          color: '#10B981',
          dotColor: '#10B981',
        };
      case 'error':
        return {
          icon: 'close-circle-outline' as const,
          color: '#EF4444',
          dotColor: '#EF4444',
        };
      case 'warning':
        return {
          icon: 'warning-outline' as const,
          color: '#F59E0B',
          dotColor: '#F59E0B',
        };
      case 'info':
      default:
        return {
          icon: 'bulb-outline' as const,
          color: '#8B5CF6',
          dotColor: '#8B5CF6',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, hideToast }}>
      {children}
      {/* NOTE: this renders as a sibling of `children`, so it sits *behind* any
          native <Modal>. Screens inside a modal should surface feedback with
          <InlineNotice> instead of a toast. */}
      {toast ? (
        <View
          style={[styles.toastOverlay, { top: Math.max(insets.top + 8, 14) }]}
          pointerEvents="box-none"
        >
          <Reanimated.View
            entering={SlideInUp.springify().damping(18).stiffness(140)}
            exiting={SlideOutUp.duration(200)}
            style={{ width: '92%', maxWidth: 390, alignItems: 'center' }}
          >
            <Pressable
              onPress={hideToast}
              style={[
                styles.toastCard,
                Shadows.level2,
                {
                  backgroundColor: theme.surfaceLowest,
                  borderColor: theme.outlineVariant + '35',
                  alignItems: toast.message ? 'flex-start' : 'center',
                },
              ]}
            >
              {/* Left Circular Outline Icon Badge */}
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: theme.surfaceLow,
                    borderColor: theme.outlineVariant + '28',
                    marginTop: toast.message ? 1 : 0,
                  },
                ]}
              >
                <Ionicons
                  name={getToastConfig(toast.type).icon}
                  size={16}
                  color={getToastConfig(toast.type).color}
                />
              </View>

              {/* Middle & Right Content */}
              <View style={styles.contentWrap}>
                {/* Title row with colored status dot and timestamp */}
                <View style={styles.titleRow}>
                  <View style={styles.titleDotWrap}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getToastConfig(toast.type).dotColor },
                      ]}
                    />
                    <ThemedText
                      style={[styles.titleText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {toast.title}
                    </ThemedText>
                  </View>

                  <ThemedText style={[styles.timeBadge, { color: theme.textSecondary }]}>
                    Just now
                  </ThemedText>
                </View>

                {/* Message */}
                {toast.message ? (
                  <ThemedText
                    style={[styles.messageText, { color: theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {toast.message}
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
          </Reanimated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  titleDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  titleText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12.5,
    letterSpacing: -0.1,
    flex: 1,
  },
  timeBadge: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
  },
  messageText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
