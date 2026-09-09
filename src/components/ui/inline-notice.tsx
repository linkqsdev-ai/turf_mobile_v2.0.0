import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

export interface Notice {
  tone: NoticeTone;
  title: string;
  message?: string;
  /** Bump to re-trigger the entrance animation for a repeated message. */
  key?: number;
}

const TONES: Record<NoticeTone, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  info: { icon: 'information-circle', color: '#5D68E8' },
  success: { icon: 'checkmark-circle', color: '#10B981' },
  warning: { icon: 'warning', color: '#F59E0B' },
  error: { icon: 'close-circle', color: '#EF4444' },
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
        { backgroundColor: theme.surfaceLowest, borderColor: tone.color + '66' },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.color + '1A' }]}>
        <Ionicons name={tone.icon} size={16} color={tone.color} />
      </View>
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: theme.text }]}>{notice.title}</ThemedText>
        {notice.message ? (
          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
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
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontFamily: 'Sora_500Medium', fontSize: 12 },
  message: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: 1 },
});
