import * as React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';
import { useTokens } from '@/hooks/use-scheme';
import { Text } from './text';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

export function EmptyState({ icon = 'sparkles-outline', title, description, action, className }: EmptyStateProps) {
  const t = useTokens();
  return (
    <View className={cn('items-center justify-center gap-3 px-8 py-16', className)}>
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Ionicons name={icon} size={28} color={t.mutedForeground} />
      </View>
      <Text variant="subheading" className="text-center">
        {title}
      </Text>
      {description ? (
        <Text variant="subtle" className="max-w-[280px] text-center">
          {description}
        </Text>
      ) : null}
      {action ? (
        <Button variant="secondary" size="sm" className="mt-2" onPress={action.onPress}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}
