import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Shadows } from '@/constants/theme';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

export interface Notice {
  tone: NoticeTone;
  title: string;
  message?: string;
  /** Bump to re-trigger the entrance animation for a repeated message. */
  key?: number;
}

const TONES: Record<NoticeTone, { icon: keyof typeof Ionicons.glyphMap; color: string; dotColor: string }> = {
  info: { icon: 'bulb-outline', color: '#8B5CF6', dotColor: '#8B5CF6' },
  success: { icon: 'checkmark-circle-outline', color: '#10B981', dotColor: '#10B981' },
  warning: { icon: 'warning-outline', color: '#F59E0B', dotColor: '#F59E0B' },
  error: { icon: 'close-circle-outline', color: '#EF4444', dotColor: '#EF4444' },
};

/**
 * A compact feedback banner for use *inside* a native <Modal>.
 *
 * The global toast (`useToast`) renders as a sibling of the app tree, so it is
 * painted behind any modal window and would be invisible there. Anything that
 * needs to tell the user something from within a modal should render one of
 * these instead.
 */
export function InlineNotice({
  notice,
  onDismiss,
  autoHideMs = 3000,
}: {
  notice: Notice | null;
  onDismiss?: () => void;
  autoHideMs?: number;
}) {
  const theme = useTheme();

  useEffect(() => {
    if (!notice || !onDismiss || autoHideMs <= 0) return;
    const id = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(id);
  }, [notice, onDismiss, autoHideMs]);

  if (!notice) return null;
  const tone = TONES[notice.tone];

  return (
    <Reanimated.View
      key={notice.key ?? notice.title}
      entering={FadeInDown.duration(220)}
      exiting={FadeOut.duration(160)}
      style={[
        styles.card,
        Shadows.level1,
        {
          backgroundColor: theme.surfaceLowest,
          borderColor: theme.outlineVariant + '35',
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.surfaceLow,
            borderColor: theme.outlineVariant + '28',
          },
        ]}
      >
        <Ionicons name={tone.icon} size={18} color={tone.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText style={[styles.coloredDot, { color: tone.dotColor }]}>•</ThemedText>
          <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {notice.title}
          </ThemedText>
        </View>
        {notice.message ? (
          <ThemedText style={[styles.message, { color: theme.textSecondary }]} numberOfLines={2}>
            {notice.message}
          </ThemedText>
        ) : null}
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coloredDot: {
    fontSize: 13,
    lineHeight: 15,
    fontWeight: 'bold',
  },
  title: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12.5,
    letterSpacing: -0.1,
    flex: 1,
  },
  message: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
