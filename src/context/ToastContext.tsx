import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
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
          icon: 'checkmark-circle' as const,
          color: '#10B981',
          bgTint: '#10B98115',
          border: '#10B98180',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: '#EF4444',
          bgTint: '#EF444415',
          border: '#EF444480',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: '#F59E0B',
          bgTint: '#F59E0B15',
          border: '#F59E0B80',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: '#5D68E8',
          bgTint: '#5D68E815',
          border: '#5D68E880',
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
        <View style={styles.toastOverlay} pointerEvents="none">
          <Reanimated.View
              entering={SlideInUp.springify().damping(15).stiffness(120)}
              exiting={SlideOutUp.duration(200)}
              style={[
                styles.toastCard,
                Shadows.level3,
                {
                  backgroundColor: theme.surfaceLowest,
                  borderColor: getToastConfig(toast.type).border,
                },
              ]}
            >
              {/* Colored left bar accent */}
              <View style={[styles.leftAccent, { backgroundColor: getToastConfig(toast.type).color }]} />

              {/* Icon Container */}
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: getToastConfig(toast.type).bgTint },
                ]}
              >
                <Ionicons
                  name={getToastConfig(toast.type).icon}
                  size={24}
                  color={getToastConfig(toast.type).color}
                />
              </View>

              {/* Text Content */}
              <View style={styles.contentWrap}>
                <ThemedText type="bodyMd" style={styles.titleText}>
                  {toast.title}
                </ThemedText>
                {toast.message ? (
                  <ThemedText type="bodySm" style={{ color: theme.textSecondary, fontSize: 11 }}>
                    {toast.message}
                  </ThemedText>
                ) : null}
              </View>
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
    top: 50,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  contentWrap: {
    flex: 1,
    marginLeft: 12,
  },
  titleText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13.5,
  },
});
