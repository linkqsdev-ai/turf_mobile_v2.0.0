import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChipGroup } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { MotionView } from '@/components/motion';
import { useTokens } from '@/hooks/use-scheme';

type Coach = {
  id: string;
  name: string;
  sport: string;
  rating: number;
  classes: string[];
  image?: string;
};

const COACHES: Coach[] = [
  { id: 'apex', name: 'Coach Apex', sport: 'Football', rating: 4.9, classes: ['Training', 'Summer Class'], image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 'vanguard', name: 'Coach Vanguard', sport: 'Cricket', rating: 4.7, classes: ['Training'], image: 'https://randomuser.me/api/portraits/men/44.jpg' },
  { id: 'volt', name: 'Coach Volt', sport: 'Athletics', rating: 5.0, classes: ['Summer Class'], image: 'https://randomuser.me/api/portraits/men/55.jpg' },
  { id: 'pro_badminton', name: 'Coach Elevate', sport: 'Badminton', rating: 4.8, classes: ['Training', 'Summer Class'], image: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Training', value: 'training' },
  { label: 'Summer class', value: 'summer' },
  { label: 'Top rated', value: 'top' },
] as const;

export default function CoachList() {
  const router = useRouter();
  const t = useTokens();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');

  const filtered = useMemo(() => {
    let list = COACHES.filter((c) => {
      if (
        query &&
        !c.name.toLowerCase().includes(query.toLowerCase()) &&
        !c.sport.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      if (filter === 'training' && !c.classes.includes('Training')) return false;
      if (filter === 'summer' && !c.classes.includes('Summer Class')) return false;
      return true;
    });
    if (filter === 'top') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [query, filter]);

  return (
    <Screen header={{ title: 'Coaches', large: true, subtitle: 'Find and filter coaches for classes and training' }}>
      <View className="gap-3 pt-1">
        <Input
          placeholder="Search coach or sport"
          value={query}
          onChangeText={setQuery}
          leftSlot={<Ionicons name="search" size={17} color={t.mutedForeground} />}
        />
        <ChipGroup options={FILTERS as any} value={filter} onChange={setFilter} />
      </View>

      <View className="mt-4 gap-3">
        {filtered.length === 0 ? (
          <EmptyState icon="search-outline" title="No coaches found" description="Try a different search or filter." />
        ) : (
          filtered.map((c, i) => (
            <MotionView key={c.id} preset="fade-up" delay={i * 0.05}>
              <Card
                variant="elevated"
                onPress={() => router.push({ pathname: '/coach/[id]', params: { id: c.id } })}
                className="flex-row items-center gap-3"
              >
                <Avatar uri={c.image} name={c.name} size="lg" />
                <View className="flex-1">
                  <Text className="font-bold text-foreground" numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text variant="caption">{c.sport}</Text>
                  <View className="mt-1.5 flex-row gap-1.5">
                    {c.classes.map((cl) => (
                      <Badge key={cl} variant="muted" size="sm">
                        {cl}
                      </Badge>
                    ))}
                  </View>
                </View>
                <View className="items-end gap-1">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={13} color={t.warning} />
                    <Text className="font-bold text-sm text-foreground">{c.rating}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={t.mutedForeground} />
                </View>
              </Card>
            </MotionView>
          ))
        )}
      </View>
    </Screen>
  );
}
