import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Comprehensive mock data for Academy Students
interface StudentRecord {
  id: string;
  name: string;
  avatar: any;
  registeredClass: string;
  sport: string;
  sportIcon: string;
  role: string;
  phone: string;
  joinedDate: string;
  paidAmount: number;
  dueAmount: number;
  feeStatus: 'PAID' | 'DUE' | 'PARTIAL';
  attendancePercent: number;
  attendedSessions: number;
  totalSessions: number;
  nextSessionTime: string;
  pitchArea: string;
  notes: string;
  rating: string;
  focusTag: string;
}

const ACADEMY_STUDENTS: StudentRecord[] = [
  {
    id: 's-1',
    name: 'Marcus Vance',
    avatar: require('@/assets/images/avatars/avatar_2.png'),
    registeredClass: 'Under-16 Advanced Drill',
    sport: 'Football',
    sportIcon: 'football',
    role: 'Forward • Level 10',
    phone: '+91 98765 43210',
    joinedDate: '12 May 2026',
    paidAmount: 5000,
    dueAmount: 0,
    feeStatus: 'PAID',
    attendancePercent: 95,
    attendedSessions: 19,
    totalSessions: 20,
    nextSessionTime: 'Today, 15:30',
    pitchArea: 'Pitch A',
    notes: 'Excellent explosive speed & sprint stamina',
    rating: '4.9',
    focusTag: 'FOOTBALL DRILL',
  },
  {
    id: 's-2',
    name: 'Elena Rostova',
    avatar: require('@/assets/images/avatars/avatar_5.png'),
    registeredClass: 'Individual Mentoring',
    sport: 'Fitness & Tactics',
    sportIcon: 'fitness',
    role: 'Midfielder • Level 14',
    phone: '+91 98765 11223',
    joinedDate: '01 Jun 2026',
    paidAmount: 8500,
    dueAmount: 0,
    feeStatus: 'PAID',
    attendancePercent: 98,
    attendedSessions: 24,
    totalSessions: 25,
    nextSessionTime: 'Today, 18:00',
    pitchArea: 'Gym Area',
    notes: 'Great ball possession control & spatial awareness',
    rating: '4.8',
    focusTag: 'INDIVIDUAL MENTORING',
  },
  {
    id: 's-3',
    name: 'Rob Miller',
    avatar: require('@/assets/images/avatars/avatar_12.png'),
    registeredClass: 'Under-16 Advanced Drill',
    sport: 'Football',
    sportIcon: 'football',
    role: 'Goalkeeper • Level 8',
    phone: '+91 98765 99887',
    joinedDate: '15 Jun 2026',
    paidAmount: 3500,
    dueAmount: 1500,
    feeStatus: 'DUE',
    attendancePercent: 88,
    attendedSessions: 14,
    totalSessions: 16,
    nextSessionTime: 'Today, 15:30',
    pitchArea: 'Pitch A',
    notes: 'Needs reflex response practice on low dives',
    rating: '4.5',
    focusTag: 'GK ACADEMY',
  },
  {
    id: 's-4',
    name: 'Sarah Connor',
    avatar: require('@/assets/images/avatars/avatar_3.png'),
    registeredClass: 'Junior Cricket Academy',
    sport: 'Cricket',
    sportIcon: 'cricket',
    role: 'All-Rounder • Level 12',
    phone: '+91 98765 44332',
    joinedDate: '20 May 2026',
    paidAmount: 6000,
    dueAmount: 0,
    feeStatus: 'PAID',
    attendancePercent: 92,
    attendedSessions: 22,
    totalSessions: 24,
    nextSessionTime: 'Tomorrow, 07:00',
    pitchArea: 'Net 2',
    notes: 'Outstanding spin bowling accuracy & line length',
    rating: '4.9',
    focusTag: 'CRICKET BATCH',
  },
  {
    id: 's-5',
    name: 'David Wright',
    avatar: require('@/assets/images/avatars/avatar_4.png'),
    registeredClass: 'Weekend Tennis Camp',
    sport: 'Tennis',
    sportIcon: 'tennisball',
    role: 'Baseline Player • Level 11',
    phone: '+91 98765 77665',
    joinedDate: '04 Jul 2026',
    paidAmount: 3000,
    dueAmount: 1000,
    feeStatus: 'PARTIAL',
    attendancePercent: 90,
    attendedSessions: 18,
    totalSessions: 20,
    nextSessionTime: 'Saturday, 16:00',
    pitchArea: 'Court 1',
    notes: 'Topspin forehand precision is improving',
    rating: '4.7',
    focusTag: 'TENNIS CAMP',
  },
  {
    id: 's-6',
    name: 'Kevin Zhang',
    avatar: require('@/assets/images/avatars/avatar_1.png'),
    registeredClass: 'Under-16 Advanced Drill',
    sport: 'Football',
    sportIcon: 'football',
    role: 'Defender • Level 9',
    phone: '+91 98765 88112',
    joinedDate: '10 Jun 2026',
    paidAmount: 3000,
    dueAmount: 2000,
    feeStatus: 'DUE',
    attendancePercent: 82,
    attendedSessions: 13,
    totalSessions: 16,
    nextSessionTime: 'Today, 15:30',
    pitchArea: 'Pitch A',
    notes: 'Strong aerial tackle timing',
    rating: '4.6',
    focusTag: 'FOOTBALL DRILL',
  },
];

