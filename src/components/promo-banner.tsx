import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ImageBackground, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius } from '@/constants/theme';

export interface PromoBannerProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  onPress?: () => void;
  backgroundImage?: string;
  illustrationImage?: any; // require image or uri
  backgroundColor?: string;
  isGradient?: boolean;
  gradientColors?: [string, string];
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  overlayOpacity?: number;
  badgeText?: string;
  variant?: 'horizontal' | 'vertical';
}

export function PromoBanner({
  title,
  subtitle,
  buttonText,
  onPress,
  backgroundImage,
  illustrationImage,
  backgroundColor = '#1e3a8a',
  isGradient = false,
  gradientColors = ['#1e3a8a', '#1e40af'],
  buttonBackgroundColor = '#ffffff',
  buttonTextColor = '#1e3a8a',
  overlayOpacity = 0.4,
  badgeText,
  variant = 'horizontal',
}: PromoBannerProps) {
  const isVertical = variant === 'vertical';

  const content = (
    <View style={isVertical ? styles.contentVertical : styles.content}>
      <View style={styles.textContainer}>
        {badgeText && (
          <View style={styles.badgeContainer}>
            <ThemedText style={styles.badgeText}>{badgeText}</ThemedText>
          </View>
        )}
        <ThemedText style={isVertical ? styles.titleVertical : styles.title} numberOfLines={2}>{title}</ThemedText>
        {subtitle && <ThemedText style={isVertical ? styles.subtitleVertical : styles.subtitle} numberOfLines={2}>{subtitle}</ThemedText>}
      </View>
      
      {buttonText && (
        <Pressable onPress={onPress} style={[styles.button, { backgroundColor: buttonBackgroundColor }, isVertical && { marginTop: Spacing.sm }]}>
          <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>{buttonText}</ThemedText>
        </Pressable>
      )}

      {!isVertical && illustrationImage && (
        <Image 
          source={typeof illustrationImage === 'string' ? { uri: illustrationImage } : illustrationImage} 
          style={styles.illustration} 
          contentFit="contain" 
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isVertical ? 'transparent' : backgroundColor }]}>
      {backgroundImage ? (
        <ImageBackground 
          source={{ uri: backgroundImage }} 
          style={isVertical ? styles.backgroundVertical : styles.background} 
          imageStyle={{ borderRadius: BorderRadius.xl || 24 }}
        >
          <LinearGradient
            colors={isVertical ? ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.75)'] : [`rgba(0,0,0,${overlayOpacity})`, `rgba(0,0,0,${overlayOpacity})`]}
            style={StyleSheet.absoluteFill}
          />
          {content}
        </ImageBackground>
      ) : isGradient ? (
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={isVertical ? styles.backgroundVertical : styles.background}>
          {content}
        </LinearGradient>
      ) : (
        <View style={isVertical ? styles.backgroundVertical : styles.background}>
          {content}
        </View>
      )}
    </View>
  );
}

export function AutoScrollingHorizontalBanners({ 
  banners,
  cardWidth = 270,
  gap = 12
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
    }, 3500); // auto scroll every 3.5s

    return () => clearInterval(interval);
  }, [banners.length, step]);

  return (
    <View style={{ height: 160, overflow: 'visible' }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: Spacing.containerMargin, gap: gap }}
      >
        {banners.map((banner, index) => (
          <View key={index} style={{ width: cardWidth }}>
            <PromoBanner {...banner} variant="horizontal" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl || 24,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: 'transparent',
  },
  background: {
    borderRadius: BorderRadius.xl || 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
  },
  backgroundVertical: {
    borderRadius: BorderRadius.xl || 24,
    overflow: 'hidden',
    position: 'relative',
    height: 180,
  },
  content: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  contentVertical: {
    flexDirection: 'column',
    padding: Spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
  },
  textContainer: {
    flex: 1,
    zIndex: 2,
    paddingRight: Spacing.sm,
  },
  title: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  titleVertical: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.sm,
  },
  subtitleVertical: {
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
  },
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    zIndex: 3,
  },
  buttonText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
  },
  illustration: {
    width: 100,
    height: 100,
    zIndex: 2,
  },
});
