import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';

import { BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DashboardSectionLabel } from '@/components/dashboard/analytics-kit';

/**
 * form-section.tsx
 *
 * The form vocabulary used by the enrolment and team registration screens: the
 * dashboard kit's accent-bar section label above a white 12px card of fields,
 * so forms read in the same language as the Home analytics cards.
 *
 * Extracted so the registration screens share one implementation. Team
 * registration had numbered headings ("1. Team Details") and bare fields,
 * which read as a different product from the enrolment flow beside it.
 */

export function SectionHeading({
  title,
  right,
  style,
}: {
  title: string;
  /** Optional trailing content, e.g. a counter or a link. */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return <DashboardSectionLabel label={title} color={theme.primary} right={right} style={[styles.headingRow, style]} />;
}

export function FormCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.formCard,
        { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' },
        Shadows.level2,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Wraps a heading and its card with the section's outer spacing. */
export function FormSection({
  title,
  right,
  children,
  style,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <SectionHeading title={title} right={right} />
      <FormCard>{children}</FormCard>
    </View>
  );
}

/**
 * Field styles matching the enrolment form. Exported rather than duplicated so
 * an input added to either screen looks the same without being re-measured.
 */
export const formStyles = StyleSheet.create({
  inputGroup: { marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputLabel: { fontFamily: 'Sora_500Medium', fontSize: 11.5, marginBottom: 5 },
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Sora_400Regular',
    fontSize: 12.5,
    ...({ outlineStyle: 'none' } as any),
    includeFontPadding: false,
    paddingVertical: 0,
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 11, fontFamily: 'Sora_500Medium' },
  counter: { fontSize: 10, fontFamily: 'Sora_500Medium' },
});

const styles = StyleSheet.create({
  section: { marginTop: 16 },
  headingRow: { marginBottom: 8, marginLeft: 2 },
  formCard: { borderRadius: BorderRadius.premium, borderWidth: 1, padding: 14 },
});