import { useClassStore } from '@/store/app-store';

const CLASS_VARIANTS = [
  'All Classes',
  'Under-16 Advanced Drill',
  'Individual Mentoring',
  'Junior Cricket Academy',
  'Weekend Tennis Camp',
];

export default function CoachStudentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { classes } = useClassStore();

  const [selectedClass, setSelectedClass] = useState<string>(
    (params.classVariant as string) || 'All Classes'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState<'ALL' | 'PAID' | 'DUE'>('ALL');
  const [attendanceLog, setAttendanceLog] = useState<Record<string, boolean>>({});

  const classVariants = useMemo(() => {
    const customNames = (classes || []).map((c: any) => c.className).filter(Boolean);
    return Array.from(new Set(['All Classes', ...customNames, ...CLASS_VARIANTS]));
  }, [classes]);

  const allStudents = useMemo(() => {
    const customStudents: StudentRecord[] = (classes || []).map((cls: any, i: number) => ({
      id: `created-student-${i}`,
      name: `Enrolled Trainee (${cls.className})`,
      avatar: require('@/assets/images/avatars/avatar_10.png'),
      registeredClass: cls.className,
      sport: cls.sportType || 'Sports',
      sportIcon: (cls.sportType || 'football').toLowerCase(),
      role: `Active Student • ${cls.ageGroup || 'All Ages'}`,
      phone: '+91 98000 11223',
      joinedDate: cls.startDate || 'Recently',
      paidAmount: cls.feeAmount ? parseFloat(cls.feeAmount) : 1000,
      dueAmount: 0,
      feeStatus: 'PAID',
      attendancePercent: 100,
      attendedSessions: 1,
      totalSessions: 1,
      nextSessionTime: cls.sessionTime || 'Upcoming Session',
      pitchArea: cls.venue || 'Main Ground',
      notes: `${cls.classType} batch enrolled`,
      rating: '5.0',
      focusTag: (cls.sportType || 'TRAINING').toUpperCase(),
    }));

    return [...customStudents, ...ACADEMY_STUDENTS];
  }, [classes]);

  // Filter students based on Class Variant, Search Query, and Fee Filter
  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      const matchesClass =
        selectedClass === 'All Classes' ||
        student.registeredClass.toLowerCase() === selectedClass.toLowerCase();

      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.registeredClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFee =
        feeFilter === 'ALL' ||
        (feeFilter === 'PAID' && student.feeStatus === 'PAID') ||
        (feeFilter === 'DUE' && (student.feeStatus === 'DUE' || student.feeStatus === 'PARTIAL'));

      return matchesClass && matchesSearch && matchesFee;
    });
  }, [allStudents, selectedClass, searchQuery, feeFilter]);

  // Aggregate Metrics
  const totalPaid = useMemo(() => filteredStudents.reduce((acc, s) => acc + s.paidAmount, 0), [filteredStudents]);
  const totalDue = useMemo(() => filteredStudents.reduce((acc, s) => acc + s.dueAmount, 0), [filteredStudents]);
  const avgAttendance = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const sum = filteredStudents.reduce((acc, s) => acc + s.attendancePercent, 0);
    return Math.round(sum / filteredStudents.length);
  }, [filteredStudents]);

  const toggleAttendanceMark = (id: string, currentName: string) => {
    setAttendanceLog(prev => {
      const next = !prev[id];
      Alert.alert(
        'Attendance Updated',
        `${currentName} marked as ${next ? 'PRESENT ✅' : 'ABSENT ❌'} for today's session.`
      );
      return { ...prev, [id]: next };
    });
  };

  return (
    <GradientContainer screenName="coach" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* Top App Bar Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'Sora_600SemiBold' }}>
              Academy Student Roster
            </ThemedText>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, fontSize: 11 }}>
              {filteredStudents.length} Trainees • Class Variants & Fee Ledger
            </ThemedText>
          </View>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: theme.surfaceLowest }]}
            onPress={() => router.push('/create-class')}
          >
            <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Financial & Attendance Metrics Overview Bar */}
          <View style={[styles.metricsBanner, { backgroundColor: theme.primaryContainer }, Shadows.level3]}>
            <View style={styles.metricItem}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                STUDENTS
              </ThemedText>
              <ThemedText style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                {filteredStudents.length}
              </ThemedText>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />

            <View style={styles.metricItem}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                FEES PAID
              </ThemedText>
              <ThemedText style={{ color: '#4ade80', fontSize: 18, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                ₹{totalPaid.toLocaleString()}
              </ThemedText>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />

            <View style={styles.metricItem}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                TOTAL DUE
              </ThemedText>
              <ThemedText style={{ color: totalDue > 0 ? '#f87171' : '#ffffff', fontSize: 18, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                ₹{totalDue.toLocaleString()}
              </ThemedText>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />

            <View style={styles.metricItem}>
              <ThemedText style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10, fontFamily: 'Sora_600SemiBold' }}>
                AVG ATT.
              </ThemedText>
              <ThemedText style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                {avgAttendance}%
              </ThemedText>
            </View>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '40' }]}>
            <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
            <TextInput
              placeholder="Search student by name or class..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.text }]}
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primary}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {/* Class Variant Selector Chips */}
          <View style={styles.sectionMargin}>
            <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginBottom: 8, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5 }}>
              CLASS VARIANTS
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {classVariants.map(variant => {
                const isActive = selectedClass.toLowerCase() === variant.toLowerCase();
                return (
                  <Pressable
                    key={variant}
                    onPress={() => setSelectedClass(variant)}
                    style={[
                      styles.classChip,
                      {
                        backgroundColor: isActive ? theme.primary : theme.surfaceLowest,
                        borderColor: isActive ? theme.primary : theme.outlineVariant + '33',
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.classChipText,
                        { color: isActive ? '#ffffff' : theme.text },
                      ]}
                    >
                      {variant}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Fee Ledger Quick Filter Tabs */}
          <View style={styles.feeFilterRow}>
            {(['ALL', 'PAID', 'DUE'] as const).map(tab => {
              const isActive = feeFilter === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setFeeFilter(tab)}
                  style={[
                    styles.feeTab,
                    isActive && { backgroundColor: theme.primaryContainer + '20', borderColor: theme.primary },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.feeTabText,
                      { color: isActive ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {tab === 'ALL' ? 'All' : tab === 'PAID' ? 'Fully Paid' : 'Pending / Due'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Student Cards List */}
          <View style={{ gap: 14, marginTop: 10 }}>
            {filteredStudents.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.surfaceLowest }]}>
                <Ionicons name="people-outline" size={40} color={theme.textSecondary} />
                <ThemedText type="headlineSm" style={{ marginTop: 10 }}>
                  No Students Found
                </ThemedText>
                <ThemedText type="bodySm" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>
                  No student records match the selected class variant or search criteria.
                </ThemedText>
              </View>
            ) : (
              filteredStudents.map(student => {
                const isMarked = attendanceLog[student.id] ?? true;
                const attendanceColor =
                  student.attendancePercent >= 90
                    ? '#16a34a'
                    : student.attendancePercent >= 80
                    ? '#2563eb'
                    : '#d97706';

                return (
                  <View
                    key={student.id}
                    style={[
                      styles.studentCard,
                      { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '30' },
                      Shadows.level2,
                    ]}
                  >
                    {/* Header Row: Avatar, Name, Registered Class */}
                    <View style={styles.cardHeader}>
                      <View style={{ position: 'relative' }}>
                        <Image source={student.avatar} style={styles.avatar} contentFit="cover" />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 16 }}>
                          {student.name}
                        </ThemedText>

                        {/* Registered Class Tag */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                          <Ionicons name="school-outline" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                          <ThemedText style={{ color: theme.primary, fontSize: 11, fontFamily: 'Sora_600SemiBold' }}>
                            {student.registeredClass}
                          </ThemedText>
                        </View>

                        <ThemedText style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                          {student.sport} • {student.role}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Financial Ledger Section: Paid & Due Breakdown */}
                    <View style={[styles.ledgerRow, { backgroundColor: theme.surfaceLow }]}>
                      <View style={styles.ledgerCol}>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_600SemiBold' }}>
                          PAID AMOUNT
                        </ThemedText>
                        <ThemedText style={{ color: '#16a34a', fontSize: 13, fontFamily: 'Sora_600SemiBold', marginTop: 1 }}>
                          ₹{student.paidAmount.toLocaleString()}
                        </ThemedText>
                      </View>

                      <View style={[styles.vDivider, { backgroundColor: theme.outlineVariant + '33' }]} />

                      <View style={styles.ledgerCol}>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_600SemiBold' }}>
                          DUE AMOUNT
                        </ThemedText>
                        <ThemedText style={{ color: student.dueAmount > 0 ? '#dc2626' : theme.textSecondary, fontSize: 13, fontFamily: 'Sora_600SemiBold', marginTop: 1 }}>
                          ₹{student.dueAmount.toLocaleString()}
                        </ThemedText>
                      </View>

                      <View style={[styles.vDivider, { backgroundColor: theme.outlineVariant + '33' }]} />

                      <View style={styles.ledgerCol}>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 9, fontFamily: 'Sora_600SemiBold' }}>
                          ATTENDANCE
                        </ThemedText>
                        <ThemedText style={{ color: attendanceColor, fontSize: 13, fontFamily: 'Sora_600SemiBold', marginTop: 1 }}>
                          {student.attendancePercent}% ({student.attendedSessions}/{student.totalSessions})
                        </ThemedText>
                      </View>
                    </View>

                    {/* Attendance Occupied Progress Bar */}
                    <View style={{ marginTop: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 10 }}>
                          Sessions Occupied: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold' }}>{student.attendedSessions} of {student.totalSessions} Sessions</ThemedText>
                        </ThemedText>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 10 }}>
                          Next: <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_600SemiBold' }}>{student.nextSessionTime}</ThemedText>
                        </ThemedText>
                      </View>

                      <View style={[styles.progressBarBg, { backgroundColor: theme.outlineVariant + '25' }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${student.attendancePercent}%`, backgroundColor: attendanceColor },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Notes & Tactical Focus */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Ionicons name="chatbubble-ellipses-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 10, fontStyle: 'italic', flex: 1 }} numberOfLines={1}>
                        "{student.notes}"
                      </ThemedText>
                    </View>

                    {/* Actions Bar: Call, Message, Attendance Toggle, Full Profile */}
                    <View style={[styles.actionsRow, { borderTopColor: theme.outlineVariant + '20' }]}>
                      <Pressable
                        style={[styles.actionIconBtn, { backgroundColor: theme.primaryContainer + '15' }]}
                        onPress={() => Linking.openURL(`tel:${student.phone}`)}
                      >
                        <Ionicons name="call-outline" size={15} color={theme.primary} />
                        <ThemedText style={{ color: theme.primary, fontSize: 11, fontFamily: 'Sora_600SemiBold', marginLeft: 4 }}>
                          Call
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        style={[styles.actionIconBtn, { backgroundColor: theme.surfaceLow }]}
                        onPress={() => toggleAttendanceMark(student.id, student.name)}
                      >
                        <Ionicons name={isMarked ? 'checkmark-circle' : 'close-circle'} size={15} color={isMarked ? '#16a34a' : '#dc2626'} />
                        <ThemedText style={{ color: isMarked ? '#16a34a' : '#dc2626', fontSize: 11, fontFamily: 'Sora_600SemiBold', marginLeft: 4 }}>
                          {isMarked ? 'Marked Present' : 'Mark Present'}
                        </ThemedText>
                      </Pressable>

                      <Pressable
                        style={[styles.actionIconBtn, { backgroundColor: theme.primary }]}
                        onPress={() => router.push({
                          pathname: '/player-profile',
                          params: {
                            name: student.name,
                            role: student.role,
                            notes: student.notes,
                            rating: student.rating,
                            focus: student.focusTag,
                            registeredClass: student.registeredClass,
                            attendance: `${student.attendancePercent}%`,
                            feeStatus: `${student.feeStatus} (Paid: ₹${student.paidAmount}, Due: ₹${student.dueAmount})`,
                          }
                        })}
                      >
                        <ThemedText style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Sora_600SemiBold' }}>
                          View Details
                        </ThemedText>
                        <Ionicons name="chevron-forward" size={14} color="#ffffff" style={{ marginLeft: 2 }} />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: 6,
    borderRadius: BorderRadius.full,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
  },
  metricsBanner: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontFamily: 'Sora_400Regular',
    outlineStyle: 'none',
    outlineWidth: 0,
    borderWidth: 0,
  } as any,
  sectionMargin: {
    marginBottom: Spacing.md,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  classChipText: {
    fontSize: 11.5,
    fontFamily: 'Sora_600SemiBold',
  },
  feeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  feeTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  feeTabText: {
    fontSize: 11,
    fontFamily: 'Sora_600SemiBold',
  },
  studentCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
  },
  ledgerRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerCol: {
    flex: 1,
    alignItems: 'center',
  },
  vDivider: {
    width: 1,
    height: 22,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  emptyCard: {
    padding: 30,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
