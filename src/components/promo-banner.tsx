import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ImageBackground, ScrollView, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface PromoBannerProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  onPress?: () => void;
  backgroundImage?: any;
  illustrationImage?: any;
  backgroundColor?: string;
  isGradient?: boolean;
  gradientColors?: [string, string] | [string, string, string];
  borderColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
  overlayOpacity?: number;
  badgeText?: string;
  discountBadgeText?: string;
  discountBadgeBg?: string;
  discountBadgeTextColor?: string;
  highlightText?: string;
  highlightTextColor?: string;
  designTheme?: 'magenta_pop' | 'navy_yellow_wave' | 'emerald_world' | 'purple_glow' | 'midnight_cyan' | 'velvet_gold' | 'cobalt_mint' | 'lime_coral' | 'fuchsia_coin' | 'turquoise_orange' | 'custom';
  variant?: 'horizontal' | 'vertical';
}

export function PromoBanner({
  title,
  subtitle,
  buttonText,
  onPress,
  backgroundImage,
  illustrationImage,
  backgroundColor = '#f8fafc',
  isGradient = true,
  gradientColors = ['#f8fafc', '#f1f5f9'],
  borderColor = 'rgba(0,0,0,0.08)',
  titleColor = '#ffffff',
  subtitleColor = 'rgba(255, 255, 255, 0.95)',
  buttonBackgroundColor = '#ffffff',
  buttonTextColor = '#4f46e5',
  badgeBackgroundColor = 'rgba(255, 255, 255, 0.25)',
  badgeTextColor = '#ffffff',
  badgeBorderColor = 'rgba(255, 255, 255, 0.4)',
  badgeText,
  discountBadgeText,
  discountBadgeBg = '#ffde00',
  discountBadgeTextColor = '#0f172a',
  highlightText,
  highlightTextColor = '#facc15',
  designTheme = 'custom',
  variant = 'horizontal',
}: PromoBannerProps) {
  const isVertical = variant === 'vertical';
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Background visual accents based on theme
  const renderBackgroundAccents = () => {
    switch (designTheme) {
      case 'magenta_pop':
        return (
          <>
            {/* White Organic Curved Cutout / Blob (Image 1 Style) */}
            <View style={styles.blobCutout} />
            <View style={styles.floatingCircleOne} />
            <View style={styles.floatingCircleTwo} />
          </>
        );
      case 'navy_yellow_wave':
        return (
          <>
            {/* High-Contrast Electric Yellow Wave (Image 2 Style) */}
            <View style={styles.yellowWaveShape} />
            <View style={styles.yellowDripBar} />
          </>
        );
      case 'emerald_world':
        return (
          <>
            {/* Deep Navy/Emerald Circular Contour (Image 3 Style) */}
            <View style={styles.emeraldCircleBackdrop} />
            <View style={styles.emeraldGlowAura} />
          </>
        );
      case 'purple_glow':
        return (
          <>
            {/* Glowing Focal Circle Backdrop (Image 4 Style) */}
            <View style={styles.purpleGlowCircle} />
            <View style={styles.purpleOuterRing} />
          </>
        );
      case 'midnight_cyan':
        return (
          <>
            <View style={styles.cyanCyberGlow} />
            <View style={styles.cyberGridLine} />
          </>
        );
      case 'velvet_gold':
        return (
          <>
            <View style={styles.goldTicketPerforationLeft} />
            <View style={styles.goldTicketPerforationRight} />
          </>
        );
      case 'fuchsia_coin':
        return (
          <>
            <View style={styles.coinGlowCircle} />
          </>
        );
      default:
        return null;
    }
  };

  const content = (
    <View style={isVertical ? styles.contentVertical : styles.content}>
      <View style={isVertical ? styles.leftColumnVertical : styles.leftColumn}>
        {highlightText && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <ThemedText style={[styles.highlightText, { color: highlightTextColor }]}>
              {highlightText}
            </ThemedText>
          </View>
        )}

        {/* Title */}
        <ThemedText style={[isVertical ? styles.titleVertical : styles.title, { color: titleColor }]} numberOfLines={2}>
          {title}
        </ThemedText>

        {/* Subtitle */}
        {subtitle && (
          <ThemedText style={[isVertical ? styles.subtitleVertical : styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
            {subtitle}
          </ThemedText>
        )}

        {/* CTA Button */}
        {buttonText && (
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: buttonBackgroundColor },
              pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }
            ]}
          >
            <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
              {buttonText}
            </ThemedText>
            <Ionicons name="arrow-forward" size={12} color={buttonTextColor} style={{ marginLeft: 4 }} />
          </Pressable>
        )}
      </View>

      {/* Right Graphic / Illustration */}
      <View style={isVertical ? styles.illustrationContainerVertical : styles.illustrationContainer}>
        {illustrationImage && (
          <Image
            source={typeof illustrationImage === 'string' ? { uri: illustrationImage } : illustrationImage}
            style={isVertical ? styles.illustrationVertical : styles.illustration}
            contentFit="contain"
          />
        )}
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleValue }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        {backgroundImage ? (
          <ImageBackground
            source={typeof backgroundImage === 'string' ? { uri: backgroundImage } : backgroundImage}
            style={[isVertical ? styles.backgroundVertical : styles.background, { borderColor }]}
            imageStyle={{ borderRadius: 20, resizeMode: 'cover' }}
          >
            <LinearGradient
              colors={isGradient ? [...gradientColors] : ['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.8)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {renderBackgroundAccents()}
            {content}
          </ImageBackground>
        ) : isGradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[isVertical ? styles.backgroundVertical : styles.background, { borderColor }]}
          >
            {renderBackgroundAccents()}
            {content}
          </LinearGradient>
        ) : (
          <View style={[isVertical ? styles.backgroundVertical : styles.background, { backgroundColor, borderColor }]}>
            {renderBackgroundAccents()}
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function AutoScrollingHorizontalBanners({
  banners,
  cardWidth = 305,
  gap = 16
}: {
  banners: PromoBannerProps[];
  cardWidth?: number;
  gap?: number;
}) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const step = cardWidth + gap;

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scrollViewRef.current?.scrollTo({
          x: next * step,
          animated: true,
        });
        return next;
      });
    }, 4500); // auto scroll every 4.5s

    return () => clearInterval(interval);
  }, [banners.length, step]);

  return (
    <View style={{ height: 185, marginVertical: Spacing.sm, width: '100%', overflow: 'hidden' }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: Spacing.containerMargin, paddingVertical: 6, gap: gap }}
      >
        {banners.map((banner, index) => (
          <View key={index} style={{ width: cardWidth, height: 165 }}>
            <PromoBanner {...banner} variant="horizontal" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10 VIBRANT BANNER & VOUCHER PRESETS (Inspired by user reference designs)
// ─────────────────────────────────────────────────────────────────────────────
export const BANNER_DESIGNS_10 = {
  // 1. Magenta Pop (Image 1 Style): SALE 50% OFF
  SALE_50_OFF_TURF: (onPress?: () => void): PromoBannerProps => ({
    title: "SALE 50% OFF",
    subtitle: "LIMITED OFFER • Book premium turf slots today!",
    highlightText: "OFFER LIMITED",
    highlightTextColor: "#fef08a",
    badgeText: "MEGA SALE",
    discountBadgeText: "50%\nOFF",
    discountBadgeBg: "#facc15",
    discountBadgeTextColor: "#831843",
    buttonText: "Shop Now",
    buttonBackgroundColor: "#ffffff",
    buttonTextColor: "#be185d",
    isGradient: true,
    gradientColors: ['#db2777', '#9d174d'],
    designTheme: 'magenta_pop',
    onPress,
  }),

  // 2. Electric Navy & Yellow Wave (Image 2 Style): BIG SALE 80% OFF
  BIG_SALE_80_OFF: (onPress?: () => void): PromoBannerProps => ({
    title: "BIG SALE UPTO 80% OFF",
    subtitle: "END OF SEASON • Weekend slots & tournament pass!",
    highlightText: "20-25 DEC",
    highlightTextColor: "#facc15",
    badgeText: "FLASH DEAL",
    discountBadgeText: "UPTO\n80% OFF",
    discountBadgeBg: "#facc15",
    discountBadgeTextColor: "#0f172a",
    buttonText: "Click Here",
    buttonBackgroundColor: "#0f172a",
    buttonTextColor: "#facc15",
    isGradient: true,
    gradientColors: ['#1e1b4b', '#0f172a'],
    designTheme: 'navy_yellow_wave',
    onPress,
  }),

  // 3. Explore Your World (Image 3 Style): 20% OFF Top Turfs
  EXPLORE_YOUR_WORLD: (onPress?: () => void): PromoBannerProps => ({
    title: "Explore Your World",
    subtitle: "Start Your Journey • 20% OFF 5-star rated arenas",
    highlightText: "20% OFF",
    highlightTextColor: "#34d399",
    badgeText: "EXPLORE TURFS",
    discountBadgeText: "20%\nOFF",
    discountBadgeBg: "#facc15",
    discountBadgeTextColor: "#0c4a6e",
    buttonText: "Learn More",
    buttonBackgroundColor: "#facc15",
    buttonTextColor: "#0f172a",
    isGradient: true,
    gradientColors: ['#0c4a6e', '#075985'],
    designTheme: 'emerald_world',
    onPress,
  }),

  // 4. Pro Championship Purple Glow (Image 4 Style): IT'S TIME TO EXPLORE
  PRO_CHAMPIONSHIP_DISCOUNT: (onPress?: () => void): PromoBannerProps => ({
    title: "IT'S TIME TO EXPLORE",
    subtitle: "UPTO 20% DISCOUNT • Register for Pro Championship",
    highlightText: "₹50,000 PRIZE",
    highlightTextColor: "#fb923c",
    badgeText: "UNIVERI LEAGUE",
    discountBadgeText: "20%\nDISCOUNT",
    discountBadgeBg: "#ea580c",
    discountBadgeTextColor: "#ffffff",
    buttonText: "Book Now",
    buttonBackgroundColor: "#ea580c",
    buttonTextColor: "#ffffff",
    isGradient: true,
    gradientColors: ['#6d28d9', '#4c1d95'],
    designTheme: 'purple_glow',
    onPress,
  }),

  // 5. Midnight Cyberpunk (40% OFF Night Owl)
  MIDNIGHT_MADNESS_SLOTS: (onPress?: () => void): PromoBannerProps => ({
    title: "Night Owl Midnight Slots",
    subtitle: "Flat 40% Cashback on floodlight slots after 10 PM!",
    highlightText: "40% CASHBACK",
    highlightTextColor: "#22d3ee",
    badgeText: "NIGHT PASS",
    discountBadgeText: "40%\nOFF",
    discountBadgeBg: "#06b6d4",
    discountBadgeTextColor: "#082f49",
    buttonText: "Book Night Slot",
    buttonBackgroundColor: "#06b6d4",
    buttonTextColor: "#082f49",
    isGradient: true,
    gradientColors: ['#0f172a', '#1e293b'],
    designTheme: 'midnight_cyan',
    onPress,
  }),

  // 6. Luxury Gift Card Voucher (₹500 e-Gift Pass)
  GIFT_GAME_VOUCHER: (onPress?: () => void): PromoBannerProps => ({
    title: "Gift a Game Voucher",
    subtitle: "Surprise your sports buddies with ₹500 instant credits.",
    highlightText: "E-GIFT PASS",
    highlightTextColor: "#fde047",
    badgeText: "GIFT VOUCHER",
    discountBadgeText: "₹500\nCARD",
    discountBadgeBg: "#f59e0b",
    discountBadgeTextColor: "#451a03",
    buttonText: "Get Gift Card",
    buttonBackgroundColor: "#f59e0b",
    buttonTextColor: "#451a03",
    isGradient: true,
    gradientColors: ['#831843', '#701a75'],
    designTheme: 'velvet_gold',
    onPress,
  }),

  // 7. Coach Pro Masterclass (1st Session Free)
  COACH_MASTERCLASS_FREE: (onPress?: () => void): PromoBannerProps => ({
    title: "1st Coaching Session FREE",
    subtitle: "Train with licensed football & cricket national coaches.",
    highlightText: "100% FREE",
    highlightTextColor: "#86efac",
    badgeText: "PRO COACHING",
    discountBadgeText: "FREE\nTRIAL",
    discountBadgeBg: "#10b981",
    discountBadgeTextColor: "#064e3b",
    buttonText: "Book Free Trial",
    buttonBackgroundColor: "#10b981",
    buttonTextColor: "#ffffff",
    isGradient: true,
    gradientColors: ['#1d4ed8', '#1e40af'],
    designTheme: 'cobalt_mint',
    onPress,
  }),

  // 8. Student & Youth League Pass (Flat 60% OFF)
  STUDENT_YOUTH_PASS: (onPress?: () => void): PromoBannerProps => ({
    title: "Student Discount Pass",
    subtitle: "Flat 60% OFF on all weekday morning turf slots.",
    highlightText: "60% OFF",
    highlightTextColor: "#bef264",
    badgeText: "STUDENT SPECIAL",
    discountBadgeText: "60%\nOFF",
    discountBadgeBg: "#84cc16",
    discountBadgeTextColor: "#14532d",
    buttonText: "Unlock Discount",
    buttonBackgroundColor: "#84cc16",
    buttonTextColor: "#14532d",
    isGradient: true,
    gradientColors: ['#047857', '#065f46'],
    designTheme: 'lime_coral',
    onPress,
  }),

  // 9. Super Bid Rewards (2X Coins Multiplier)
  SUPER_BID_2X_REWARDS: (onPress?: () => void): PromoBannerProps => ({
    title: "Bid Match 2X Multiplier",
    subtitle: "Challenge opponents today & earn double reward wallet coins!",
    highlightText: "2X COINS",
    highlightTextColor: "#f472b6",
    badgeText: "BID REWARDS",
    discountBadgeText: "2X\nBONUS",
    discountBadgeBg: "#ec4899",
    discountBadgeTextColor: "#ffffff",
    buttonText: "Start Bid Match",
    buttonBackgroundColor: "#ffffff",
    buttonTextColor: "#831843",
    isGradient: true,
    gradientColors: ['#7e22ce', '#a21caf'],
    designTheme: 'fuchsia_coin',
    onPress,
  }),

  // 10. Referral Cash Reward (Get ₹250 Wallet Cash)
  REFER_EARN_CASH: (onPress?: () => void): PromoBannerProps => ({
    title: "Invite & Earn ₹250",
    subtitle: "Share your invite link and get ₹250 instant wallet cash.",
    highlightText: "INSTANT CASH",
    highlightTextColor: "#fdba74",
    badgeText: "REFERRAL PASS",
    discountBadgeText: "₹250\nCASH",
    discountBadgeBg: "#f97316",
    discountBadgeTextColor: "#ffffff",
    buttonText: "Invite Friends",
    buttonBackgroundColor: "#f97316",
    buttonTextColor: "#ffffff",
    isGradient: true,
    gradientColors: ['#0e7490', '#155e75'],
    designTheme: 'turquoise_orange',
    onPress,
  }),
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    height: 165,
  },
  background: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    height: 165,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  backgroundVertical: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 185,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    zIndex: 2,
  },
  contentVertical: {
    flexDirection: 'column',
    padding: 18,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  leftColumn: {
    flex: 1.45,
    zIndex: 3,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  leftColumnVertical: {
    flex: 1,
    zIndex: 3,
    width: '100%',
    paddingRight: 80,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 3,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  titleVertical: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 19,
    color: '#ffffff',
    marginBottom: 5,
    lineHeight: 23,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: 'Sora_500Medium',
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 8,
    lineHeight: 14,
  },
  subtitleVertical: {
    fontFamily: 'Sora_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 12,
    lineHeight: 17,
  },
  highlightText: {
    fontSize: 9.5,
    fontFamily: 'Sora_800ExtraBold',
    letterSpacing: 0.4,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    zIndex: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  illustrationContainer: {
    flex: 0.55,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 3,
    height: '100%',
    position: 'relative',
  },
  illustrationContainerVertical: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 3,
    pointerEvents: 'none',
  },
  illustration: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  illustrationVertical: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },

  /* Graphical Theme Accents */
  blobCutout: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 140,
    height: 190,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 70,
    transform: [{ rotate: '25deg' }],
  },
  floatingCircleOne: {
    position: 'absolute',
    right: 95,
    top: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  floatingCircleTwo: {
    position: 'absolute',
    left: '45%',
    bottom: -15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  yellowWaveShape: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 90,
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
  },
  yellowDripBar: {
    position: 'absolute',
    right: 80,
    top: 30,
    width: 12,
    height: 60,
    borderRadius: 6,
    backgroundColor: 'rgba(250, 204, 21, 0.3)',
  },
  emeraldCircleBackdrop: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
  },
  emeraldGlowAura: {
    position: 'absolute',
    left: -20,
    bottom: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  purpleGlowCircle: {
    position: 'absolute',
    right: -15,
    top: -15,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251, 146, 60, 0.2)',
  },
  purpleOuterRing: {
    position: 'absolute',
    right: 25,
    top: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cyanCyberGlow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderTopLeftRadius: 60,
  },
  cyberGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  goldTicketPerforationLeft: {
    position: 'absolute',
    left: -8,
    top: '40%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  goldTicketPerforationRight: {
    position: 'absolute',
    right: -8,
    top: '40%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  coinGlowCircle: {
    position: 'absolute',
    right: -10,
    top: 10,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
  },
});

