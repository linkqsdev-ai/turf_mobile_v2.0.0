import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { cn } from '@/lib/utils';
import { useTokens } from '@/hooks/use-scheme';
import { Text } from '@/components/ui/text';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  /** Show the chevron back button. Defaults to true when the router can go back. */
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Large title style (weather-app style) instead of centred nav-bar title. */
  large?: boolean;
  transparent?: boolean;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  back = true,
  onBack,
  right,
  large,
  transparent,
  className,
}: AppHeaderProps) {
  const router = useRouter();
  const t = useTokens();
  const canBack = back;

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
  };

  if (large) {
    return (
      <View className={cn('px-gutter pb-2 pt-1', className)}>
        <View className="mb-2 flex-row items-center justify-between">
          {canBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-card"
            >
              <Ionicons name="chevron-back" size={22} color={t.foreground} />
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}
          {right ?? <View className="h-10 w-10" />}
        </View>
        {title ? <Text variant="title">{title}</Text> : null}
        {subtitle ? (
          <Text variant="subtle" className="mt-1">
            {subtitle}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      className={cn(
        'h-header flex-row items-center px-2',
        !transparent && 'border-b border-border bg-background',
        className,
      )}
    >
      <View className="w-12 items-start">
        {canBack ? (
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
          >
            <Ionicons name="chevron-back" size={24} color={t.foreground} />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-1 items-center">
        {title ? (
          <Text variant="callout" className="font-bold" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="min-w-12 flex-row items-center justify-end pr-1">{right}</View>
    </View>
  );
}
