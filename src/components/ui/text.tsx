import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Type hierarchy rule: **bold weights are reserved for parent (page-level)
// headings** — `display`, `title` and `heading`. Everything nested inside a
// page — card titles, list-item titles, section labels, links — steps down to
// medium/semibold at a slightly smaller size so a screen has exactly one
// dominant voice instead of competing bold text.
const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      // ── parent headings (bold) ──────────────────────────────────────────
      display: 'font-extrabold text-2xl text-foreground',
      title: 'font-bold text-lg text-foreground',
      heading: 'font-bold text-base text-foreground',
      // ── nested headings & body (never bold) ─────────────────────────────
      subheading: 'font-medium text-sm text-foreground',
      body: 'font-sans text-sm text-foreground',
      callout: 'font-medium text-xs text-foreground',
      subtle: 'font-sans text-xs text-muted-foreground',
      caption: 'font-medium text-2xs text-muted-foreground',
      overline: 'font-semibold text-2xs uppercase tracking-widest text-muted-foreground',
      link: 'font-medium text-xs text-primary',
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
