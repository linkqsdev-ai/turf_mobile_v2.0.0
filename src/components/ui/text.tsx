import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      display: 'font-extrabold text-4xl text-foreground',
      title: 'font-bold text-2xl text-foreground',
      heading: 'font-bold text-xl text-foreground',
      subheading: 'font-semibold text-lg text-foreground',
      body: 'font-sans text-base text-foreground',
      callout: 'font-medium text-base text-foreground',
      subtle: 'font-sans text-sm text-muted-foreground',
      caption: 'font-medium text-xs text-muted-foreground',
      overline: 'font-bold text-2xs uppercase tracking-widest text-muted-foreground',
      link: 'font-semibold text-base text-primary',
    },
  },
  defaultVariants: { variant: 'body' },
});

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string;
}

/**
 * Typographic primitive. RN does not inherit text styles across Views, so every
 * string must live inside one of these — pick a `variant` and it carries the
 * Sora family, size and colour token for you.
 */
export const Text = React.forwardRef<RNText, TextProps>(
  ({ className, variant, ...props }, ref) => (
    <RNText ref={ref} className={cn(textVariants({ variant }), className)} {...props} />
  ),
);
Text.displayName = 'Text';

export { textVariants };
