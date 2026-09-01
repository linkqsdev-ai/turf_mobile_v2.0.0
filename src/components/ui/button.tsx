import * as React from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { tokens } from '@/lib/tokens';
import { Text } from './text';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-full active:opacity-90 transition-transform',
  {
    variants: {
      variant: {
        primary: 'bg-primary active:scale-[0.98]',
        accent: 'bg-accent active:scale-[0.98]',
        secondary: 'bg-secondary',
        outline: 'border border-border bg-transparent',
        ghost: 'bg-transparent',
        destructive: 'bg-destructive active:scale-[0.98]',
      },
      size: {
        sm: 'h-9 px-4',
        md: 'h-12 px-5',
        lg: 'h-14 px-7',
        icon: 'h-11 w-11 px-0',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

const labelVariants = cva('font-semibold text-sm', {
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      accent: 'text-accent-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
    },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base', icon: 'text-sm' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

export interface ButtonProps
  extends Omit<PressableProps, 'children' | 'style'>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      children,
      className,
      textClassName,
      variant,
      size,
      block,
      loading,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const spinnerColor =
      variant === 'destructive'
        ? tokens[scheme].destructiveForeground
        : variant === 'accent'
          ? tokens[scheme].accentForeground
          : variant === 'outline' || variant === 'ghost' || variant === 'secondary'
            ? tokens[scheme].foreground
            : tokens[scheme].primaryForeground;
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
        disabled={isDisabled}
        className={cn(
          buttonVariants({ variant, size, block }),
          isDisabled && 'opacity-50',
          className,
        )}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          <>
            {leftIcon}
            {typeof children === 'string' ? (
              <Text className={cn(labelVariants({ variant, size }), textClassName)}>{children}</Text>
            ) : (
              children
            )}
            {rightIcon}
          </>
        )}
      </Pressable>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
