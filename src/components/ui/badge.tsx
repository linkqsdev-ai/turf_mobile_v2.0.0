import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Text } from './text';

const badgeVariants = cva('flex-row items-center gap-1 self-start rounded-full px-2.5 py-1', {
  variants: {
    variant: {
      primary: 'bg-primary/15',
      accent: 'bg-accent/15',
      success: 'bg-success/15',
      warning: 'bg-warning/15',
      destructive: 'bg-destructive/15',
      info: 'bg-info/15',
      muted: 'bg-muted',
      outline: 'border border-border bg-transparent',
    },
    size: { sm: 'px-2 py-0.5', md: 'px-2.5 py-1' },
  },
  defaultVariants: { variant: 'muted', size: 'md' },
});

const badgeText = cva('font-semibold text-2xs uppercase tracking-wider', {
  variants: {
    variant: {
      primary: 'text-primary',
      accent: 'text-accent',
      success: 'text-success',
      warning: 'text-warning',
      destructive: 'text-destructive',
      info: 'text-info',
      muted: 'text-muted-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: { variant: 'muted' },
});

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({ className, textClassName, variant, size, children, dot, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot ? <View className={cn('h-1.5 w-1.5 rounded-full', dotColor(variant))} /> : null}
      {typeof children === 'string' ? (
        <Text className={cn(badgeText({ variant }), textClassName)}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

function dotColor(variant: BadgeProps['variant']) {
  switch (variant) {
    case 'primary':
      return 'bg-primary';
    case 'accent':
      return 'bg-accent';
    case 'success':
      return 'bg-success';
    case 'warning':
      return 'bg-warning';
    case 'destructive':
      return 'bg-destructive';
    case 'info':
      return 'bg-info';
    default:
      return 'bg-muted-foreground';
  }
}

export { badgeVariants };
