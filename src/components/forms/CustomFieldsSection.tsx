/**
 * CustomFieldsSection.tsx
 *
 * Renders the fields a Super Admin added to a form. Each host screen passes its
 * own colours and label style so the extra fields sit in its design rather than
 * looking bolted on.
 */

import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextStyle } from 'react-native';
import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import type { CustomAnswers, RemoteField } from '@/lib/remote-config';

export interface CustomFieldPalette {
  label: string;
  text: string;
  placeholder: string;
  fieldBg: string;
  border: string;
  accent: string;
}

interface Props {
  fields: RemoteField[];
  values: CustomAnswers;
  onChange: (key: string, value: string) => void;
  palette: CustomFieldPalette;
  labelStyle?: StyleProp<TextStyle>;
}

const KEYBOARD: Partial<Record<RemoteField['type'], 'number-pad' | 'phone-pad' | 'email-address' | 'numbers-and-punctuation'>> = {
  number: 'number-pad',
  phone: 'phone-pad',
  email: 'email-address',
  date: 'numbers-and-punctuation',
};

const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : null;

export function CustomFieldsSection({ fields, values, onChange, palette, labelStyle }: Props) {
  const [focused, setFocused] = useState<string | null>(null);
  if (fields.length === 0) return null;

  return (
    <View style={styles.stack}>
      {fields.map((f) => {
        const value = values[f.key] ?? '';
        const label = `${f.label}${f.required ? ' *' : ''}`;
        const borderColor = focused === f.key ? palette.accent : palette.border;

        return (
          <View key={f.key}>
            <ThemedText style={[styles.label, { color: palette.label }, labelStyle]}>{label}</ThemedText>
            {f.type === 'select' ? (
              <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={f.label}>
                {(f.options ?? []).map((option) => {
                  const on = value === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => onChange(f.key, on && !f.required ? '' : option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      style={[
                        styles.chip,
                        { borderColor: on ? palette.accent : palette.border, backgroundColor: on ? palette.accent + '18' : palette.fieldBg },
                      ]}
                    >
                      <ThemedText style={[styles.chipText, { color: on ? palette.accent : palette.text }]}>{option}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={[f.type === 'textarea' ? styles.areaBox : styles.box, { backgroundColor: palette.fieldBg, borderColor }]}>
                <TextInput
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                  value={value}
                  onChangeText={(text) => onChange(f.key, f.maxLength ? text.slice(0, f.maxLength) : text)}
                  placeholder={f.placeholder ?? (f.type === 'date' ? 'YYYY-MM-DD' : undefined)}
                  placeholderTextColor={palette.placeholder}
                  keyboardType={KEYBOARD[f.type] ?? 'default'}
                  autoCapitalize={f.type === 'email' ? 'none' : 'sentences'}
                  multiline={f.type === 'textarea'}
                  maxLength={f.maxLength}
                  accessibilityLabel={f.label}
                  onFocus={() => setFocused(f.key)}
                  onBlur={() => setFocused(null)}
                  style={[f.type === 'textarea' ? styles.areaInput : styles.input, { color: palette.text }, webInput]}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  label: { fontSize: 11, fontFamily: 'Sora_500Medium', marginBottom: 6 },
  box: { height: 44, borderRadius: 12, borderWidth: 1.2, paddingHorizontal: 12, justifyContent: 'center' },
  input: { flex: 1, fontSize: 12.5, fontFamily: 'Sora_400Regular' },
  areaBox: { minHeight: 84, borderRadius: 12, borderWidth: 1.2, padding: 11 },
  areaInput: { flex: 1, minHeight: 60, fontSize: 12, fontFamily: 'Sora_400Regular', textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 34, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 11.5, fontFamily: 'Sora_500Medium' },
});
