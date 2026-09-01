import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/screen';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/ui/section';
import { MotionView, Stagger } from '@/components/motion';
import { useTokens } from '@/hooks/use-scheme';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const INCOME = [1200, 1500, 1100, 2000, 1800, 2500];

const STATS = [
  { label: 'Income · this month', value: '₹42,300', icon: 'trending-up-outline', tone: 'text-success' },
  { label: 'Expense · this month', value: '₹12,400', icon: 'trending-down-outline', tone: 'text-destructive' },
  { label: 'Occupancy', value: '78%', icon: 'calendar-outline', tone: 'text-foreground' },
  { label: 'Top sport', value: 'Cricket', icon: 'tennisball-outline', tone: 'text-foreground' },
] as const;

export default function AdminDashboard() {
  const t = useTokens();
  const max = Math.max(...INCOME);

  return (
    <Screen header={{ title: 'Turf analytics', large: true, subtitle: 'Last 6 months' }}>
      <Stagger className="flex-row flex-wrap gap-3 pt-2">
        {STATS.map((s) => (
          <Card key={s.label} variant="elevated" className="w-[47%] gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Ionicons name={s.icon as any} size={16} color={t.mutedForeground} />
            </View>
            <Text className={`font-extrabold text-2xl ${s.tone}`}>{s.value}</Text>
            <Text variant="caption">{s.label}</Text>
          </Card>
        ))}
      </Stagger>

      <Section title="Income trend" className="mt-6">
        <Card variant="elevated">
          <View className="h-44 flex-row items-end justify-between gap-2 pt-2">
            {INCOME.map((v, i) => (
              <View key={i} className="flex-1 items-center gap-2">
                <View className="w-full flex-1 justify-end">
                  <MotionView
                    preset="fade-up"
                    delay={i * 0.06}
                    className="w-full rounded-t-lg bg-primary"
                    style={{ height: `${Math.round((v / max) * 100)}%` }}
                  />
                </View>
                <Text variant="caption">{MONTHS[i]}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>

      <Section title="Highlights" className="mt-6">
        <Card variant="surface" className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="subtle">Weekend utilisation</Text>
            <Badge variant="success">+12%</Badge>
          </View>
          <View className="flex-row items-center justify-between">
            <Text variant="subtle">Cancellations</Text>
            <Badge variant="warning">3.4%</Badge>
          </View>
          <View className="flex-row items-center justify-between">
            <Text variant="subtle">Repeat customers</Text>
            <Badge variant="primary">61%</Badge>
          </View>
        </Card>
      </Section>
    </Screen>
  );
}
