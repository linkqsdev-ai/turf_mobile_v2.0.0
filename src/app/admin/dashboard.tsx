import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Dimensions } from 'react-native';

// Note: react-native-chart-kit may not be installed; this file uses a simple
// fallback if the chart component is not available. The layout is still useful.

export default function AdminDashboard() {
  const screenWidth = Dimensions.get('window').width - 40;

  const mockIncome = [1200, 1500, 1100, 2000, 1800, 2500];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="headlineMd">Turf Analytics</ThemedText>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <ThemedText type="labelMd">Income (This Month)</ThemedText>
          <ThemedText type="displayLgMobile">₹ 42,300</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="labelMd">Expense (This Month)</ThemedText>
          <ThemedText type="displayLgMobile">₹ 12,400</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="labelMd">Most Demanded Sport</ThemedText>
          <ThemedText type="displayLgMobile">Cricket</ThemedText>
        </View>
      </View>

      <View style={{ marginTop: 18, paddingHorizontal: 20 }}>
        <ThemedText type="labelMd">Income Trend</ThemedText>
        <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
          {/* Simple mock bar chart area (use real charting later) */}
          <View style={{ width: screenWidth, height: 140, backgroundColor: '#f6f9ff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText>Chart placeholder</ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  header: { paddingHorizontal: 20 },
  cards: { paddingHorizontal: 20, marginTop: 14, gap: 12 },
  card: { padding: 14, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#00000011' },
});
