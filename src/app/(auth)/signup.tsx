import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useUserProfile } from '@/hooks/use-user-profile';
import { useLocation } from '@/hooks/use-location';
import { useToast } from '@/context/ToastContext';
import { apiClient, setAuthToken } from '@/services/api-client';
import { useTokens } from '@/hooks/use-scheme';
import { cn } from '@/lib/utils';

import { AuthShell } from '@/components/layout/auth-shell';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet } from '@/components/ui/sheet';
import { MotionView } from '@/components/motion';

const roleOptions: {
  key: 'Player' | 'Coach' | 'Owner';
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'Player', label: 'Player', desc: 'Join matches & track your stats', icon: 'football-outline' },
  { key: 'Coach', label: 'Coach', desc: 'Host classes & train athletes', icon: 'megaphone-outline' },
  { key: 'Owner', label: 'Owner', desc: 'List & manage your turfs', icon: 'business-outline' },
];

const formatPhone = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

const generateOtpCode = (): string => String(Math.floor(100000 + Math.random() * 900000));

type OtpStage = 'idle' | 'sent' | 'verified';

export default function SignUpScreen() {
  const router = useRouter();
  const { updateProfile } = useUserProfile();
  const { showInfo, showSuccess } = useToast();
  const { loading: locLoading, address, error: locError, fetchLocation } = useLocation();
  const t = useTokens();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Player' | 'Coach' | 'Owner'>('Player');
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [otpStage, setOtpStage] = useState<OtpStage>('idle');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const phoneDigits = phone.replace(/\D/g, '');
  const isPhoneValid = phoneDigits.length === 10;

  const passwordChecks = {
    length: password.length >= 8 && password.length <= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    if (selectedRole === 'Player' && !address && !locLoading) fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole]);

  useEffect(() => {
    if (!otpSentAt) return;
    const id = setInterval(() => setResendTimer((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(id);
  }, [otpSentAt]);

  const resetOtp = () => {
    setOtpStage('idle');
    setGeneratedOtp('');
    setOtpInput('');
    setOtpError(null);
    setOtpSentAt(null);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
    if (otpStage !== 'idle') resetOtp();
  };

  const handleSendOtp = () => {
    if (!isPhoneValid) return;
    const code = generateOtpCode();
    setGeneratedOtp(code);
    setOtpStage('sent');
    setOtpInput('');
    setOtpError(null);
    setResendTimer(30);
    setOtpSentAt(Date.now());
    showInfo('Demo OTP sent', `Verification code: ${code}`, 6000);
  };

  const handleVerifyOtp = () => {
    if (otpInput.length !== 6) {
      setOtpError('Enter the 6-digit code.');
      return;
    }
    if (otpInput !== generatedOtp) {
      setOtpError('Incorrect code. Please try again.');
      return;
    }
    setOtpStage('verified');
    setOtpError(null);
    showSuccess('Mobile number verified');
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Full name and email are required.');
      return;
    }
    if (!isPhoneValid) {
      setErrorMessage('Enter a valid 10-digit mobile number.');
      return;
    }
    if (otpStage !== 'verified') {
      setErrorMessage('Please verify your mobile number via OTP.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage(
        'Password must be 8–12 characters with uppercase, lowercase, a number, and a special character.',
      );
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      const resolvedLocation = selectedRole === 'Player' ? address || undefined : undefined;

      try {
        const response = await apiClient.post('/auth/register', {
          name: cleanName,
          email: cleanEmail,
          password,
          phone: phoneDigits,
          role: selectedRole,
          location: resolvedLocation,
        });
        if (response && response.token) {
          await setAuthToken(response.token);
          updateProfile({
            name: response.user.name,
            role: response.user.role,
            location: response.user.location || 'London, UK',
            avatarUrl: response.user.avatarUrl || 'avatar_1',
          });
          router.replace('/(tabs)');
          return;
        }
      } catch (error: any) {
        console.warn('Backend API unavailable, proceeding with local device registration:', error.message);
      }

      const newUser = {
        name: cleanName,
        email: cleanEmail,
        role: selectedRole,
        location: resolvedLocation || 'London, UK',
        phone: phoneDigits,
        createdAt: new Date().toISOString(),
      };

      const existingUsersStr = await AsyncStorage.getItem('@turf_users_db');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      const updatedUsers = [newUser, ...existingUsers.filter((u: any) => u.email !== cleanEmail)];
      await AsyncStorage.setItem('@turf_users_db', JSON.stringify(updatedUsers));

      const localToken = `local_token_${Date.now()}`;
      await setAuthToken(localToken);
      await AsyncStorage.setItem(
        '@turf_user_profile',
        JSON.stringify({ name: newUser.name, role: newUser.role, location: newUser.location, avatarUrl: '' }),
      );
      updateProfile({
        name: newUser.name,
        role: newUser.role as any,
        location: newUser.location,
        avatarUrl: 'avatar_1',
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleMeta = roleOptions.find((r) => r.key === selectedRole)!;
  const otpDisabled = !isPhoneValid || (otpStage === 'sent' && resendTimer > 0);

  return (
    <AuthShell>
      <View className="mb-6 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Badge variant="primary">Join Turf</Badge>
      </View>

      <Text variant="display" className="text-white">
        Create account
      </Text>
      <Text className="mb-6 mt-1.5 text-white/60">Thousands of athletes are already on Turf.</Text>

      <View className="gap-4 rounded-3xl border border-white/10 bg-card p-5">
        {errorMessage ? (
          <MotionView preset="fade" className="flex-row items-center gap-2 rounded-xl bg-destructive/15 p-3">
            <Ionicons name="alert-circle" size={16} color={t.destructive} />
            <Text className="flex-1 text-sm text-destructive">{errorMessage}</Text>
          </MotionView>
        ) : null}

        {/* Role selector */}
        <View className="gap-1.5">
          <Text variant="caption" className="text-foreground">
            Your role
          </Text>
          <Pressable
            onPress={() => setRoleSheetOpen(true)}
            className="h-12 flex-row items-center gap-3 rounded-xl border border-input bg-card px-3.5"
          >
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Ionicons name={selectedRoleMeta.icon} size={15} color={t.primary} />
            </View>
            <Text className="flex-1 font-semibold text-foreground">{selectedRoleMeta.label}</Text>
            <Ionicons name="chevron-down" size={18} color={t.mutedForeground} />
          </Pressable>
        </View>

        <Input
          label="Full name"
          placeholder="Your full name"
          value={name}
          onChangeText={setName}
          leftSlot={<Ionicons name="person-outline" size={17} color={t.mutedForeground} />}
        />
        <Input
          label="Email"
          placeholder="Your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          leftSlot={<Ionicons name="mail-outline" size={17} color={t.mutedForeground} />}
        />

        {/* Phone + OTP trigger */}
        <Input
          label="Mobile number"
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={11}
          value={phone}
          onChangeText={handlePhoneChange}
          leftSlot={<Ionicons name="call-outline" size={17} color={t.mutedForeground} />}
          rightSlot={
            otpStage === 'verified' ? (
              <Ionicons name="checkmark-circle" size={19} color={t.success} />
            ) : (
              <Pressable onPress={handleSendOtp} disabled={otpDisabled} hitSlop={8}>
                <Text
                  className={cn(
                    'text-xs font-bold',
                    otpDisabled ? 'text-muted-foreground' : 'text-primary',
                  )}
                >
                  {otpStage === 'sent' ? (resendTimer > 0 ? `Resend ${resendTimer}s` : 'Resend') : 'Send OTP'}
                </Text>
              </Pressable>
            )
          }
        />

        {otpStage === 'sent' ? (
          <MotionView preset="fade-up" className="gap-1.5">
            <View className="flex-row gap-2">
              <Input
                containerClassName="flex-1"
                placeholder="6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                value={otpInput}
                onChangeText={(v) => {
                  setOtpInput(v.replace(/\D/g, '').slice(0, 6));
                  setOtpError(null);
                }}
              />
              <Button size="md" className="px-5" onPress={handleVerifyOtp}>
                Verify
              </Button>
            </View>
            {otpError ? (
              <Text variant="caption" className="text-destructive">
                {otpError}
              </Text>
            ) : null}
          </MotionView>
        ) : null}

        {/* Location chip — Players only */}
        {selectedRole === 'Player' ? (
          <View className="flex-row items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
            <Ionicons name="location" size={13} color={t.primary} />
            {locLoading ? (
              <>
                <ActivityIndicator size="small" color={t.primary} />
                <Text variant="caption" numberOfLines={1}>
                  Detecting your location…
                </Text>
              </>
            ) : locError ? (
              <>
                <Text variant="caption" className="flex-1 text-destructive" numberOfLines={1}>
                  {locError}
                </Text>
                <Pressable onPress={fetchLocation} hitSlop={8}>
                  <Ionicons name="refresh" size={14} color={t.primary} />
                </Pressable>
              </>
            ) : (
              <>
                <Text variant="caption" className="flex-1" numberOfLines={1}>
                  {address || 'Location unavailable'}
                </Text>
                <Pressable onPress={fetchLocation} hitSlop={8}>
                  <Ionicons name="refresh" size={13} color={t.mutedForeground} />
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        <Input
          label="Password"
          placeholder="8–12 characters"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={12}
          value={password}
          onChangeText={setPassword}
          leftSlot={<Ionicons name="lock-closed-outline" size={17} color={t.mutedForeground} />}
          rightSlot={
            <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={17}
                color={t.mutedForeground}
              />
            </Pressable>
          }
        />

        {password.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {(
              [
                { key: 'length', label: '8-12' },
                { key: 'upper', label: 'A-Z' },
                { key: 'lower', label: 'a-z' },
                { key: 'number', label: '0-9' },
                { key: 'special', label: '#!@' },
              ] as const
            ).map((req) => {
              const ok = passwordChecks[req.key];
              return (
                <View
                  key={req.key}
                  className={cn(
                    'flex-row items-center gap-1 rounded-full border px-2 py-1',
                    ok ? 'border-success/40 bg-success/10' : 'border-border bg-transparent',
                  )}
                >
                  <Ionicons
                    name={ok ? 'checkmark' : 'ellipse-outline'}
                    size={9}
                    color={ok ? t.success : t.mutedForeground}
                  />
                  <Text
                    className={cn(
                      'text-2xs font-bold',
                      ok ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    {req.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <Button block loading={isLoading} onPress={handleSignUp} className="mt-1">
          Create account
        </Button>
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text variant="subtle">Already have an account? </Text>
        <Pressable onPress={() => router.replace('/login')}>
          <Text className="text-sm font-bold text-primary">Sign in</Text>
        </Pressable>
      </View>

      <Sheet open={roleSheetOpen} onClose={() => setRoleSheetOpen(false)} title="Select your role">
        <View className="gap-2">
          {roleOptions.map((r) => {
            const active = r.key === selectedRole;
            return (
              <Pressable
                key={r.key}
                onPress={() => {
                  setSelectedRole(r.key);
                  setRoleSheetOpen(false);
                }}
                className={cn(
                  'flex-row items-center gap-3 rounded-2xl border p-3.5',
                  active ? 'border-primary bg-primary/10' : 'border-border bg-card',
                )}
              >
                <View
                  className={cn(
                    'h-10 w-10 items-center justify-center rounded-xl',
                    active ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <Ionicons
                    name={r.icon}
                    size={18}
                    color={active ? t.primaryForeground : t.mutedForeground}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-foreground">{r.label}</Text>
                  <Text variant="caption">{r.desc}</Text>
                </View>
                {active ? <Ionicons name="checkmark-circle" size={20} color={t.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </AuthShell>
  );
}
