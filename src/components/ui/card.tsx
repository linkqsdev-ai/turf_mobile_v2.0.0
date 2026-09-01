import * as React from 'react';
import { Pressable, View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Text } from './text';

const cardVariants = cva('rounded-2xl border', {
  variants: {
    variant: {
      surface: 'bg-card border-border',
      elevated: 'bg-card-elevated border-border shadow-card',
      outline: 'bg-transparent border-border',
      muted: 'bg-muted border-transparent',
      primary: 'bg-primary-muted border-primary/25',
      glass: 'bg-card/70 border-border/60',
    },
    padded: { true: 'p-4', false: '' },
  },
  defaultVariants: { variant: 'surface', padded: true },
});

export interface CardProps extends ViewProps, VariantProps<typeof cardVariants> {
  className?: string;
  onPress?: () => void;
}

export const Card = React.forwardRef<View, CardProps>(
  ({ className, variant, padded, onPress, ...props }, ref) => {
    if (onPress) {
      // Children render directly on the Pressable — nesting them in a bare
      // inner View dropped every layout class (gap, flex-row, …) passed in
      // `className`, since those live on the Pressable.
      return (
        <Pressable
          ref={ref}
          onPress={onPress}
          className={cn(cardVariants({ variant, padded }), 'active:opacity-95', className)}
          accessibilityRole="button"
          {...(props as any)}
        />
      );
    }
    return <View ref={ref} className={cn(cardVariants({ variant, padded }), className)} {...props} />;
  },
);
Card.displayName = 'Card';

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('mb-3 gap-1', className)} {...props} />;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Text variant="subheading" className={className}>
      {children}
    </Text>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Text variant="subtle" className={className}>
      {children}
    </Text>
  );
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('gap-2', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('mt-4 flex-row items-center gap-3', className)} {...props} />;
}

export { cardVariants };
