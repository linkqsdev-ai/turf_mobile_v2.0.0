import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ViewToken } from 'react-native';

interface CarouselProps {
  data: any[];
  renderItem: (item: any) => React.ReactElement | null;
  height?: number;
}

export function Carousel({ data, renderItem, height = 200 }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % data.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex, data.length]);

  return (
    <View style={{ height, backgroundColor: 'transparent' }}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={({ item }) => renderItem(item)}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems[0]) setActiveIndex(viewableItems[0].index || 0);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.dotsContainer}>
        {data.map((_, i) => (
          <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1' },
  dotActive: { backgroundColor: '#22c55e', width: 24 },
});
