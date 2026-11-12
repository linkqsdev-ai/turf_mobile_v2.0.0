/**
 * payout-settings.tsx
 *
 * Payout & Tax Details configuration for Turf Owners, Coaches, and Organizers.
 * Styled matching the Home Player Dashboard typography & design system.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/context/ToastContext';
import {
  HOLD_PERIOD_HOURS,
  PLATFORM_FEE_PER_SLOT,
  PLATFORM_FEE_GST_RATE,
  computeSettlement,
} from '@/lib/settlement';
import {
  createPayeeProfile,
  maskAccountNumber,
  payeeRoleFor,
  payoutReadiness,
  type PayeeProfile,
  type PayeeRole,
  type PayoutMethod,
} from '@/store/payout-store';
import {
  DashboardCard,
  DashboardSectionLabel,
  DashboardTabs,
  StatTiles,
} from '@/components/dashboard/analytics-kit';
import { ACCENTS } from '@/constants/dashboard-accents';

const STORAGE_KEY = '@turf_payout_profile';

const ROLES: { key: PayeeRole; label: string; emoji: string }[] = [
  { key: 'owner', label: 'Turf Owner', emoji: '🏟️' },
  { key: 'coach', label: 'Coach', emoji: '🏋️' },
  { key: 'organizer', label: 'Organizer', emoji: '🏆' },
];

const METHODS: { key: PayoutMethod; label: string; emoji: string }[] = [
  { key: 'bank', label: 'Bank transfer', emoji: '🏦' },
  { key: 'upi', label: 'UPI', emoji: '📱' },
];

export default function PayoutSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const { showSuccess, showWarning } = useToast();
  const { profile } = useUserProfile();
  /**
   * An owner, coach or organizer is paid as that role, so the signed-in account
   * decides it. Only an account without a payee role of its own picks one.
   */
  const accountRole = payeeRoleFor(profile.role);

  const [role, setRole] = useState<PayeeRole>('owner');
  const effectiveRole = accountRole ?? role;
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
      role: effectiveRole,
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
    [
      effectiveRole,
      legalName,
      displayName,
      line1,
      line2,
      city,
      state,
      pincode,
      pan,
      gstin,
      method,
      accountName,
      accountNumber,
      ifsc,
      bankName,
      upiId,
    ]
  );

  const readiness = useMemo(() => payoutReadiness(draft), [draft]);

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
      showWarning(
        `${readiness.issues.length} detail${readiness.issues.length === 1 ? '' : 's'} still need fixing`
      );
      return;
    }
    const profile = createPayeeProfile(draft as any);
    const next: PayeeProfile = saved
      ? { ...profile, id: saved.id, createdAt: saved.createdAt, updatedAt: new Date().toISOString() }
      : profile;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(next);
    setShowIssues(false);
    showSuccess('Payout & Tax details saved');
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    opts: {
      placeholder?: string;
      keyboardType?: any;
      autoCapitalize?: any;
      maxLength?: number;
      fieldKey?: string;
    } = {}
  ) => {
    const err = opts.fieldKey ? issueFor(opts.fieldKey) : undefined;
    return (
      <View>
        <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
        <TextInput
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          value={value}
          onChangeText={onChange}
          placeholder={opts.placeholder}
          placeholderTextColor={theme.placeholder}
          keyboardType={opts.keyboardType}
          autoCapitalize={opts.autoCapitalize}
          maxLength={opts.maxLength}
          accessibilityLabel={label}
          style={[
            styles.textInput,
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
            <Ionicons name="alert-circle" size={12} color={theme.error} />
            <ThemedText style={[styles.errText, { color: theme.error }]}>{err}</ThemedText>
          </View>
        )}
      </View>
    );
  };

  const roleLabel = ROLES.find((r) => r.key === effectiveRole)?.label ?? 'Payee';
  const issueCount = readiness.issues.length;
  const savedAccount =
    method === 'bank' && saved?.bank?.accountNumber ? maskAccountNumber(saved.bank.accountNumber) : null;

  return (
    <GradientContainer screenName="team-management" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Payout & Tax Details
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Readiness — can this payee be paid right now, and if not, why not */}
          <DashboardCard
            title={readiness.payable ? 'Settlements Activated' : 'Complete Payout Profile'}
            metric={
              readiness.payable
                ? saved
                  ? 'All details complete'
                  : 'Complete — save to activate'
                : `${issueCount} ${issueCount === 1 ? 'detail' : 'details'} missing or invalid`
            }
            tag={readiness.payable ? '✅ Ready for payouts' : '⏸️ Payouts on hold'}
            icon={readiness.payable ? 'shield-checkmark' : 'card-outline'}
            accent={readiness.payable ? ACCENTS.green : ACCENTS.red}
            footer={{
              label: 'Last updated',
              value: saved ? new Date(saved.updatedAt).toLocaleDateString() : 'Not saved yet',
              status: readiness.payable ? `Credits ${HOLD_PERIOD_HOURS}h after booking` : 'Fix the fields below',
            }}
          >
            <StatTiles
              items={[
                { value: roleLabel, label: 'Payee' },
                { value: method === 'bank' ? 'Bank' : 'UPI', label: 'Paid via', color: ACCENTS.green.dark },
                { value: gstin ? 'Added' : 'Not added', label: 'GSTIN', color: gstin ? ACCENTS.primary.dark : undefined },
              ]}
            />
          </DashboardCard>

          {/* ── Identity & tax ── */}
          <DashboardSectionLabel label="Identity & Tax" color={ACCENTS.primary.main} style={styles.groupLabel} />

          <DashboardCard
            title="Account Role"
            metric={`Paid as ${roleLabel}`}
            tag={accountRole ? '🔒 From your account' : '✏️ Choose your role'}
            icon="person-circle"
            accent={ACCENTS.primary}
          >
            <DashboardTabs
              compact
              options={ROLES.map((r) => ({
                key: r.key,
                label: r.label,
                emoji: r.emoji,
                disabled: !!accountRole && r.key !== accountRole,
              }))}
              active={effectiveRole}
              onChange={setRole}
            />
            {accountRole && (
              <ThemedText style={[styles.roleHint, { color: theme.textSecondary }]}>
                Set from your {profile.role} account. Switch roles in Edit Profile to change it.
              </ThemedText>
            )}
          </DashboardCard>

          <DashboardCard
            style={styles.cardGap}
            title="Legal Identity"
            metric="As printed on your PAN card"
            icon="id-card"
            accent={ACCENTS.primary}
          >
            <View style={styles.fields}>
              {renderField('Legal Name (as on PAN)', legalName, setLegalName, {
                placeholder: 'Skyline Sports LLP',
                fieldKey: 'legalName',
              })}
              {renderField('Display Name (optional)', displayName, setDisplayName, {
                placeholder: 'Skyline Turf Arena',
              })}
              {renderField('PAN Number (optional)', pan, (t) => setPan(t.toUpperCase()), {
                placeholder: 'ABCDE1234F',
                autoCapitalize: 'characters',
                maxLength: 10,
                fieldKey: 'panNumber',
              })}
            </View>
          </DashboardCard>

          <DashboardCard
            style={styles.cardGap}
            title="Registered Address"
            metric="Printed on your payout statements"
            icon="location"
            accent={ACCENTS.primary}
          >
            <View style={styles.fields}>
              {renderField('Address Line 1', line1, setLine1, {
                placeholder: '12 Anna Salai',
                fieldKey: 'address.line1',
              })}
              {renderField('Address Line 2 (optional)', line2, setLine2, {
                placeholder: 'Near Gemini Flyover',
              })}
              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  {renderField('City', city, setCity, {
                    placeholder: 'Chennai',
                    fieldKey: 'address.city',
                  })}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField('PIN Code', pincode, (t) => setPincode(t.replace(/\D/g, '').slice(0, 6)), {
                    placeholder: '600002',
                    keyboardType: 'number-pad',
                    maxLength: 6,
                    fieldKey: 'address.pincode',
                  })}
                </View>
              </View>
              {renderField('State', state, setState, {
                placeholder: 'Tamil Nadu',
                fieldKey: 'address.state',
              })}
            </View>
          </DashboardCard>

          <DashboardCard
            style={styles.cardGap}
            title="GST Registration"
            metric={gstin ? `GSTIN ${gstin}` : 'Optional'}
            tag={gstin ? undefined : '💡 Claim input credit'}
            icon="receipt"
            accent={ACCENTS.orange}
          >
            <View style={styles.fields}>
              {renderField('GSTIN (optional)', gstin, (t) => setGstin(t.toUpperCase()), {
                placeholder: '33ABCDE1234F1Z5',
                autoCapitalize: 'characters',
                maxLength: 15,
                fieldKey: 'gstin',
              })}
              <View
                style={[
                  styles.noteBox,
                  { backgroundColor: ACCENTS.orange.main + '0F', borderColor: ACCENTS.orange.main + '26' },
                ]}
              >
                <Ionicons name="information-circle-outline" size={14} color={ACCENTS.orange.dark} />
                <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
                  Without a GSTIN you can still receive payouts, but the{' '}
                  {Math.round(PLATFORM_FEE_GST_RATE * 100)}% GST on platform fees cannot be claimed as input tax
                  credit.
                </ThemedText>
              </View>
            </View>
          </DashboardCard>

          {/* ── Payments ── */}
          <DashboardSectionLabel label="Payments" color={ACCENTS.green.main} style={styles.groupLabel} />

          <DashboardCard
            title="Payout Method"
            metric={method === 'bank' ? 'Bank transfer to your account' : 'Instant UPI transfer'}
            tag={savedAccount ? `🔒 ${savedAccount}` : undefined}
            icon="card"
            accent={ACCENTS.green}
          >
            <DashboardTabs
              options={METHODS.map((m) => ({ ...m, accent: ACCENTS.green }))}
              active={method}
              onChange={setMethod}
            />
            <View style={styles.fields}>
              {method === 'bank' ? (
                <>
                  {renderField('Account Holder Name', accountName, setAccountName, {
                    placeholder: 'Skyline Sports LLP',
                    fieldKey: 'bank.accountName',
                  })}
                  {renderField(
                    'Account Number',
                    accountNumber,
                    (t) => setAccountNumber(t.replace(/\D/g, '').slice(0, 18)),
                    {
                      placeholder: '123456789012',
                      keyboardType: 'number-pad',
                      fieldKey: 'bank.accountNumber',
                    }
                  )}
                  {renderField('IFSC Code', ifsc, (t) => setIfsc(t.toUpperCase().slice(0, 11)), {
                    placeholder: 'HDFC0001234',
                    autoCapitalize: 'characters',
                    maxLength: 11,
                    fieldKey: 'bank.ifsc',
                  })}
                  {renderField('Bank Name (optional)', bankName, setBankName, {
                    placeholder: 'HDFC Bank',
                  })}
                </>
              ) : (
                renderField('UPI ID', upiId, setUpiId, {
                  placeholder: 'skyline@okaxis',
                  autoCapitalize: 'none',
                  fieldKey: 'upiId',
                })
              )}
            </View>
          </DashboardCard>

          {/* A worked example, so the split is concrete rather than a policy sentence. */}
          <DashboardCard
            style={styles.cardGap}
            title="Payout Calculation"
            metric={`You receive ₹${example.ownerPayout}`}
            tag="4 slots × ₹500"
            icon="calculator"
            accent={ACCENTS.green}
          >
            <ThemedText style={[styles.splitCaption, { color: theme.textSecondary }]}>
              Example: 4 slots at ₹500 with a ₹500 platform voucher
            </ThemedText>
            <View style={[styles.splitBox, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '1A' }]}>
              <SplitRow label="Slot Gross Value (4 × ₹500)" value={`₹${example.gross}`} />
              <SplitRow label="Voucher Discount" value={`− ₹${example.discountApplied}`} />
              <SplitRow label="Player Pays" value={`₹${example.playerPays}`} muted />
              <View style={[styles.splitDivider, { backgroundColor: theme.outlineVariant + '33' }]} />
              <SplitRow
                label={`Platform Fee (₹${PLATFORM_FEE_PER_SLOT} × 4 slots)`}
                value={`− ₹${example.platformFee}`}
              />
              <SplitRow
                label={`GST on Fee (${Math.round(PLATFORM_FEE_GST_RATE * 100)}%)`}
                value={`− ₹${example.platformFeeGst}`}
              />
              <SplitRow label="Voucher Reimbursed to You" value={`+ ₹${example.ownerReimbursement}`} positive />
              <View style={[styles.splitDivider, { backgroundColor: theme.outlineVariant + '33' }]} />
              <SplitRow label="You Receive" value={`₹${example.ownerPayout}`} strong />
            </View>
            <View
              style={[
                styles.noteBox,
                { backgroundColor: ACCENTS.primary.main + '0D', borderColor: ACCENTS.primary.main + '26' },
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color={ACCENTS.primary.dark} />
              <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
                Platform-funded vouchers are reimbursed in full upon settlement. Your own promotional discounts are
                handled directly and not reimbursed.
              </ThemedText>
            </View>
          </DashboardCard>

        </ScrollView>

        {/* Save stays pinned to the bottom, so it never needs a scroll to reach. */}
        <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.outlineVariant + '33' }]}>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: theme.primary },
              Shadows.level2,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Update payout and tax details' : 'Save payout and tax details'}
          >
            <Ionicons name={saved ? 'refresh' : 'checkmark-circle'} size={16} color="#ffffff" />
            <ThemedText style={styles.saveBtnText}>
              {saved ? 'Update Payout & Tax Details' : 'Save Payout & Tax Details'}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </GradientContainer>
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
  const color = positive ? ACCENTS.green.dark : muted ? theme.textSecondary : theme.text;
  return (
    <View style={styles.splitRow}>
      <ThemedText
        style={[
          strong ? styles.splitLabelStrong : styles.splitLabel,
          { color: muted ? theme.textSecondary : theme.text, flex: 1 },
        ]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      <ThemedText style={[strong ? styles.splitValueStrong : styles.splitValue, { color }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    zIndex: 10,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Sora_500Medium', fontSize: 15.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  groupLabel: { marginTop: 22, marginBottom: 10 },
  cardGap: { marginTop: 12 },
  fields: { gap: 10 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  inputLabel: { fontFamily: 'Sora_500Medium', fontSize: 10.5, marginBottom: 5, letterSpacing: 0.2 },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    fontFamily: 'Sora_400Regular',
    includeFontPadding: false,
  },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errText: { fontFamily: 'Sora_400Regular', fontSize: 10.5, flexShrink: 1 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  noteText: { fontFamily: 'Sora_400Regular', fontSize: 11, lineHeight: 16, flex: 1 },
  splitCaption: { fontFamily: 'Sora_400Regular', fontSize: 10.5, marginTop: -4 },
  splitBox: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  splitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 2 },
  splitLabel: { fontFamily: 'Sora_400Regular', fontSize: 11 },
  splitLabelStrong: { fontFamily: 'Sora_500Medium', fontSize: 12 },
  splitValue: { fontFamily: 'Sora_500Medium', fontSize: 11 },
  splitValueStrong: { fontFamily: 'Sora_600SemiBold', fontSize: 12.5 },
  splitDivider: { height: 1, marginVertical: 5 },
  saveBtn: {
    flexDirection: 'row',
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.premium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1 },
  saveBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 13, color: '#ffffff' },
  roleHint: { fontFamily: 'Sora_400Regular', fontSize: 10.5, lineHeight: 15, marginTop: -4 },
});
