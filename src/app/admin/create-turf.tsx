import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

type Slot = { id: string; name: string; start: string; end: string; status: 'available' | 'blocked' | 'maintenance' | 'closed' };

export default function CreateTurf() {
  const router = useRouter();
  const [turfName, setTurfName] = useState('');
  const [sportName, setSportName] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);

  function addSlot() {
    setSlots(s => [...s, { id: String(Date.now()), name: 'Slot ' + (s.length + 1), start: '09:00', end: '10:00', status: 'available' }]);
  }

  function updateSlot(id: string, patch: Partial<Slot>) {
    setSlots(s => s.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  function saveTurf() {
    // For now persist locally (to be replaced with API)
    console.log('Saving turf', { turfName, sportName, slots });
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ThemedText type="headlineMd">Create New Turf</ThemedText>

        <ThemedText type="labelSm" style={{ marginTop: 16 }}>Turf Name</ThemedText>
        <TextInput
          value={turfName}
          maxLength={30}
          onChangeText={(t) => setTurfName(t.replace(/[0-9]/g, '').slice(0, 30))}
          placeholder="Enter turf name (letters only)"
          style={styles.input}
        />

        <ThemedText type="labelSm" style={{ marginTop: 12 }}>Sport</ThemedText>
        <TextInput value={sportName} onChangeText={setSportName} placeholder="e.g. Football, Cricket" style={styles.input} />

        <ThemedText type="labelSm" style={{ marginTop: 12 }}>Slots</ThemedText>

        {slots.map(slot => (
          <View key={slot.id} style={styles.slotRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={slot.name} onChangeText={v => updateSlot(slot.id, { name: v })} />
            <TextInput style={[styles.input, { width: 80 }]} value={slot.start} onChangeText={v => updateSlot(slot.id, { start: v })} />
            <TextInput style={[styles.input, { width: 80 }]} value={slot.end} onChangeText={v => updateSlot(slot.id, { end: v })} />
            <Pressable style={styles.statusBtn} onPress={() => {
              const order: Slot['status'][] = ['available', 'blocked', 'maintenance', 'closed'];
              const next = order[(order.indexOf(slot.status) + 1) % order.length];
              updateSlot(slot.id, { status: next });
            }}>
              <ThemedText type="labelSm">{slot.status}</ThemedText>
            </Pressable>
          </View>
        ))}

        <Pressable onPress={addSlot} style={[styles.button, { marginTop: 12 }]}>
          <ThemedText type="labelMd">Add Slot</ThemedText>
        </Pressable>

        <View style={{ height: 20 }} />

        <Pressable onPress={saveTurf} style={[styles.button, { backgroundColor: '#3c87f7' }]}>
          <ThemedText type="labelMd" style={{ color: '#fff' }}>Save Turf</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#e1e8f0', padding: 8, borderRadius: 8, marginTop: 6 },
  slotRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  statusBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f0f4ff' },
  button: { padding: 14, borderRadius: 8, backgroundColor: '#e9f2ff', alignItems: 'center' },
});
