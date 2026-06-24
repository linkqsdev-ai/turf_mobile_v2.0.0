import { Link } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Pressable } from 'react-native';

export default function AdminIndex() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="headlineMd">Admin Dashboard</ThemedText>

      <View style={styles.menu}>
        <Link href="/admin/create-turf" asChild>
          <Pressable style={styles.button}>
            <ThemedText type="labelMd">Create Turf & Manage Slots</ThemedText>
          </Pressable>
        </Link>

        <Link href="/admin/dashboard" asChild>
          <Pressable style={styles.button}>
            <ThemedText type="labelMd">Turf Analytics</ThemedText>
          </Pressable>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  menu: { marginTop: 24, gap: 12 },
  button: { padding: 14, borderRadius: 8, backgroundColor: '#e9f2ff' },
});
