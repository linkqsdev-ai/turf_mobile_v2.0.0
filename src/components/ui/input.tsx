import * as React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useTokens } from '@/hooks/use-scheme';
import { Text } from './text';

export interface InputProps extends TextInputProps {
  className?: string;
  containerClassName?: string;
  label?: string;
  error?: string;
  hint?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    { className, containerClassName, label, error, hint, leftSlot, rightSlot, onFocus, onBlur, ...props },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const t = useTokens();

    return (
      <View className={cn('gap-1.5', containerClassName)}>
        {label ? (
          <Text variant="caption" className="text-foreground">
            {label}
          </Text>
        ) : null}
        <View
          className={cn(
            'h-12 flex-row items-center gap-2 rounded-xl border border-input bg-card px-3.5',
            focused && 'border-ring',
            error && 'border-destructive',
          )}
        >
          {leftSlot}
          <TextInput
            ref={ref}
            placeholderTextColor={t.mutedForeground}
            selectionColor={t.primary}
            className={cn(
              'h-full flex-1 font-sans text-base text-foreground',
              // strip web focus ring; RN ignores unknown props harmlessly
              'outline-none',
              className,
            )}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          {rightSlot}
        </View>
        {error ? (
          <Text variant="caption" className="text-destructive">
            {error}
          </Text>
        ) : hint ? (
          <Text variant="caption">{hint}</Text>
        ) : null}
      </View>
    );
  },
);
Input.displayName = 'Input';
