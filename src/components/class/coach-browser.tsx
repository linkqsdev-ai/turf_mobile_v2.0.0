import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useClassStore, useOfferStore } from '@/store/app-store';
import { formatDiscount, isRedeemable } from '@/store/offer-store';
import { buildCoachList } from '@/store/class-list';
import { getAvatarSource } from '@/constants/avatars';
import { normaliseScheduleList, formatClassDateRange, formatDaysShort, formatSessionsShort } from '@/utils/class-schedule';
import { TicketVoucherCarousel } from '@/components/ticket-voucher-card';

/**
 * coach-browser.tsx
 * Finding and booking a coach.
 *
 * This used to be the "Coaching" half of the Turf Book screen, behind a
 * Turf/Coaching switch. It lives here instead so Turf Book is about turfs and
 * the Class tab is the whole coaching story — browse, book, then see what you
 * booked — rather than the two halves sitting in different tabs.
 *
 * Coach-created classes come from the store and are merged ahead of the sample
 * roster, so a class a coach publishes is bookable immediately.
 */

const SPORTS = [
  'All',
  'Cricket',
  'Football',
  'Badminton',
  'Tennis',
  'Basketball',
  'Pickleball',
  'Squash',
  'Volleyball',
  'Swimming',
] as const;
type Sport = (typeof SPORTS)[number];

