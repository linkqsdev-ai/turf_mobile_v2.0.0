import * as React from 'react';
import { Pressable, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

export interface SectionProps extends ViewProps {
  title?: string;
  action?: { label: string; onPress: () => void };
  className?: string;
  headerClassName?: string;
}

export function Section({ title, action, className, headerClassName, children, ...props }: SectionProps) {
  return (
    <View className={cn('gap-3', className)} {...props}>
      {(title || action) && (
        <View className={cn('flex-row items-center justify-between', headerClassName)}>
          {title ? <Text variant="overline">{title}</Text> : <View />}
          {action ? (
            <Pressable onPress={action.onPress} hitSlop={8}>
              <Text variant="link" className="text-sm">
                {action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}
