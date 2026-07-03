import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ImageBackground, ScrollView, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  isGradient = true,
  gradientColors = ['#5D68E8', '#8B5CF6'], // Premium Indigo to Purple default
  buttonBackgroundColor = '#ffffff',
  buttonTextColor = '#5D68E8',
  overlayOpacity = 0.35,
  badgeText,
  variant = 'horizontal',
}: PromoBannerProps) {
  const theme = useTheme();
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

  const content = (
    <View style={isVertical ? styles.contentVertical : styles.content}>
      <View style={isVertical ? styles.leftColumnVertical : styles.leftColumn}>
        {badgeText && (
          <View style={styles.badgeContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <ThemedText style={styles.badgeText}>{badgeText.toUpperCase()}</ThemedText>
            </LinearGradient>
          </View>
        )}
        <ThemedText style={isVertical ? styles.titleVertical : styles.title} numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={isVertical ? styles.subtitleVertical : styles.subtitle} numberOfLines={2}>
            {subtitle}
          </ThemedText>
        )}
        
        {buttonText && (
          <Pressable 
            onPress={onPress} 
            style={({ pressed }) => [
              styles.button, 
              { backgroundColor: buttonBackgroundColor },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
            ]}
          >
            <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
              {buttonText}
            </ThemedText>
          </Pressable>
        )}
      </View>
      
      {illustrationImage && (
        <View style={isVertical ? styles.illustrationContainerVertical : styles.illustrationContainer}>
          <Image 
            source={typeof illustrationImage === 'string' ? { uri: illustrationImage } : illustrationImage} 
            style={isVertical ? styles.illustrationVertical : styles.illustration} 
            contentFit="contain" 
          />
        </View>
      )}
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
            style={isVertical ? styles.backgroundVertical : styles.background} 
            imageStyle={{ borderRadius: BorderRadius.xl || 24 }}
          >
            <LinearGradient
              colors={isGradient ? [...gradientColors] : ['rgba(0,0,0,0.1)', `rgba(0,0,0,${overlayOpacity + 0.3})`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {content}
          </ImageBackground>
        ) : isGradient ? (
          <LinearGradient 
            colors={gradientColors} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={isVertical ? styles.backgroundVertical : styles.background}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[isVertical ? styles.backgroundVertical : styles.background, { backgroundColor }]}>
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function AutoScrollingHorizontalBanners({ 
  banners,
  cardWidth = 280,
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
    <View style={{ height: 175, overflow: 'visible', marginVertical: Spacing.xs }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: Spacing.containerMargin, paddingVertical: 4, gap: gap }}
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
    marginVertical: Spacing.xs,
    shadowColor: '#5D68E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  background: {
    borderRadius: BorderRadius.xl || 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 145,
  },
  backgroundVertical: {
    borderRadius: BorderRadius.xl || 24,
    overflow: 'hidden',
    position: 'relative',
    height: 190,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  contentVertical: {
    flexDirection: 'column',
    padding: 18,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
  },
  leftColumn: {
    flex: 1.2,
    zIndex: 2,
    paddingRight: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  leftColumnVertical: {
    flex: 1,
    zIndex: 2,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titleVertical: {
    fontFamily: 'HankenGrotesk_800ExtraBold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
    lineHeight: 15,
  },
  subtitleVertical: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    lineHeight: 17,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 1.2,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  illustrationContainer: {
    flex: 0.8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1,
    height: '100%',
  },
  illustrationContainerVertical: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    zIndex: 1,
  },
  illustration: {
    width: 100,
    height: 100,
    transform: [{ scale: 1.1 }, { rotate: '-5deg' }],
  },
  illustrationVertical: {
    width: 110,
    height: 110,
    opacity: 0.9,
    transform: [{ scale: 1.05 }],
  },
});
