import React from 'react';
import { StyleSheet, View, TextStyle, StyleProp } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * field-label.tsx
 *
 * A form field's label row, with an optional character counter on the right.
 *
 * The counter pattern was written inline in create-class.tsx and nowhere else,
 * so every other capped field silently stopped accepting input with no
 * explanation. Sharing it means a cap is always visible before the user hits
 * it, and the counter can't drift from the `maxLength` it describes.
 */

export interface FieldLabelProps {
  label: string;
  /** Renders a red asterisk after the label. */
  required?: boolean;
  /** Current length. Pass alongside `max` to show the counter. */
  current?: number;
  /** The same number given to the input's `maxLength`. */
  max?: number;
  style?: StyleProp<TextStyle>;
}

export function FieldLabel({ label, required, current, max, style }: FieldLabelProps) {
  const theme = useTheme();
  const showCounter = typeof current === 'number' && typeof max === 'number' && max > 0;
  const atLimit = showCounter && (current as number) >= (max as number);

  return (
    <View style={styles.row}>
      <ThemedText style={[styles.label, { color: theme.textSecondary }, style]}>
        {label}
        {required && <ThemedText style={styles.required}> *</ThemedText>}
      </ThemedText>

      {showCounter && (
        <ThemedText
          style={[styles.counter, { color: atLimit ? '#ef4444' : theme.textSecondary }]}
          // The count is decoration around the field it labels; announcing it
          // on every keystroke would talk over the input itself.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {current}/{max}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Without a gap these two butt together once the label is long.
    gap: 8,
    marginBottom: 4,
  },
  label: { fontSize: 11, fontFamily: 'Sora_500Medium', flexShrink: 1, minWidth: 0 },
  required: { color: '#ef4444' },
  counter: { fontSize: 10, fontFamily: 'Sora_500Medium', flexShrink: 0 },
});
