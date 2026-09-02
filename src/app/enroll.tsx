import React, { useState, useMemo } from 'react';
import { Alert, View, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Section } from '@/components/ui/section';
import { Separator } from '@/components/ui/separator';
import { MotionView } from '@/components/motion';
import { useTokens } from '@/hooks/use-scheme';
import { useOfferStore, useClassStore } from '@/store/app-store';
import { getOffersForTurf, formatDiscount, isRedeemable, OwnerOffer } from '@/store/offer-store';

export default function EnrollScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { offers } = useOfferStore();
  const { enrollInClass } = useClassStore();
  // Icon colours can't take className, so pull the same tokens the classes use.
  const t = useTokens();

  const title = (params.title as string) || 'Summer Camp Enrollment';
  const priceRaw = (params.price as string) || '4999';
  const dates = (params.dates as string) || 'Summer 2024';
  const location = (params.location as string) || 'TBD';
  // Present when arriving from a real coach-created class; absent for the
  // static marketing cards, which have nothing to enrol against.
  const classId = (params.classId as string) || '';
  const image =
    (params.image as string) || require('@/assets/images/illustrations/coaching_class_premium.png');

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');

  // Promo code / voucher state
  const [promoInput, setPromoInput] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<OwnerOffer | null>(null);
  const [promoError, setPromoError] = useState('');

  const basePrice = parseInt(String(priceRaw).replace(/[^0-9]/g, ''), 10) || 0;
  const serviceFee = 150;

  // Calculate discount
  const discountAmount = useMemo(() => {
    if (!appliedOffer) return 0;
    if (appliedOffer.discountType === 'percent') {
      return Math.round((basePrice * appliedOffer.discountValue) / 100);
    }
    return Math.min(basePrice, appliedOffer.discountValue);
  }, [appliedOffer, basePrice]);

  const total = Math.max(0, basePrice + serviceFee - discountAmount);

  // Filter available vouchers for this class
  const classOffers = useMemo(() => {
    const matched = getOffersForTurf(title, offers);
    if (matched.length > 0) return matched;
    // Fallback to active general offers
    return offers.filter(o => isRedeemable(o));
  }, [title, offers]);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a voucher code.');
      return;
    }

    const found = offers.find(o => o.code.toUpperCase() === code && isRedeemable(o));
    if (!found) {
      setPromoError('Invalid or expired promo code.');
      setAppliedOffer(null);
      return;
    }

    if (found.minBooking > 0 && basePrice < found.minBooking) {
      setPromoError(`Minimum fee of ₹${found.minBooking} required for this code.`);
      setAppliedOffer(null);
      return;
    }

    setAppliedOffer(found);
    setPromoInput(found.code);
    setPromoError('');
  };

  const handleRemovePromo = () => {
    setAppliedOffer(null);
    setPromoInput('');
    setPromoError('');
  };

  const handleEnroll = () => {
    if (!name || !age || !phone) {
      Alert.alert('Missing fields', 'Please fill out all participant details before enrolling.');
      return;
    }
    // Record the enrolment before confirming — this is what locks the class
    // against further edits/deletion by its coach.
    if (classId) {
      enrollInClass({
        classId,
        className: title,
        studentName: name,
        studentAge: age,
        contactNumber: phone,
        amountPaid: total,
        appliedCode: appliedOffer?.code,
      });
    }

    Alert.alert(
      'Enrollment confirmed',
      `You have successfully enrolled ${name} in ${title}.\nTotal paid: ₹${total}${appliedOffer ? ` (Saved ₹${discountAmount} with code ${appliedOffer.code})` : ''}`,
      [
        {
          text: 'Back to home',
          onPress: () => {
            router.dismissAll();
            router.replace('/(tabs)');
          },
        },
      ],
    );
  };

  const imageSource =
    typeof image === 'string' && /^\d+$/.test(image)
      ? parseInt(image, 10)
      : typeof image === 'string'
        ? { uri: image }
        : image;

  return (
    <Screen
      header={{ title: 'Registration' }}
      footer={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text variant="caption">Total incl. taxes</Text>
            <View className="flex-row items-baseline gap-2">
              <Text variant="heading">₹{total}</Text>
              {discountAmount > 0 && (
                <Text variant="caption" className="line-through">
                  ₹{basePrice + serviceFee}
                </Text>
              )}
            </View>
          </View>
          <Button
            className="px-7"
            leftIcon={<Ionicons name="card-outline" size={17} color={t.primaryForeground} />}
            onPress={handleEnroll}
            accessibilityLabel={`Pay ₹${total} and enrol`}
          >
            Pay &amp; enrol
          </Button>
        </View>
      }
    >
      <MotionView preset="fade-up" className="mt-3 h-48 overflow-hidden rounded-2xl">
        <Image source={imageSource} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        {/* Scrim keeps the title legible over any class photo. White here is
            deliberate — it sits on the image, not on the themed surface. */}
        <View className="absolute inset-0 justify-end bg-black/45 p-4">
          <Text variant="heading" className="text-white" numberOfLines={2}>
            {title}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={13} color="#ffffffaa" />
              <Text variant="caption" className="text-white/80">
                {dates}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={13} color="#ffffffaa" />
              <Text variant="caption" className="text-white/80">
                {location}
              </Text>
            </View>
          </View>
        </View>
      </MotionView>

      <MotionView preset="fade-up" delay={0.04}>
        <Section title="Participant details" className="mt-6">
          <Card variant="elevated" className="gap-4">
          <Input label="Full name" placeholder="e.g. Rahul Sharma" value={name} onChangeText={setName} />
          <View className="flex-row gap-3">
            <Input
              containerClassName="w-24"
              label="Age"
              placeholder="14"
              keyboardType="numeric"
              value={age}
              onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
            />
            <Input
              containerClassName="flex-1"
              label="Contact phone"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9+\s\-()]/g, ''))}
            />
          </View>
          <View className="gap-2">
            <Text variant="caption" className="text-foreground">
              Skill level
            </Text>
            <View className="flex-row gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <Chip
                  key={lvl}
                  label={lvl}
                  selected={skillLevel === lvl}
                  onPress={() => setSkillLevel(lvl)}
                  className="flex-1 justify-center"
                />
              ))}
            </View>
            </View>
          </Card>
        </Section>
      </MotionView>

      {/* Available Vouchers & Promo Code Section */}
      <MotionView preset="fade-up" delay={0.08}>
        <Section title="Promotions & Vouchers" className="mt-6">
          <Card variant="elevated" className="gap-3">
            <View className="flex-row items-end gap-2">
              <Input
                containerClassName="flex-1"
                label="Promo code"
                value={promoInput}
                onChangeText={(v) => {
                  setPromoInput(v);
                  if (promoError) setPromoError('');
                }}
                placeholder="Enter promo code"
                autoCapitalize="characters"
                error={promoError || undefined}
                leftSlot={<Ionicons name="pricetag-outline" size={16} color={t.success} />}
                rightSlot={
                  appliedOffer ? (
                    <Pressable
                      onPress={handleRemovePromo}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove code ${appliedOffer.code}`}
                    >
                      <Ionicons name="close-circle" size={18} color={t.destructive} />
                    </Pressable>
                  ) : undefined
                }
              />
              <Button
                variant={appliedOffer ? 'outline' : 'primary'}
                size="md"
                onPress={() => handleApplyPromo()}
                disabled={!!appliedOffer}
                accessibilityLabel="Apply promo code"
              >
                {appliedOffer ? 'Applied' : 'Apply'}
              </Button>
            </View>

            {appliedOffer && (
              <View className="flex-row items-center justify-between rounded-xl border border-success/30 bg-success/10 p-2.5">
                <View className="flex-1 flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={16} color={t.success} />
                  <Text variant="callout" className="flex-1 text-success" numberOfLines={2}>
                    {appliedOffer.code} applied ({formatDiscount(appliedOffer)})
                  </Text>
                </View>
                <Text variant="callout" className="text-success">
                  -₹{discountAmount}
                </Text>
              </View>
            )}

            {classOffers.length > 0 && !appliedOffer && (
              <View className="gap-2">
                <Text variant="overline">Available offers</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {classOffers.map((o) => (
                    <Pressable
                      key={o.id}
                      onPress={() => handleApplyPromo(o.code)}
                      accessibilityRole="button"
                      accessibilityLabel={`Apply ${o.code}, ${formatDiscount(o)}`}
                      className="flex-row items-center gap-2 rounded-xl border border-border/40 bg-muted px-3 py-2"
                    >
                      <View className="rounded-md bg-success/15 px-2 py-0.5">
                        <Text variant="caption" className="text-success">
                          {formatDiscount(o)}
                        </Text>
                      </View>
                      <Text variant="callout">{o.code}</Text>
                      <Ionicons name="arrow-forward-circle-outline" size={14} color={t.success} />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </Card>
        </Section>
      </MotionView>

      <MotionView preset="fade-up" delay={0.16}>
        <Section title="Payment summary" className="my-6">
          <Card variant="elevated" className="gap-2.5">
            <View className="flex-row justify-between">
              <Text variant="subtle">Enrollment fee</Text>
              <Text variant="callout">₹{basePrice}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text variant="subtle">Taxes &amp; service fee</Text>
              <Text variant="callout">₹{serviceFee}</Text>
            </View>
            {discountAmount > 0 && (
              <View className="flex-row justify-between gap-3">
                <Text variant="subtle" className="flex-1 text-success" numberOfLines={1}>
                  Voucher discount ({appliedOffer?.code})
                </Text>
                <Text variant="callout" className="text-success">
                  -₹{discountAmount}
                </Text>
              </View>
            )}
            <Separator className="my-1" />
            <View className="flex-row justify-between">
              <Text variant="subheading">Total due</Text>
              <Text variant="subheading" className="text-primary">
                ₹{total}
              </Text>
            </View>
          </Card>
        </Section>
      </MotionView>
    </Screen>
  );
}
