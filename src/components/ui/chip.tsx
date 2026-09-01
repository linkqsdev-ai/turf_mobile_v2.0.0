import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Chip({ label, selected, onPress, leftIcon, className, disabled }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-80',
        selected ? 'border-primary bg-primary' : 'border-border bg-card',
        disabled && 'opacity-40',
        className,
      )}
    >
      {leftIcon}
      <Text
        className={cn(
          'font-medium text-sm',
          selected ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Horizontally scrollable single-select chip row. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly T[] | { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const normalized = (options as any[]).map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o,
  ) as { label: string; value: T }[];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
      className={cn('flex-row', className)}
    >
      {normalized.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          selected={o.value === value}
          onPress={() => onChange(o.value)}
        />
      ))}
      <View className="w-2" />
    </ScrollView>
  );
}
