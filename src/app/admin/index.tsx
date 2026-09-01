import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/screen';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Stagger } from '@/components/motion';
import { useTokens } from '@/hooks/use-scheme';

const ITEMS: { title: string; desc: string; icon: keyof typeof Ionicons.glyphMap; href: string }[] = [
  { title: 'Create turf & slots', desc: 'Add a venue and configure its weekly availability grid', icon: 'add-circle-outline', href: '/admin/create-turf' },
  { title: 'Turf analytics', desc: 'Revenue, occupancy and demand by sport', icon: 'bar-chart-outline', href: '/admin/dashboard' },
];

export default function AdminIndex() {
  const router = useRouter();
  const t = useTokens();
  return (
    <Screen header={{ title: 'Admin', large: true, subtitle: 'Manage venues and review performance' }}>
      <Stagger className="gap-3 pt-2">
        {ITEMS.map((it) => (
          <Card key={it.href} variant="elevated" onPress={() => router.push(it.href as any)} className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <Ionicons name={it.icon} size={20} color={t.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-sm text-foreground">{it.title}</Text>
              <Text variant="caption">{it.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.mutedForeground} />
          </Card>
        ))}
      </Stagger>
    </Screen>
  );
}
