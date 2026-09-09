import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';
import { useTokens } from '@/hooks/use-scheme';
import { AppHeader, type AppHeaderProps } from './app-header';

export interface ScreenProps {
  children: React.ReactNode;
  /** Render a standard header above the content. */
  header?: AppHeaderProps | false;
  scroll?: boolean;
  /** Padding around the content area. Defaults to horizontal gutter. */
  padded?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Sticky element pinned to the bottom (e.g. a primary CTA bar). */
  footer?: React.ReactNode;
  scrollProps?: ScrollViewProps;
}

/**
 * The page shell every screen sits in: safe-area aware, themed background,
 * optional header / scroll / pull-to-refresh, a centred max-width column on
 * web, and a sticky footer slot for CTA bars.
 */
export function Screen({
  children,
  header,
  scroll = true,
  padded = true,
  className,
  contentClassName,
  edges = ['top'],
  refreshing,
  onRefresh,
  footer,
  scrollProps,
}: ScreenProps) {
  const t = useTokens();
  const Container = scroll ? ScrollView : View;

  const content = (
    <Container
      {...(scroll
        ? {
            showsVerticalScrollIndicator: false,
            keyboardShouldPersistTaps: 'handled' as const,
            contentContainerStyle: { flexGrow: 1, paddingBottom: footer ? 12 : 32 },
            refreshControl: onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={t.primary}
                colors={[t.primary]}
              />
            ) : undefined,
            ...scrollProps,
          }
        : { style: { flex: 1 } })}
      className={cn(scroll && 'flex-1')}
    >
      <View
        className={cn(
          'w-full flex-1 web:mx-auto web:max-w-[880px]',
          padded && 'px-gutter',
          contentClassName,
        )}
      >
        {children}
      </View>
    </Container>
  );

  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-background', className)}>
      {header ? <AppHeader {...header} /> : null}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
      {footer ? (
        <View className="border-t border-border bg-background px-gutter pb-6 pt-3 web:mx-auto web:w-full web:max-w-[880px]">
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
