import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList, Image } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Coach = {
  id: string;
  name: string;
  sport: string;
  rating: number;
  classes: string[]; // e.g. ['Training', 'Summer Class']
  image?: any;
};

const COACHES: Coach[] = [
  { id: 'c1', name: 'Rohan Patel', sport: 'Cricket', rating: 4.8, classes: ['Training', 'Summer Class'], image: require('@/assets/images/illustrations/cricket_player.png') },
  { id: 'c2', name: 'Maya Singh', sport: 'Football', rating: 4.6, classes: ['Training'], image: require('@/assets/images/illustrations/football_player.png') },
  { id: 'c3', name: 'Vikram Rao', sport: 'Badminton', rating: 4.4, classes: ['Summer Class'], image: require('@/assets/images/illustrations/athletes.png') },
  { id: 'c4', name: 'Sara Lee', sport: 'Tennis', rating: 4.9, classes: ['Training', 'Summer Class'], image: require('@/assets/images/illustrations/tennis_player.png') },
];

export default function CoachList() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'training' | 'summer'>('all');

  const filtered = useMemo(() => {
    return COACHES.filter(c => {
      if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.sport.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === 'training' && !c.classes.includes('Training')) return false;
      if (filter === 'summer' && !c.classes.includes('Summer Class')) return false;
      return true;
    });
  }, [query, filter]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="headlineMd">Coaches</ThemedText>
        <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>Find and filter coaches for classes and training</ThemedText>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput placeholder="Search coach or sport" value={query} onChangeText={setQuery} style={styles.searchInput} />
        </View>

        <View style={styles.filterRow}>
          <Pressable style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]} onPress={() => setFilter('all')}>
            <ThemedText type="labelSm">All</ThemedText>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'training' && styles.filterBtnActive]} onPress={() => setFilter('training')}>
            <ThemedText type="labelSm">Training</ThemedText>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'summer' && styles.filterBtnActive]} onPress={() => setFilter('summer')}>
            <ThemedText type="labelSm">Summer Class</ThemedText>
          </Pressable>
          <Pressable style={styles.filterBtn} onPress={() => setFilter('all')}>
            <ThemedText type="labelSm">Top Rated</ThemedText>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, { backgroundColor: theme.surfaceLowest }]} onPress={() => router.push({ pathname: '/coach/[id]', params: { id: item.id } })}>
            <Image source={item.image} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText type="headlineSm">{item.name}</ThemedText>
              <ThemedText type="bodySm" style={{ color: theme.textSecondary }}>{item.sport}</ThemedText>
              <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
                {item.classes.map((c) => (
                  <View key={c} style={styles.classBadge}>
                    <ThemedText type="labelSm">{c}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText type="labelMd">{item.rating} ★</ThemedText>
            </View>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  controls: { paddingHorizontal: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: '#f6f8ff' },
  searchInput: { marginLeft: 8, flex: 1 },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'transparent' },
  filterBtnActive: { backgroundColor: '#e6f0ff' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  classBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#eef5ff', borderRadius: 8 },
});
