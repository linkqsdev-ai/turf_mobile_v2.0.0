import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

export function Separator({
  className,
  orientation = 'horizontal',
}: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <View
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}

/** Divider with a centred label, e.g. "or continue with". */
export function LabeledSeparator({ children, className }: { children: string; className?: string }) {
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <View className="h-px flex-1 bg-border" />
      <Text variant="caption">{children}</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
