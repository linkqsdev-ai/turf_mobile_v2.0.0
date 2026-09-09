import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/ui/section';
import { MotionView } from '@/components/motion';
import { cn } from '@/lib/utils';

type SlotStatus = 'available' | 'blocked' | 'maintenance' | 'closed';
type Slot = { id: string; name: string; start: string; end: string; status: SlotStatus };

const STATUS_TONE: Record<SlotStatus, string> = {
  available: 'success',
  blocked: 'destructive',
  maintenance: 'warning',
  closed: 'muted',
};

export default function CreateTurf() {
  const router = useRouter();
  const [turfName, setTurfName] = useState('');
  const [sportName, setSportName] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);

  const addSlot = () =>
    setSlots((s) => [
      ...s,
      { id: String(Date.now()), name: `Slot ${s.length + 1}`, start: '09:00', end: '10:00', status: 'available' },
    ]);

  const updateSlot = (id: string, patch: Partial<Slot>) =>
    setSlots((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeSlot = (id: string) => setSlots((s) => s.filter((x) => x.id !== id));

  const cycleStatus = (slot: Slot) => {
    const order: SlotStatus[] = ['available', 'blocked', 'maintenance', 'closed'];
    updateSlot(slot.id, { status: order[(order.indexOf(slot.status) + 1) % order.length] });
  };

  const saveTurf = () => {
    console.log('Saving turf', { turfName, sportName, slots });
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <Screen
      header={{ title: 'New turf' }}
      footer={
        <Button block disabled={!turfName || !sportName} onPress={saveTurf}>
          Save turf
        </Button>
      }
    >
      <View className="gap-4 pt-3">
        <Input
          label="Turf name"
          placeholder="Letters only"
          value={turfName}
          maxLength={30}
          onChangeText={(v) => setTurfName(v.replace(/[0-9]/g, '').slice(0, 30))}
        />
        <Input
          label="Sport"
          placeholder="e.g. Football, Cricket"
          value={sportName}
          onChangeText={setSportName}
        />

        <Section
          title="Slots"
          action={{ label: '+ Add slot', onPress: addSlot }}
          className="mt-2"
        >
          {slots.length === 0 ? (
            <Card variant="muted" className="items-center py-8">
              <Ionicons name="time-outline" size={22} color="#94a5a0" />
              <Text variant="caption" className="mt-2">
                No slots yet — add your first one.
              </Text>
            </Card>
          ) : (
            slots.map((slot) => (
              <MotionView key={slot.id} preset="fade-up">
                <Card variant="surface" className="gap-2.5">
                  <View className="flex-row items-center gap-2">
                    <Input
                      containerClassName="flex-1"
                      value={slot.name}
                      onChangeText={(v) => updateSlot(slot.id, { name: v })}
                    />
                    <Pressable onPress={() => removeSlot(slot.id)} hitSlop={8} className="p-1">
                      <Ionicons name="trash-outline" size={18} color="#EC4042" />
                    </Pressable>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Input
                      containerClassName="w-24"
                      value={slot.start}
                      onChangeText={(v) => updateSlot(slot.id, { start: v })}
                    />
                    <Text variant="caption">to</Text>
                    <Input
                      containerClassName="w-24"
                      value={slot.end}
                      onChangeText={(v) => updateSlot(slot.id, { end: v })}
                    />
                    <Pressable
                      onPress={() => cycleStatus(slot)}
                      className={cn('ml-auto')}
                    >
                      <Badge variant={STATUS_TONE[slot.status] as any}>{slot.status}</Badge>
                    </Pressable>
                  </View>
                </Card>
              </MotionView>
            ))
          )}
        </Section>
      </View>
    </Screen>
  );
}