export function CoachBrowser() {
  const theme = useTheme();
  const router = useRouter();
  const { classes, isClassActive, refreshClasses, enrollmentCountForClass } = useClassStore();
  const { offers } = useOfferStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Automatically fetch newly created classes from storage & backend upon opening, mounting, or focusing
  useEffect(() => {
    refreshClasses?.();
  }, [refreshClasses]);

  useFocusEffect(
    useCallback(() => {
      refreshClasses?.();
    }, [refreshClasses])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshClasses?.();
    } finally {
      setRefreshing(false);
    }
  }, [refreshClasses]);

  // Every active class created by coaches, newest first, excluding classes that reached max students.
  const displayedCoaches = useMemo(
    () =>
      buildCoachList({
        classes,
        isActive: isClassActive,
        enrollmentCount: enrollmentCountForClass,
        defaults: [],
        query: searchQuery,
        sport: selectedSport,
      }),
    [classes, isClassActive, enrollmentCountForClass, searchQuery, selectedSport]
  );

  return (
    <View style={styles.browserContainer}>
      {/* Fixed Search Bar & Sports Selection Options */}
      <View style={styles.fixedFilterSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '55' },
          ]}
        >
          <Ionicons name="search" size={17} color={theme.textSecondary} />
          <TextInput
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search coach, sport or skill"
            placeholderTextColor={theme.textSecondary + '99'}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Horizontal Sport Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportRow}
        >
          {SPORTS.map(s => {
            const isSelected = selectedSport === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSelectedSport(s)}
                style={[
                  styles.sportChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceLowest,
                    borderColor: isSelected ? theme.primary : theme.outlineVariant + '44',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${s}`}
                accessibilityState={{ selected: isSelected }}
              >
                <ThemedText
                  style={[
                    styles.sportText,
                    { color: isSelected ? '#ffffff' : theme.textSecondary },
                  ]}
                >
                  {s}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Cards List: Clean frosted cards with full schedule and venue metadata grid */}
      <ScrollView
        style={styles.cardsScroll}
        contentContainerStyle={styles.cardsScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Dynamic Coaching Class Vouchers Carousel (Filtered for Classes only) */}
        <View style={{ marginBottom: 12 }}>
          <TicketVoucherCarousel filterType="class" title="EXCLUSIVE COACHING OFFERS & PASSES" />
        </View>

        <View style={styles.section}>
          {displayedCoaches.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="search-outline" size={40} color={theme.textSecondary} style={{ opacity: 0.4 }} />
              <ThemedText style={{ color: theme.textSecondary, marginTop: 10, fontSize: 13, fontFamily: 'Sora_500Medium' }}>
                No classes match your search.
              </ThemedText>
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSelectedSport('All');
                }}
                style={{ marginTop: 8 }}
              >
                <ThemedText style={{ color: theme.primary, fontSize: 12.5, fontFamily: 'Sora_700Bold' }}>
                  Reset Filters →
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            displayedCoaches.map((coach: any, idx: number) => {
              const cls = coach.rawClass;
              const dateRange = formatClassDateRange(cls?.startDate, cls?.endDate);
              const days = formatDaysShort(cls?.selectedDays);
              const sessionTime = formatSessionsShort(cls?.sessionTime);
              const fee = cls?.feeAmount
                ? `₹${cls.feeAmount}/${cls.feeType === 'Per Session' ? 'sess' : (cls.feeType === 'Monthly' ? 'mo' : (cls.feeType === 'One-Time Package' ? 'pkg' : 'hr'))}`
                : (coach.rateText || 'Free');
              const level = [cls?.skillLevel, cls?.ageGroup].filter(Boolean).join(' · ') || (coach.skills || []).join(' · ') || 'All Levels · All Ages';
              const venue = coach.venue || cls?.venue || 'Trichy Zone IV, Tiruchirappalli, Tamil Nadu, India';

              // Extract class-specific voucher/offer
              let classVoucher: { code: string; discountText: string; title?: string } | null = null;
              if (cls?.vouchers && Array.isArray(cls.vouchers) && cls.vouchers.length > 0) {
                const v = cls.vouchers[0];
                const disc = v.discountValue
                  ? `${v.discountValue}${v.discountType === 'flat' ? '₹ OFF' : '% OFF'}`
                  : '15% OFF';
                classVoucher = {
                  code: String(v.code || '').trim().toUpperCase(),
                  discountText: disc,
                  title: v.title || `${cls.className || 'Class'} Voucher`,
                };
              } else {
                const matchingOffer = (offers || []).find(
                  o => isRedeemable(o) && o.appliesTo && cls?.className && o.appliesTo.toLowerCase() === cls.className.toLowerCase()
                );
                if (matchingOffer) {
                  classVoucher = {
                    code: matchingOffer.code,
                    discountText: formatDiscount(matchingOffer),
                    title: matchingOffer.title,
                  };
                } else {
                  const prefix = String(cls?.className || coach.coachName || 'CLASS')
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .slice(0, 6)
                    .toUpperCase();
                  classVoucher = {
                    code: `${prefix || 'CLASS'}10`,
                    discountText: '15% OFF',
                    title: `${cls?.className || coach.coachName || 'Class'} Pass Discount`,
                  };
                }
              }

              // Extract certificates
              const certsList: string[] = Array.isArray(cls?.certificates)
                ? cls.certificates.filter(Boolean)
                : (cls?.certification ? [cls.certification] : (coach.certificates || []));
              const certsText = certsList.join(' · ');

              const details = [
                dateRange ? { icon: 'calendar-outline' as const, label: 'Runs', value: dateRange, full: true } : null,
                days ? { icon: 'repeat-outline' as const, label: 'Days', value: days } : null,
                sessionTime ? { icon: 'time-outline' as const, label: 'Sessions', value: sessionTime } : null,
                { icon: 'pricetag-outline' as const, label: 'Fee', value: fee },
                { icon: 'trending-up-outline' as const, label: 'Level', value: level },
                classVoucher ? { icon: 'gift-outline' as const, label: 'Offer', value: `${classVoucher.discountText} · Code: ${classVoucher.code}` } : null,
                certsText ? { icon: 'ribbon-outline' as const, label: 'Certified', value: certsText, full: true } : null,
                venue ? { icon: 'location-outline' as const, label: 'Venue', value: venue, full: true } : null,
              ].filter(Boolean) as { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; full?: boolean }[];

              return (
                <Reanimated.View
                  key={coach.id || `coach-card-${idx}`}
                  entering={FadeInDown.delay(idx * 60).duration(380)}
                  style={[styles.frostedCoachCard, Shadows.level2]}
                >
                  {/* Soft Frosted Glass Gradient Background */}
                  <LinearGradient
                    colors={['#f8fbfe', '#e8f4fc', '#d8eefc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Top Row: Larger Avatar, Name, 5-Star Rating & Profile Button */}
                  <View style={styles.coachCardTopRow}>
                    <Pressable
                      onPress={() => {
                        router.push({
                          pathname: '/coach/[id]',
                          params: {
                            id: coach.id,
                            name: coach.coachName,
                            specialty: coach.roleTitle,
                            rating: String(coach.rating || '5.0'),
                            rate: coach.rateText,
                            avatar: coach.avatar,
                            certificates: certsText,
                          },
                        });
                      }}
                      style={styles.avatarPressable}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${coach.coachName} profile`}
                    >
                      <Image
                        source={getAvatarSource(coach.avatar)}
                        style={styles.coachAvatar}
                        contentFit="cover"
                      />
                    </Pressable>

                    <View style={styles.coachHeadInfo}>
                      <View style={styles.coachNameRow}>
                        <ThemedText style={[styles.coachNameText, { color: theme.text }]} numberOfLines={1}>
                          {coach.coachName}
                        </ThemedText>
                        <Pressable
                          style={styles.viewProfileBtn}
                          onPress={() => {
                            router.push({
                              pathname: '/coach/[id]',
                              params: {
                                id: coach.id,
                                name: coach.coachName,
                                specialty: coach.roleTitle,
                                rating: String(coach.rating || '5.0'),
                                rate: coach.rateText,
                                avatar: coach.avatar,
                                certificates: certsText,
                              },
                            });
                          }}
                        >
                          <ThemedText style={[styles.viewProfileBtnText, { color: theme.primary }]}>
                            Profile
                          </ThemedText>
                          <Ionicons name="chevron-forward" size={10} color={theme.primary} />
                        </Pressable>
                      </View>

                      <ThemedText style={[styles.coachRoleText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {coach.roleTitle}
                      </ThemedText>

                      {/* 5-Star Rating Display */}
                      <View style={styles.ratingRow}>
                        <View style={{ flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons key={s} name="star" size={10.5} color="#f59e0b" />
                          ))}
                        </View>
                        <ThemedText style={styles.ratingScoreText}>5.0</ThemedText>
                        <ThemedText style={[styles.ratingCountText, { color: theme.textSecondary }]}>
                          ({coach.reviews || 24})
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Skill / Focus Tags & Certification Badges */}
                  <View style={styles.coachSkillRow}>
                    {[coach.sportType, coach.roleTitle?.split('•')[0]?.trim(), cls?.ageGroup || 'All Ages'].filter(Boolean).map((skill: string, sIdx: number) => (
                      <View key={sIdx} style={styles.coachSkillPill}>
                        <ThemedText style={[styles.coachSkillText, { color: theme.textSecondary }]}>
                          {skill}
                        </ThemedText>
                      </View>
                    ))}
                    {certsList.map((cert: string, cIdx: number) => (
                      <View key={`cert-${cIdx}`} style={[styles.coachSkillPill, styles.certBadgePill]}>
                        <Ionicons name="ribbon" size={10} color="#059669" />
                        <ThemedText style={[styles.coachSkillText, { color: '#059669', fontFamily: 'Sora_600SemiBold' }]}>
                          {cert}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Class Voucher / Offer Highlight Pill */}
                  {classVoucher && (
                    <View style={styles.cardOfferHighlight}>
                      <View style={styles.cardOfferLeft}>
                        <Ionicons name="gift" size={13} color="#d97706" />
                        <ThemedText style={styles.cardOfferHighlightText}>
                          {classVoucher.discountText}
                        </ThemedText>
                      </View>
                      <View style={styles.cardOfferPill}>
                        <ThemedText style={styles.cardOfferCodeText}>
                          {classVoucher.code}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Rich Metadata Details Grid (Runs, Days, Sessions, Fee, Level, Offer, Certified, Venue) */}
                  <View style={styles.gridContainer}>
                    {details.map((d, dIdx) => (
                      <View
                        key={`${d.icon}-${dIdx}`}
                        style={[styles.gridCell, d.full ? styles.gridCellFull : styles.gridCellHalf]}
                      >
                        <View style={[styles.gridCellIcon, { backgroundColor: theme.primary + '18' }]}>
                          <Ionicons name={d.icon} size={13} color={d.icon === 'ribbon-outline' ? '#059669' : theme.primary} />
                        </View>
                        <View style={styles.gridCellText}>
                          <ThemedText style={[styles.gridCellLabel, { color: theme.textSecondary }]}>
                            {d.label}
                          </ThemedText>
                          <ThemedText style={[styles.gridCellValue, { color: d.icon === 'ribbon-outline' ? '#059669' : theme.text }]} numberOfLines={2}>
                            {d.value}
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Bottom Action Button: Full-width clean Book in Touch */}
                  <Pressable
                    style={styles.coachGetInTouchBtn}
                    onPress={() => {
                      if (coach.rawClass) {
                        router.push({
                          pathname: '/enroll',
                          params: {
                            classId: coach.rawClass.id,
                            title: coach.rawClass.className,
                            price: String(coach.rawClass.feeAmount || 0),
                            dates: [coach.rawClass.startDate, coach.rawClass.endDate].filter(Boolean).join(' – '),
                            location: coach.rawClass.venue || 'TBD',
                            promoCode: classVoucher?.code || '',
                            certificates: certsText,
                          },
                        });
                      } else {
                        router.push({
                          pathname: '/coach/[id]',
                          params: {
                            id: coach.id,
                            name: coach.coachName,
                            specialty: coach.roleTitle,
                            rating: String(coach.rating),
                            rate: coach.rateText,
                            avatar: coach.avatar,
                            promoCode: classVoucher?.code || '',
                            certificates: certsText,
                          },
                        });
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Book in Touch with ${coach.coachName}`}
                  >
                    <ThemedText style={[styles.coachGetInTouchText, { color: theme.text }]}>
                      Book in Touch
                    </ThemedText>
                  </Pressable>
                </Reanimated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  browserContainer: { flex: 1, width: '100%' },
  fixedFilterSection: { width: '100%' },
  cardsScroll: { flex: 1, width: '100%' },
  cardsScrollContent: { paddingBottom: 140, paddingTop: 4 },
  flex: { flex: 1 },
  body: { paddingBottom: 120 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 33,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 8,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: 'Sora_400Regular',
    outlineStyle: 'none' as any,
    includeFontPadding: false,
  },

  sportRow: { gap: 6, paddingRight: 4, paddingBottom: 8 },
  sportChip: {
    height: 25,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportText: { fontSize: 9.5, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.2 },

  section: { gap: 10 },

  frostedCoachCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: 10,
    paddingBottom: 9,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  coachCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  avatarPressable: {
    position: 'relative',
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    backgroundColor: '#cbd5e1',
  },
  coachHeadInfo: {
    flex: 1,
    minWidth: 0,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coachNameText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14.5,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 2,
  },
  viewProfileBtnText: {
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
  },
  coachRoleText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    marginTop: 2,
  },
  ratingScoreText: {
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
    color: '#b45309',
  },
  ratingCountText: {
    fontSize: 9,
    fontFamily: 'Sora_400Regular',
  },
  coachSkillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
    marginBottom: 6,
  },
  coachSkillPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  certBadgePill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  coachSkillText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 8.5,
  },
  cardOfferHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  cardOfferLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardOfferHighlightText: {
    fontSize: 10.5,
    fontFamily: 'Sora_700Bold',
    color: '#b45309',
  },
  cardOfferPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d97706',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  cardOfferCodeText: {
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.65)',
  },
  gridCell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingRight: 4,
  },
  gridCellHalf: {
    width: '50%',
  },
  gridCellFull: {
    width: '100%',
  },
  gridCellIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  gridCellText: {
    flex: 1,
    minWidth: 0,
  },
  gridCellLabel: {
    fontSize: 8.5,
    lineHeight: 12,
    fontFamily: 'Sora_400Regular',
    letterSpacing: 0.2,
  },
  gridCellValue: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Sora_500Medium',
  },
  coachGetInTouchBtn: {
    height: 28,
    borderRadius: 999,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  coachGetInTouchText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
