import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTokens } from '@/hooks/use-scheme';
import { AuthShell } from '@/components/layout/auth-shell';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MotionView } from '@/components/motion';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const t = useTokens();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRecover = () => {
    if (!email) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

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
        <Badge variant="primary">Account recovery</Badge>
      </View>

      <Text variant="display" className="text-white">
        Reset password
      </Text>
      <Text className="mb-6 mt-1.5 text-white/60">
        We&apos;ll email recovery instructions to your registered address.
      </Text>

      <View className="rounded-3xl border border-white/10 bg-card p-5">
        {isSuccess ? (
          <MotionView preset="scale-in" className="items-center gap-3 py-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Ionicons name="checkmark-circle" size={44} color={t.primary} />
            </View>
            <Text variant="subheading">Instructions sent</Text>
            <Text variant="subtle" className="text-center">
              Password recovery instructions were sent to
            </Text>
            <View className="flex-row items-center gap-2 rounded-full bg-muted px-3 py-1.5">
              <Ionicons name="mail-outline" size={15} color={t.primary} />
              <Text className="text-sm font-semibold text-foreground">
                {email.trim().toLowerCase()}
              </Text>
            </View>
            <Text variant="caption" className="text-center">
              Check your inbox or spam folder.
            </Text>
            <Button block className="mt-2" onPress={() => router.replace('/login')}>
              Back to sign in
            </Button>
          </MotionView>
        ) : (
          <View className="gap-4">
            <Text variant="subtle">
              Enter the email linked to your account and we&apos;ll send a reset link.
            </Text>

            {errorMessage ? (
              <MotionView preset="fade" className="flex-row items-center gap-2 rounded-xl bg-destructive/15 p-3">
                <Ionicons name="alert-circle" size={16} color={t.destructive} />
                <Text className="flex-1 text-sm text-destructive">{errorMessage}</Text>
              </MotionView>
            ) : null}

            <Input
              label="Email address"
              placeholder="Registered email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              leftSlot={<Ionicons name="mail-outline" size={18} color={t.mutedForeground} />}
            />

            <Button block loading={isLoading} onPress={handleRecover}>
              Send reset link
            </Button>

            <Pressable
              onPress={() => router.replace('/login')}
              className="flex-row items-center justify-center gap-1"
            >
              <Ionicons name="arrow-back-outline" size={14} color={t.mutedForeground} />
              <Text variant="subtle">Back to sign in</Text>
            </Pressable>
          </View>
        )}
      </View>
    </AuthShell>
  );
}
