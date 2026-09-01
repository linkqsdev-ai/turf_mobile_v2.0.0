import * as React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useScheme } from '@/hooks/use-scheme';
import { cn } from '@/lib/utils';
import { MotionView } from '@/components/motion';

/**
 * Branded backdrop for the auth flow: a deep floodlit gradient with soft
 * pitch-green glows, a centred max-width column on web, and a scroll +
 * keyboard-avoiding content area.
 */
export function AuthShell({
  children,
  scroll = true,
  contentClassName,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentClassName?: string;
}) {
  const scheme = useScheme();
  const grad =
    scheme === 'dark'
      ? (['#0A0F0D', '#0C1512', '#0A0F0D'] as const)
      : (['#0A0F0D', '#0E1A15', '#0A100D'] as const);

  const Body = scroll ? ScrollView : View;

  return (
    <View className="flex-1 bg-background">
      <LinearGradient colors={grad} className="absolute inset-0" />
      {/* floodlight glows */}
      <View className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <View className="absolute -right-20 top-32 h-56 w-56 rounded-full bg-info/10 blur-3xl" />
      <View className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Body
            {...(scroll
              ? {
                  showsVerticalScrollIndicator: false,
                  keyboardShouldPersistTaps: 'handled' as const,
                  contentContainerStyle: { flexGrow: 1, justifyContent: 'center' },
                }
              : { style: { flex: 1, justifyContent: 'center' } })}
          >
            <MotionView
              preset="fade-up"
              className={cn(
                'w-full self-center px-gutter py-8 web:max-w-[440px]',
                contentClassName,
              )}
            >
              {children}
            </MotionView>
          </Body>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
