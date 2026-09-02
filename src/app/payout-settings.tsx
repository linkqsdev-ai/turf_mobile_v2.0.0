/**
 * payout-settings.tsx
 *
 * Where a turf owner, coach or organizer configures the billing identity we
 * pay them against: registered address, GST/PAN, and bank or UPI details.
 *
 * The screen deliberately shows the revenue split up front. A payee should be
 * able to see exactly what the platform deducts (₹3/slot + GST) and what
 * happens when a player redeems a voucher, without having to ask support.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTypeRamp } from '@/lib/typography';
import { useToast } from '@/context/ToastContext';
import {
  PLATFORM_FEE_PER_SLOT,
  PLATFORM_FEE_GST_RATE,
  computeSettlement,
} from '@/lib/settlement';
import {
  createPayeeProfile,
  maskAccountNumber,
  payoutReadiness,
  type PayeeProfile,
  type PayeeRole,
  type PayoutMethod,
} from '@/store/payout-store';

const STORAGE_KEY = '@turf_payout_profile';

const ROLES: { key: PayeeRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'owner', label: 'Turf Owner', icon: 'business-outline' },
  { key: 'coach', label: 'Coach', icon: 'fitness-outline' },
  { key: 'organizer', label: 'Organizer', icon: 'trophy-outline' },
];

export default function PayoutSettingsScreen() {
  const theme = useTheme();
  const type = useTypeRamp();
  const router = useRouter();
  const { showSuccess, showWarning } = useToast();

  const [role, setRole] = useState<PayeeRole>('owner');
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [method, setMethod] = useState<PayoutMethod>('bank');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [saved, setSaved] = useState<PayeeProfile | null>(null);
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const p: PayeeProfile = JSON.parse(raw);
        setSaved(p);
        setRole(p.role);
        setLegalName(p.legalName || '');
        setDisplayName(p.displayName || '');
        setLine1(p.address?.line1 || '');
        setLine2(p.address?.line2 || '');
        setCity(p.address?.city || '');
        setState(p.address?.state || '');
        setPincode(p.address?.pincode || '');
        setPan(p.panNumber || '');
        setGstin(p.gstin || '');
        setMethod(p.payoutMethod || 'bank');
        setAccountName(p.bank?.accountName || '');
        setAccountNumber(p.bank?.accountNumber || '');
        setIfsc(p.bank?.ifsc || '');
        setBankName(p.bank?.bankName || '');
        setUpiId(p.upiId || '');
      } catch {
        // A corrupt stored profile should not block the form — start blank.
      }
    })();
  }, []);

  const draft = useMemo(
    () => ({
      role,
      legalName,
      displayName: displayName || undefined,
      address: { line1, line2: line2 || undefined, city, state, pincode },
      panNumber: pan || undefined,
      gstin: gstin || undefined,
      payoutMethod: method,
      bank:
        method === 'bank'
          ? { accountName, accountNumber, ifsc, bankName: bankName || undefined }
          : undefined,
      upiId: method === 'upi' ? upiId : undefined,
    }),
    [role, legalName, displayName, line1, line2, city, state, pincode, pan, gstin, method, accountName, accountNumber, ifsc, bankName, upiId]
  );

  const readiness = useMemo(() => payoutReadiness(draft), [draft]);

  /** A worked example, so the split is concrete rather than a policy sentence. */
  const example = useMemo(
    () =>
      computeSettlement({
        slotCount: 4,
        pricePerSlot: 500,
        discount: { code: 'SALE50', amount: 500, funder: 'platform' },
      }),
    []
  );

  const issueFor = (field: string) =>
    showIssues ? readiness.issues.find((i) => i.field === field)?.message : undefined;

  const handleSave = async () => {
    if (!readiness.payable) {
      setShowIssues(true);
      showWarning(`${readiness.issues.length} detail${readiness.issues.length === 1 ? '' : 's'} still need fixing`);
      return;
    }
    const profile = createPayeeProfile(draft as any);
    // Keep the original id and creation date across edits — this is the same payee.
    const next: PayeeProfile = saved
      ? { ...profile, id: saved.id, createdAt: saved.createdAt, updatedAt: new Date().toISOString() }
      : profile;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(next);
    setShowIssues(false);
    showSuccess('Payout details saved');
  };

  const field = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    opts: { placeholder?: string; keyboardType?: any; autoCapitalize?: any; maxLength?: number; fieldKey?: string } = {}
  ) => {
    const err = opts.fieldKey ? issueFor(opts.fieldKey) : undefined;
    return (
      <View style={{ marginBottom: Spacing.md }}>
        <ThemedText style={[type.micro, styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={opts.placeholder}
          placeholderTextColor={theme.placeholder}
          keyboardType={opts.keyboardType}
          autoCapitalize={opts.autoCapitalize}
          maxLength={opts.maxLength}
          style={[
            styles.input,
            type.body,
            {
              color: theme.text,
              backgroundColor: theme.surfaceLow,
              borderColor: err ? theme.error : theme.outlineVariant + '44',
            },
            Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0 } as any }),
          ]}
        />
        {err && (
          <View style={styles.errRow}>
            <Ionicons name="alert-circle" size={11} color={theme.error} />
            <ThemedText style={[type.micro, { color: theme.error, flexShrink: 1 }]}>{err}</ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <GradientContainer screenName="settings" style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.outlineVariant + '33' }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={8}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[type.title, { color: theme.text }]}>Payout & Tax Details</ThemedText>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Status */}
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: readiness.payable ? '#10B98114' : theme.error + '12',
                borderColor: readiness.payable ? '#10B98155' : theme.error + '44',
              },
            ]}
          >
            <Ionicons
              name={readiness.payable ? 'checkmark-circle' : 'time-outline'}
              size={18}
              color={readiness.payable ? '#10B981' : theme.error}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText style={[type.bodyStrong, { color: readiness.payable ? '#10B981' : theme.error }]}>
                {readiness.payable ? 'Ready to receive payouts' : 'Payouts on hold'}
              </ThemedText>
              <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: 1 }]}>
                {readiness.payable
                  ? saved ? `Last updated ${new Date(saved.updatedAt).toLocaleDateString()}` : 'Save to activate'
                  : `${readiness.issues.length} detail${readiness.issues.length === 1 ? '' : 's'} missing or invalid`}
              </ThemedText>
            </View>
          </View>

          {/* Role */}
          <SectionTitle>I AM A</SectionTitle>
          <View style={styles.roleRow}>
            {ROLES.map((r) => {
              const on = role === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRole(r.key)}
                  style={[
                    styles.roleChip,
                    { backgroundColor: on ? theme.primary : theme.surfaceLow, borderColor: on ? theme.primary : theme.outlineVariant + '44' },
                  ]}
                >
                  <Ionicons name={r.icon} size={14} color={on ? '#ffffff' : theme.textSecondary} />
                  <ThemedText style={[type.small, { color: on ? '#ffffff' : theme.textSecondary }]}>{r.label}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Identity */}
          <SectionTitle>LEGAL IDENTITY</SectionTitle>
          {field('Legal name (as on PAN)', legalName, setLegalName, { placeholder: 'Skyline Sports LLP', fieldKey: 'legalName' })}
          {field('Display name (optional)', displayName, setDisplayName, { placeholder: 'Skyline Turf Arena' })}
          {field('PAN (optional)', pan, (t) => setPan(t.toUpperCase()), {
            placeholder: 'ABCDE1234F', autoCapitalize: 'characters', maxLength: 10, fieldKey: 'panNumber',
          })}

          {/* Address */}
          <SectionTitle>REGISTERED ADDRESS</SectionTitle>
          {field('Address line 1', line1, setLine1, { placeholder: '12 Anna Salai', fieldKey: 'address.line1' })}
          {field('Address line 2 (optional)', line2, setLine2, { placeholder: 'Near Gemini Flyover' })}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>{field('City', city, setCity, { placeholder: 'Chennai', fieldKey: 'address.city' })}</View>
            <View style={{ width: Spacing.md }} />
            <View style={{ flex: 1 }}>{field('PIN code', pincode, (t) => setPincode(t.replace(/\D/g, '').slice(0, 6)), {
              placeholder: '600002', keyboardType: 'number-pad', maxLength: 6, fieldKey: 'address.pincode',
            })}</View>
          </View>
          {field('State', state, setState, { placeholder: 'Tamil Nadu', fieldKey: 'address.state' })}

          {/* GST */}
          <SectionTitle>GST</SectionTitle>
          {field('GSTIN (optional)', gstin, (t) => setGstin(t.toUpperCase()), {
            placeholder: '33ABCDE1234F1Z5', autoCapitalize: 'characters', maxLength: 15, fieldKey: 'gstin',
          })}
          {readiness.warnings.some((w) => w.field === 'gstin') && (
            <View style={[styles.noteCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}>
              <Ionicons name="information-circle-outline" size={13} color={theme.textSecondary} />
              <ThemedText style={[type.micro, { color: theme.textSecondary, flexShrink: 1 }]}>
                Without a GSTIN you can still be paid, but the {Math.round(PLATFORM_FEE_GST_RATE * 100)}% GST on our
                platform fee can&apos;t be claimed back as input credit.
              </ThemedText>
            </View>
          )}

          {/* Payment method */}
          <SectionTitle>HOW YOU GET PAID</SectionTitle>
          <View style={styles.roleRow}>
            {(['bank', 'upi'] as PayoutMethod[]).map((m) => {
              const on = method === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMethod(m)}
                  style={[
                    styles.roleChip,
                    { flex: 1, justifyContent: 'center', backgroundColor: on ? theme.primary : theme.surfaceLow, borderColor: on ? theme.primary : theme.outlineVariant + '44' },
                  ]}
                >
                  <Ionicons name={m === 'bank' ? 'card-outline' : 'phone-portrait-outline'} size={14} color={on ? '#ffffff' : theme.textSecondary} />
                  <ThemedText style={[type.small, { color: on ? '#ffffff' : theme.textSecondary }]}>
                    {m === 'bank' ? 'Bank transfer' : 'UPI'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: Spacing.md }} />

          {method === 'bank' ? (
            <>
              {field('Account holder name', accountName, setAccountName, { placeholder: 'Skyline Sports LLP', fieldKey: 'bank.accountName' })}
              {field('Account number', accountNumber, (t) => setAccountNumber(t.replace(/\D/g, '').slice(0, 18)), {
                placeholder: '123456789012', keyboardType: 'number-pad', fieldKey: 'bank.accountNumber',
              })}
              {field('IFSC', ifsc, (t) => setIfsc(t.toUpperCase().slice(0, 11)), {
                placeholder: 'HDFC0001234', autoCapitalize: 'characters', maxLength: 11, fieldKey: 'bank.ifsc',
              })}
              {field('Bank name (optional)', bankName, setBankName, { placeholder: 'HDFC Bank' })}
              {saved?.bank?.accountNumber ? (
                <ThemedText style={[type.micro, { color: theme.textSecondary, marginTop: -6, marginBottom: Spacing.md }]}>
                  Saved account: {maskAccountNumber(saved.bank.accountNumber)}
                </ThemedText>
              ) : null}
            </>
          ) : (
            field('UPI ID', upiId, setUpiId, { placeholder: 'skyline@okaxis', autoCapitalize: 'none', fieldKey: 'upiId' })
          )}

          {/* How the split works */}
          <SectionTitle>HOW YOUR PAYOUT IS CALCULATED</SectionTitle>
          <View style={[styles.splitCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' }]}>
            <ThemedText style={[type.micro, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
              Example: 4 slots at ₹500, player redeems a ₹500 platform voucher.
            </ThemedText>
            <SplitRow label="Slot value (4 × ₹500)" value={`₹${example.gross}`} />
            <SplitRow label="Voucher discount" value={`− ₹${example.discountApplied}`} />
            <SplitRow label="Player pays" value={`₹${example.playerPays}`} muted />
            <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '44' }]} />
            <SplitRow label={`Platform fee (₹${PLATFORM_FEE_PER_SLOT} × 4 slots)`} value={`− ₹${example.platformFee}`} />
            <SplitRow label={`GST on fee (${Math.round(PLATFORM_FEE_GST_RATE * 100)}%)`} value={`− ₹${example.platformFeeGst}`} />
            <SplitRow label="Voucher reimbursed to you" value={`+ ₹${example.ownerReimbursement}`} positive />
            <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '44' }]} />
            <SplitRow label="You receive" value={`₹${example.ownerPayout}`} strong />
          </View>

          <View style={[styles.noteCard, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '33' }]}>
            <Ionicons name="shield-checkmark-outline" size={13} color={theme.primary} />
            <ThemedText style={[type.micro, { color: theme.textSecondary, flexShrink: 1 }]}>
              Vouchers we fund are reimbursed in full, so a platform promotion never
              costs you revenue. Discounts from your own offer codes are yours, and
              are not reimbursed.
            </ThemedText>
          </View>

          <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={[type.bodyStrong, { color: '#ffffff' }]}>
              {saved ? 'Update payout details' : 'Save payout details'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const type = useTypeRamp();
  return (
    <ThemedText style={[type.micro, styles.sectionTitle, { color: theme.textSecondary }]}>{children}</ThemedText>
  );
}

function SplitRow({
  label,
  value,
  strong,
  muted,
  positive,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  positive?: boolean;
}) {
  const theme = useTheme();
  const type = useTypeRamp();
  const color = positive ? '#10B981' : strong ? theme.text : muted ? theme.textSecondary : theme.text;
  return (
    <View style={styles.splitRow}>
      <ThemedText style={[strong ? type.bodyStrong : type.small, { color: muted ? theme.textSecondary : theme.text, flex: 1, minWidth: 0 }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[strong ? type.bodyStrong : type.small, { color }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: 52,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.base, paddingBottom: Spacing.xl },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  sectionTitle: { letterSpacing: 0.6, marginTop: Spacing.lg, marginBottom: Spacing.sm },

  roleRow: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  label: { letterSpacing: 0.3, marginBottom: 5 },
  input: { height: 40, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: 12 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  row: { flexDirection: 'row' },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: Spacing.sm,
  },

  splitCard: { borderRadius: BorderRadius.md, borderWidth: 1, padding: 12 },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  divider: { height: 1, marginVertical: 6 },

  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    ...Shadows.primary,
  },
});
