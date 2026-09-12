import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText, MAX_FONT_SCALE } from '@/components/themed-text';
import { EditIcon } from '@/components/ui/edit-icon';
import { GradientContainer } from '@/components/gradient-container';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useClassStore } from '@/store/app-store';
import { getAvatarSource } from '@/constants/avatars';
import { formatSessionsShort, formatClassDate, formatReadableDate } from '@/utils/class-schedule';
import { formatPhoneNumber, getPhoneValidationError } from '@/utils/phone-utils';

export interface StudentRecord {
  id: string;
  name: string;
  avatar: any;
  registeredClass: string;
  sport: string;
  sportIcon: string;
  role: string;
  phone: string;
  joinedDate: string;
  category: string;
  status: 'ACTIVE' | 'GRADUATED' | 'INACTIVE';
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
    avatar: getAvatarSource('avatar_2'),
    registeredClass: 'Under-16 Advanced Drill',
    sport: 'Football',
    sportIcon: 'football',
    role: 'Forward • Level 10',
    category: 'U16',
    status: 'ACTIVE',
    phone: '+91 98765 43210',
    joinedDate: '12 May 2026',
    attendancePercent: 95,
    attendedSessions: 19,
    totalSessions: 20,
    nextSessionTime: '6:00 AM – 7:30 AM',
    pitchArea: 'Pitch A',
    notes: 'Excellent explosive speed & sprint stamina',
    rating: '4.9',
    focusTag: 'FOOTBALL DRILL',
  },
  {
    id: 's-2',
    name: 'Elena Rostova',
    avatar: getAvatarSource('avatar_5'),
    registeredClass: 'Individual Mentoring',
    sport: 'Fitness & Tactics',
    sportIcon: 'fitness',
    role: 'Midfielder • Level 14',
    category: 'Adults',
    status: 'ACTIVE',
    phone: '+91 98765 11223',
    joinedDate: '01 Jun 2026',
    attendancePercent: 98,
    attendedSessions: 24,
    totalSessions: 25,
    nextSessionTime: '6:00 PM – 7:30 PM',
    pitchArea: 'Gym Area',
    notes: 'Great ball possession control & spatial awareness',
    rating: '4.8',
    focusTag: 'INDIVIDUAL MENTORING',
  },
  {
    id: 's-3',
    name: 'Rob Miller',
    avatar: getAvatarSource('avatar_12'),
    registeredClass: 'Under-16 Advanced Drill',
    sport: 'Football',
    sportIcon: 'football',
    role: 'Goalkeeper • Level 8',
    category: 'U16',
    status: 'ACTIVE',
    phone: '+91 98765 99887',
    joinedDate: '15 Jun 2026',
    attendancePercent: 88,
    attendedSessions: 14,
    totalSessions: 16,
    nextSessionTime: '6:00 AM – 7:30 AM',
    pitchArea: 'Pitch A',
    notes: 'Needs reflex response practice on low dives',
    rating: '4.5',
    focusTag: 'GK ACADEMY',
  },
  {
    id: 's-4',
    name: 'Sarah Connor',
    avatar: getAvatarSource('avatar_3'),
    registeredClass: 'Junior Cricket Academy',
    sport: 'Cricket',
    sportIcon: 'cricket',
    role: 'All-Rounder • Level 12',
    category: 'U12',
    status: 'ACTIVE',
    phone: '+91 98765 44332',
    joinedDate: '20 May 2026',
    attendancePercent: 92,
    attendedSessions: 22,
    totalSessions: 24,
    nextSessionTime: '7:00 AM – 8:30 AM',
    pitchArea: 'Net 2',
    notes: 'Outstanding spin bowling accuracy & line length',
    rating: '4.9',
    focusTag: 'CRICKET BATCH',
  },
  {
    id: 's-5',
    name: 'David Wright',
    avatar: getAvatarSource('avatar_4'),
    registeredClass: 'Weekend Tennis Camp',
    sport: 'Tennis',
    sportIcon: 'tennisball',
    role: 'Baseline Player • Level 11',
    category: 'Adults',
    status: 'ACTIVE',
    phone: '+91 98765 77665',
    joinedDate: '04 Jul 2026',
    attendancePercent: 90,
    attendedSessions: 18,
    totalSessions: 20,
    nextSessionTime: '4:00 PM – 5:30 PM',
    pitchArea: 'Court 1',
    notes: 'Topspin forehand precision is improving',
    rating: '4.7',
    focusTag: 'TENNIS CAMP',
  },
  {
    id: 's-6',
    name: 'Kevin Zhang',
    avatar: getAvatarSource('avatar_1'),
    registeredClass: 'Under-16 Advanced Drill',
    sport: 'Football',
    sportIcon: 'football',
    role: 'Defender • Level 9',
    category: 'U16',
    status: 'ACTIVE',
    phone: '+91 98765 88112',
    joinedDate: '10 Jun 2026',
    attendancePercent: 82,
    attendedSessions: 13,
    totalSessions: 16,
    nextSessionTime: '6:00 AM – 7:30 AM',
    pitchArea: 'Pitch A',
    notes: 'Strong aerial tackle timing',
    rating: '4.6',
    focusTag: 'FOOTBALL DRILL',
  },
];



const AGE_CATEGORIES = ['U8', 'U12', 'U16', 'U19', 'Adults', 'All Ages'];

export default function CoachStudentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ classVariant?: string; className?: string; classId?: string }>();
  const { classes, enrollments } = useClassStore();

  const initialClass = (params.classVariant as string) || (params.className as string) || 'All Classes';
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);

  useEffect(() => {
    const target = (params.classVariant as string) || (params.className as string);
    if (target) {
      setSelectedClass(target);
    }
  }, [params.classVariant, params.className]);

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [attendanceLog, setAttendanceLog] = useState<Record<string, boolean>>({});
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState<StudentRecord | null>(null);

  // Edit Student Details State
  const [studentOverrides, setStudentOverrides] = useState<Record<string, Partial<StudentRecord>>>({});
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCategory, setEditCategory] = useState('Adults');
  const [editClass, setEditClass] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSport, setEditSport] = useState('Football');

  const classVariants = useMemo(() => {
    const customNames = (classes || []).map((c: any) => c.className).filter(Boolean);
    const customNamesLower = new Set(customNames.map((n: string) => n.toLowerCase()));
    const mockNames = ACADEMY_STUDENTS.map(s => s.registeredClass).filter(
      n => !customNamesLower.has(n.toLowerCase())
    );
    return Array.from(new Set(['All Classes', ...customNames, ...mockNames]));
  }, [classes]);

  const allStudents = useMemo(() => {
    // 1. Real enrollments made by players/coaches
    const realStudents: StudentRecord[] = (enrollments || []).map((e, idx) => {
      const cls = (classes || []).find(
        (c: any) => c.id === e.classId || c.className?.toLowerCase() === e.className?.toLowerCase()
      );
      const sport = cls?.sportType || 'Sports';
      const avatarIndex = (idx % 12) + 1;
      const rawSession = cls?.sessionTime || '';
      const formattedSession = formatSessionsShort(rawSession) || 'Upcoming Session';

      return {
        id: e.id || `enroll-${idx}`,
        name: e.studentName || `Student ${idx + 1}`,
        avatar: getAvatarSource(`avatar_${avatarIndex}`),
        registeredClass: cls?.className || e.className || 'Coaching Class',
        sport,
        sportIcon: (sport || 'football').toLowerCase(),
        category: cls?.ageGroup || (e.studentAge ? `Age ${e.studentAge}` : 'All Ages'),
        role: e.studentAge ? `Age ${e.studentAge} • Active Student` : `Active Student • ${cls?.ageGroup || 'All Ages'}`,
        status: 'ACTIVE' as const,
        phone: e.contactNumber || '+91 98765 43210',
        joinedDate: formatReadableDate(e.createdAt || cls?.startDate),
        attendancePercent: 100,
        attendedSessions: 1,
        totalSessions: 1,
        nextSessionTime: formattedSession,
        pitchArea: cls?.venue || 'Main Ground',
        notes: e.appliedCode ? `Enrolled with voucher (${e.appliedCode})` : `${cls?.classType || 'Regular Class'} batch enrolled`,
        rating: '5.0',
        focusTag: sport.toUpperCase(),
      };
    });

    // 2. Demo academy students only for template classes that don't collide with custom classes
    const customClassNames = new Set(
      (classes || []).map((c: any) => c.className?.toLowerCase()).filter(Boolean)
    );
    const demoAcademy = ACADEMY_STUDENTS.filter(
      s => !customClassNames.has(s.registeredClass.toLowerCase())
    );

    const rawCombined = [...realStudents, ...demoAcademy];

    // Apply any customized student edits
    return rawCombined.map(s => {
      const override = studentOverrides[s.id];
      return override ? { ...s, ...override } : s;
    });
  }, [classes, enrollments, studentOverrides]);

  // Filter students based on Class Variant, Search Query, and Attendance Status
  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      const matchesClass =
        selectedClass === 'All Classes' ||
        student.registeredClass.toLowerCase() === selectedClass.toLowerCase();

      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.registeredClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.sport.toLowerCase().includes(searchQuery.toLowerCase());

      const isPresent = attendanceLog[student.id] ?? true;
      const matchesAttendance =
        attendanceFilter === 'ALL' ||
        (attendanceFilter === 'PRESENT' && isPresent) ||
        (attendanceFilter === 'ABSENT' && !isPresent);

      return matchesClass && matchesSearch && matchesAttendance;
    });
  }, [allStudents, selectedClass, searchQuery, attendanceFilter, attendanceLog]);

  // Aggregate Metrics (Purely Student & Attendance Focused - No Fees)
  const totalStudentsCount = allStudents.length;
  const presentCount = useMemo(() => allStudents.filter(s => (attendanceLog[s.id] ?? true)).length, [allStudents, attendanceLog]);
  const absentCount = totalStudentsCount - presentCount;
  const activeClassCount = useMemo(() => new Set(allStudents.map(s => s.registeredClass)).size, [allStudents]);

  const avgAttendance = useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const sum = filteredStudents.reduce((acc, s) => acc + s.attendancePercent, 0);
    return Math.round(sum / filteredStudents.length);
  }, [filteredStudents]);

  const toggleAttendanceMark = (id: string, currentName: string) => {
    setAttendanceLog(prev => {
      const current = prev[id] ?? true;
      const next = !current;
      Alert.alert(
        'Attendance Updated',
        `${currentName} marked as ${next ? 'PRESENT ✅' : 'ABSENT ❌'} for today's session.`
      );
      return { ...prev, [id]: next };
    });
  };

  const handleOpenEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditPhone(student.phone ? formatPhoneNumber(student.phone) : '');
    setEditCategory(student.category || 'Adults');
    setEditClass(student.registeredClass);
    setEditNotes(student.notes || '');
    setEditSport(student.sport || 'Football');
  };

  const handleSaveStudentEdit = () => {
    if (!editingStudent) return;
    if (!editName.trim()) {
      Alert.alert('Required', 'Student name cannot be empty.');
      return;
    }

    if (editPhone.trim()) {
      const phoneErr = getPhoneValidationError(editPhone, false);
      if (phoneErr) {
        Alert.alert('Invalid Phone Number', phoneErr);
        return;
      }
    }

    setStudentOverrides(prev => ({
      ...prev,
      [editingStudent.id]: {
        name: editName.trim(),
        phone: editPhone.trim() ? formatPhoneNumber(editPhone) : editingStudent.phone,
        category: editCategory.trim(),
        role: `${editCategory.trim()} • Active Student`,
        registeredClass: editClass.trim() || editingStudent.registeredClass,
        notes: editNotes.trim(),
        sport: editSport.trim() || editingStudent.sport,
      },
    }));

    Alert.alert(
      'Student Details Updated',
      `"${editName.trim()}" profile updated successfully! ✏️`
    );
    setEditingStudent(null);
  };

  return (
    <GradientContainer screenName="coach" style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top App Bar Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/coach')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold', fontSize: 15 }}>
              Academy Student Roster
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontFamily: 'Sora_400Regular' }}>
              {filteredStudents.length} {filteredStudents.length === 1 ? 'Trainee' : 'Trainees'} · Class Variants & Attendance
            </ThemedText>
          </View>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: theme.primaryContainer + '22', borderWidth: 1, borderColor: theme.primary + '44' }]}
            onPress={() => router.push('/create-class')}
          >
            <Ionicons name="add" size={20} color={theme.primary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Student & Attendance Overview Bar (No Financial/Fee Info) */}
          <LinearGradient
            colors={[theme.primary, theme.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.metricsBanner, Shadows.level3]}
          >
            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>STUDENTS</ThemedText>
              <ThemedText style={styles.metricValue}>{filteredStudents.length}</ThemedText>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>CLASSES</ThemedText>
              <ThemedText style={styles.metricValue}>{activeClassCount}</ThemedText>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>PRESENT</ThemedText>
              <ThemedText style={[styles.metricValue, { color: '#4ade80' }]}>
                {presentCount}
              </ThemedText>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>AVG ATT.</ThemedText>
              <ThemedText style={styles.metricValue}>{avgAttendance}%</ThemedText>
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '44' }]}>
            <Ionicons name="search-outline" size={17} color={theme.textSecondary} />
            <TextInput
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              placeholder="Search student by name, class, or sport..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.text }]}
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primary}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {/* Class Variant Selector Chips */}
          <View style={styles.sectionMargin}>
            <View style={styles.sectionLabelRow}>
              <ThemedText style={styles.sectionLabel}>CLASS VARIANTS</ThemedText>
              <ThemedText style={[styles.sectionCount, { color: theme.primary }]}>
                {classVariants.length} classes
              </ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
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
                        {
                          color: isActive ? '#ffffff' : theme.text,
                          fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_500Medium',
                        },
                      ]}
                    >
                      {variant}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Student Status Segmented Filter Tabs */}
          <View style={[styles.statusFilterRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
            {[
              { key: 'ALL', label: 'All Students', count: totalStudentsCount },
              { key: 'PRESENT', label: 'Present Today', count: presentCount },
              { key: 'ABSENT', label: 'Absent', count: absentCount },
            ].map(tab => {
              const isActive = attendanceFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setAttendanceFilter(tab.key as any)}
                  style={[
                    styles.statusTab,
                    isActive && {
                      backgroundColor: theme.surfaceLowest,
                      borderColor: theme.outlineVariant + '33',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                      elevation: 1,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusTabText,
                      {
                        color: isActive ? theme.primary : theme.textSecondary,
                        fontFamily: isActive ? 'Sora_600SemiBold' : 'Sora_500Medium',
                      },
                    ]}
                  >
                    {tab.label} ({tab.count})
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Student Cards List */}
          <View style={{ gap: 12, marginTop: 12 }}>
            {filteredStudents.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }]}>
                <Ionicons name="people-outline" size={32} color={theme.textSecondary} />
                <ThemedText style={{ marginTop: 10, fontSize: 15, fontFamily: 'Sora_600SemiBold', color: theme.text }}>
                  No Students Found
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 12, fontFamily: 'Sora_400Regular' }}>
                  No student records match the selected class variant or filter criteria.
                </ThemedText>
              </View>
            ) : (
              filteredStudents.map(student => {
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
                      {
                        backgroundColor: theme.surfaceLowest,
                        borderColor: theme.outlineVariant + '33',
                      },
                      Shadows.level2,
                    ]}
                  >
                    {/* Header Row: Avatar, Student Name, Registered Class Badge */}
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarContainer}>
                        <Image source={student.avatar} style={styles.avatar} contentFit="cover" />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText style={styles.studentName} numberOfLines={1}>
                          {student.name}
                        </ThemedText>

                        {/* Registered Class Badge */}
                        <View style={[styles.classBadge, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '33' }]}>
                          <Ionicons name="school-outline" size={11} color={theme.primary} style={{ marginRight: 4 }} />
                          <ThemedText style={[styles.classBadgeText, { color: theme.primary }]} numberOfLines={1}>
                            {student.registeredClass}
                          </ThemedText>
                        </View>

                        <ThemedText style={[styles.studentSubtext, { color: theme.textSecondary }]}>
                          {student.sport} · {student.role}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Student Information Box - Tap Attendance for full breakdown */}
                    <View style={[styles.infoRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                      <Pressable
                        style={[styles.infoCol, styles.attendanceTouchable]}
                        onPress={() => setSelectedStudentForAttendance(student)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <ThemedText style={styles.infoLabel}>ATTENDANCE</ThemedText>
                          <Ionicons name="stats-chart" size={9} color={theme.primary} />
                        </View>
                        <ThemedText style={[styles.infoValue, { color: attendanceColor }]}>
                          {student.attendancePercent}% ({student.attendedSessions}/{student.totalSessions})
                        </ThemedText>
                        <ThemedText style={[styles.infoDetailHint, { color: theme.primary }]}>
                          View full details ›
                        </ThemedText>
                      </Pressable>

                      <View style={[styles.vDivider, { backgroundColor: theme.outlineVariant + '33' }]} />

                      <View style={styles.infoCol}>
                        <ThemedText style={styles.infoLabel}>CATEGORY</ThemedText>
                        <ThemedText style={[styles.infoValue, { color: theme.text }]}>
                          {student.category}
                        </ThemedText>
                      </View>

                      <View style={[styles.vDivider, { backgroundColor: theme.outlineVariant + '33' }]} />

                      <View style={styles.infoCol}>
                        <ThemedText style={styles.infoLabel}>JOINED</ThemedText>
                        <ThemedText style={[styles.infoValue, { color: theme.text }]}>
                          {student.joinedDate}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Sessions Occupied & Clean Short Form Next Session */}
                    <Pressable
                      style={styles.progressSection}
                      onPress={() => setSelectedStudentForAttendance(student)}
                    >
                      <View style={styles.progressHeaderRow}>
                        <ThemedText style={[styles.progressLeftText, { color: theme.textSecondary }]}>
                          Sessions: <ThemedText style={{ color: theme.text, fontFamily: 'Sora_600SemiBold' }}>{student.attendedSessions} of {student.totalSessions}</ThemedText>
                        </ThemedText>
                        <ThemedText style={[styles.progressRightText, { color: theme.textSecondary }]} numberOfLines={1}>
                          Next: <ThemedText style={{ color: theme.primary, fontFamily: 'Sora_600SemiBold' }}>{student.nextSessionTime}</ThemedText>
                        </ThemedText>
                      </View>

                      <View style={[styles.progressBarBg, { backgroundColor: theme.outlineVariant + '22' }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${student.attendancePercent}%`, backgroundColor: attendanceColor },
                          ]}
                        />
                      </View>
                    </Pressable>

                    {/* Notes Quote */}
                    {student.notes ? (
                      <View style={styles.notesRow}>
                        <Ionicons name="chatbubble-ellipses-outline" size={12} color={theme.textSecondary} style={{ marginRight: 5 }} />
                        <ThemedText style={[styles.notesText, { color: theme.textSecondary }]} numberOfLines={1}>
                          "{student.notes}"
                        </ThemedText>
                      </View>
                    ) : null}

                    {/* Action Buttons Row (Call Student & Edit Student Details) */}
                    <View style={[styles.actionsRow, { borderTopColor: theme.outlineVariant + '22' }]}>
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '28' }]}
                        onPress={() => Linking.openURL(`tel:${student.phone}`)}
                      >
                        <Ionicons name="call-outline" size={14} color={theme.primary} />
                        <ThemedText style={[styles.actionBtnText, { color: theme.primary }]}>Call Student</ThemedText>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor: theme.primaryContainer + '20',
                            borderColor: theme.primary + '44',
                          },
                        ]}
                        onPress={() => handleOpenEdit(student)}
                      >
                        <EditIcon size={14} />
                        <ThemedText
                          style={[
                            styles.actionBtnText,
                            { color: theme.primary },
                          ]}
                        >
                          Edit Details
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Full Attendance Details Modal */}
        {selectedStudentForAttendance && (
          <Modal
            visible={!!selectedStudentForAttendance}
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedStudentForAttendance(null)}
          >
            <View style={styles.modalOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setSelectedStudentForAttendance(null)}
              />

              <View style={[styles.modalCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level3]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                      Full Attendance Details
                    </ThemedText>
                    <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                      Comprehensive Session & Trainee Report
                    </ThemedText>
                  </View>
                  <Pressable
                    style={[styles.closeBtn, { backgroundColor: theme.surfaceLow }]}
                    onPress={() => setSelectedStudentForAttendance(null)}
                  >
                    <Ionicons name="close" size={18} color={theme.text} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {/* Trainee Card Profile */}
                  <View style={[styles.traineeBanner, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                    <Image source={selectedStudentForAttendance.avatar} style={styles.modalAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={[styles.modalTraineeName, { color: theme.text }]}>
                        {selectedStudentForAttendance.name}
                      </ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <View style={[styles.modalBadge, { backgroundColor: theme.primary + '18' }]}>
                          <ThemedText style={[styles.modalBadgeText, { color: theme.primary }]}>
                            {selectedStudentForAttendance.registeredClass}
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 11, color: theme.textSecondary, fontFamily: 'Sora_400Regular' }}>
                          {selectedStudentForAttendance.sport}
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 3, fontFamily: 'Sora_400Regular' }}>
                        {selectedStudentForAttendance.role} · Joined {selectedStudentForAttendance.joinedDate}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Attendance Performance Metric Hero Card */}
                  <LinearGradient
                    colors={[theme.primary, theme.primaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.attendanceHero}
                  >
                    <View style={styles.heroTopRow}>
                      <View>
                        <ThemedText style={styles.heroLabel}>OVERALL ATTENDANCE RATE</ThemedText>
                        <ThemedText style={styles.heroPercent}>
                          {selectedStudentForAttendance.attendancePercent}%
                        </ThemedText>
                      </View>
                      <View style={styles.heroTierBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#4ade80" />
                        <ThemedText style={styles.heroTierText}>
                          {selectedStudentForAttendance.attendancePercent >= 90
                            ? 'Outstanding'
                            : selectedStudentForAttendance.attendancePercent >= 80
                            ? 'Good Standing'
                            : 'Needs Attention'}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.heroDivider} />

                    <View style={styles.heroStatsGrid}>
                      <View style={styles.heroStatCol}>
                        <ThemedText style={styles.heroStatNum}>{selectedStudentForAttendance.attendedSessions}</ThemedText>
                        <ThemedText style={styles.heroStatSub}>Attended</ThemedText>
                      </View>
                      <View style={styles.heroStatCol}>
                        <ThemedText style={styles.heroStatNum}>
                          {Math.max(0, selectedStudentForAttendance.totalSessions - selectedStudentForAttendance.attendedSessions)}
                        </ThemedText>
                        <ThemedText style={styles.heroStatSub}>Missed</ThemedText>
                      </View>
                      <View style={styles.heroStatCol}>
                        <ThemedText style={styles.heroStatNum}>{selectedStudentForAttendance.totalSessions}</ThemedText>
                        <ThemedText style={styles.heroStatSub}>Total Sessions</ThemedText>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Today's Live Attendance Quick Toggle */}
                  <View style={[styles.todayCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.todayTitle, { color: theme.text }]}>Today's Session Status</ThemedText>
                      <ThemedText style={[styles.todaySub, { color: theme.textSecondary }]}>
                        {selectedStudentForAttendance.nextSessionTime} · {selectedStudentForAttendance.pitchArea}
                      </ThemedText>
                    </View>
                    <Pressable
                      style={[
                        styles.todayToggleBtn,
                        {
                          backgroundColor: (attendanceLog[selectedStudentForAttendance.id] ?? true)
                            ? '#16a34a22'
                            : '#dc262622',
                          borderColor: (attendanceLog[selectedStudentForAttendance.id] ?? true)
                            ? '#16a34a66'
                            : '#dc262666',
                        },
                      ]}
                      onPress={() => toggleAttendanceMark(selectedStudentForAttendance.id, selectedStudentForAttendance.name)}
                    >
                      <Ionicons
                        name={(attendanceLog[selectedStudentForAttendance.id] ?? true) ? 'checkmark-circle' : 'close-circle'}
                        size={15}
                        color={(attendanceLog[selectedStudentForAttendance.id] ?? true) ? '#16a34a' : '#dc2626'}
                      />
                      <ThemedText
                        style={[
                          styles.todayToggleText,
                          { color: (attendanceLog[selectedStudentForAttendance.id] ?? true) ? '#16a34a' : '#dc2626' },
                        ]}
                      >
                        {(attendanceLog[selectedStudentForAttendance.id] ?? true) ? 'PRESENT' : 'ABSENT'}
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Detailed Session History List */}
                  <View style={{ marginTop: 14 }}>
                    <ThemedText style={[styles.sectionHeading, { color: theme.text }]}>
                      Session Attendance Breakdown
                    </ThemedText>

                    <View style={{ gap: 8, marginTop: 8 }}>
                      {[
                        {
                          sessionIndex: 1,
                          date: selectedStudentForAttendance.joinedDate,
                          time: selectedStudentForAttendance.nextSessionTime,
                          isPresent: (attendanceLog[selectedStudentForAttendance.id] ?? true),
                          type: 'Regular Class Slot',
                        },
                        ...(selectedStudentForAttendance.totalSessions > 1
                          ? Array.from({ length: Math.min(selectedStudentForAttendance.totalSessions - 1, 4) }, (_, idx) => ({
                              sessionIndex: idx + 2,
                              date: `${10 - (idx + 1) * 2} Sep 2026`,
                              time: selectedStudentForAttendance.nextSessionTime,
                              isPresent: idx < (selectedStudentForAttendance.attendedSessions - 1),
                              type: 'Completed Session',
                            }))
                          : []),
                      ].map(item => (
                        <View
                          key={item.sessionIndex}
                          style={[styles.sessionHistoryRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}
                        >
                          <View style={[styles.sessionNumBadge, { backgroundColor: theme.primary + '14' }]}>
                            <ThemedText style={[styles.sessionNumText, { color: theme.primary }]}>
                              #{item.sessionIndex}
                            </ThemedText>
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <ThemedText style={[styles.sessionDateText, { color: theme.text }]}>
                              {item.date}
                            </ThemedText>
                            <ThemedText style={[styles.sessionTimeSub, { color: theme.textSecondary }]}>
                              {item.time} · {item.type}
                            </ThemedText>
                          </View>
                          <View
                            style={[
                              styles.sessionStatusPill,
                              {
                                backgroundColor: item.isPresent ? '#16a34a18' : '#dc262618',
                                borderColor: item.isPresent ? '#16a34a44' : '#dc262644',
                              },
                            ]}
                          >
                            <Ionicons
                              name={item.isPresent ? 'checkmark' : 'close'}
                              size={12}
                              color={item.isPresent ? '#16a34a' : '#dc2626'}
                            />
                            <ThemedText
                              style={[
                                styles.sessionStatusText,
                                { color: item.isPresent ? '#16a34a' : '#dc2626' },
                              ]}
                            >
                              {item.isPresent ? 'Present' : 'Absent'}
                            </ThemedText>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Coach Observation Notes */}
                  {selectedStudentForAttendance.notes ? (
                    <View style={[styles.modalNotesCard, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <Ionicons name="clipboard-outline" size={13} color={theme.primary} />
                        <ThemedText style={[styles.modalNotesHeading, { color: theme.primary }]}>
                          Coach Observations & Notes
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.modalNotesBody, { color: theme.text }]}>
                        "{selectedStudentForAttendance.notes}"
                      </ThemedText>
                    </View>
                  ) : null}

                  {/* Modal Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <Pressable
                      style={[styles.modalActionBtn, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '33' }]}
                      onPress={() => Linking.openURL(`tel:${selectedStudentForAttendance.phone}`)}
                    >
                      <Ionicons name="call-outline" size={15} color={theme.primary} />
                      <ThemedText style={[styles.modalActionBtnText, { color: theme.primary }]}>
                        Call Student
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      style={[styles.modalActionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={() => setSelectedStudentForAttendance(null)}
                    >
                      <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                      <ThemedText style={[styles.modalActionBtnText, { color: '#ffffff' }]}>
                        Done
                      </ThemedText>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
        {/* Edit Student Details Modal */}
        {editingStudent && (
          <Modal
            visible={!!editingStudent}
            transparent
            animationType="slide"
            onRequestClose={() => setEditingStudent(null)}
          >
            <View style={styles.modalOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setEditingStudent(null)}
              />

              <View style={[styles.modalCard, { backgroundColor: theme.surfaceLowest, borderColor: theme.outlineVariant + '33' }, Shadows.level3]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                      Edit Student Details
                    </ThemedText>
                    <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                      Update student profile, category & assigned class
                    </ThemedText>
                  </View>
                  <Pressable
                    style={[styles.closeBtn, { backgroundColor: theme.surfaceLow }]}
                    onPress={() => setEditingStudent(null)}
                  >
                    <Ionicons name="close" size={18} color={theme.text} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, gap: 12 }}>
                  {/* Trainee Banner */}
                  <View style={[styles.traineeBanner, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '22' }]}>
                    <Image source={editingStudent.avatar} style={styles.modalAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={[styles.modalTraineeName, { color: theme.text }]}>
                        {editingStudent.name}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2, fontFamily: 'Sora_400Regular' }}>
                        ID: {editingStudent.id} · Joined {editingStudent.joinedDate}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Student Name */}
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
                      FULL NAME <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
                    </ThemedText>
                    <View style={[styles.formInputRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                      <Ionicons name="person-outline" size={16} color={theme.primary} />
                      <TextInput
                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Enter full name"
                        placeholderTextColor={theme.textSecondary}
                        style={[styles.formTextInput, { color: theme.text }]}
                      />
                    </View>
                  </View>

                  {/* Contact Phone */}
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
                      CONTACT PHONE
                    </ThemedText>
                    <View style={[styles.formInputRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}>
                      <Ionicons name="call-outline" size={16} color={theme.primary} />
                      <TextInput
                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                        value={editPhone}
                        onChangeText={(t) => setEditPhone(formatPhoneNumber(t))}
                        placeholder="98765 43210"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="phone-pad"
                        maxLength={11}
                        style={[styles.formTextInput, { color: theme.text }]}
                      />
                    </View>
                  </View>

                  {/* Category / Age Group Chips */}
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
                      CATEGORY / AGE GROUP
                    </ThemedText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {AGE_CATEGORIES.map(cat => {
                        const isCatActive = editCategory.toLowerCase() === cat.toLowerCase();
                        return (
                          <Pressable
                            key={cat}
                            onPress={() => setEditCategory(cat)}
                            style={[
                              styles.catChip,
                              {
                                backgroundColor: isCatActive ? theme.primary : theme.surfaceLow,
                                borderColor: isCatActive ? theme.primary : theme.outlineVariant + '33',
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.catChipText,
                                {
                                  color: isCatActive ? '#ffffff' : theme.text,
                                  fontFamily: isCatActive ? 'Sora_600SemiBold' : 'Sora_500Medium',
                                },
                              ]}
                            >
                              {cat}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Class Assignment */}
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
                      ASSIGNED CLASS BATCH
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                      {classVariants.filter(c => c !== 'All Classes').map(clsName => {
                        const isClsActive = editClass.toLowerCase() === clsName.toLowerCase();
                        return (
                          <Pressable
                            key={clsName}
                            onPress={() => setEditClass(clsName)}
                            style={[
                              styles.catChip,
                              {
                                backgroundColor: isClsActive ? theme.primary : theme.surfaceLow,
                                borderColor: isClsActive ? theme.primary : theme.outlineVariant + '33',
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.catChipText,
                                {
                                  color: isClsActive ? '#ffffff' : theme.text,
                                  fontFamily: isClsActive ? 'Sora_600SemiBold' : 'Sora_500Medium',
                                },
                              ]}
                            >
                              {clsName}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Coach Notes */}
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
                      COACH OBSERVATION & NOTES
                    </ThemedText>
                    <View style={[styles.formInputRow, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33', height: 70, alignItems: 'flex-start', paddingTop: 8 }]}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.primary} style={{ marginTop: 2 }} />
                      <TextInput
                        maxFontSizeMultiplier={MAX_FONT_SCALE}
                        value={editNotes}
                        onChangeText={setEditNotes}
                        placeholder="e.g. Excellent sprint stamina and explosive speed"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        style={[styles.formTextInput, { color: theme.text, height: 54, textAlignVertical: 'top' }]}
                      />
                    </View>
                  </View>

                  {/* Modal Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <Pressable
                      style={[styles.modalActionBtn, { backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '33' }]}
                      onPress={() => setEditingStudent(null)}
                    >
                      <ThemedText style={[styles.modalActionBtnText, { color: theme.text }]}>
                        Cancel
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      style={[styles.modalActionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={handleSaveStudentEdit}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                      <ThemedText style={[styles.modalActionBtnText, { color: '#ffffff' }]}>
                        Save Changes
                      </ThemedText>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
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
    width: 34,
    height: 34,
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
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 14.5,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
    fontSize: 12.5,
    fontFamily: 'Sora_400Regular',
    outlineStyle: 'none',
    outlineWidth: 0,
    borderWidth: 0,
    includeFontPadding: false,
  } as any,
  sectionMargin: {
    marginBottom: Spacing.sm,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.5,
    color: '#64748B',
  },
  sectionCount: {
    fontSize: 10,
    fontFamily: 'Sora_500Medium',
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  classChipText: {
    fontSize: 11,
  },
  statusFilterRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 3,
    borderWidth: 1,
    gap: 4,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.md - 2,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTabText: {
    fontSize: 11,
  },
  studentCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  studentName: {
    fontSize: 14.5,
    fontFamily: 'Sora_600SemiBold',
    lineHeight: 19,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginTop: 3,
  },
  classBadgeText: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
  },
  studentSubtext: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    marginTop: 3,
  },
  infoRow: {
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 8.5,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 2,
  },
  vDivider: {
    width: 1,
    height: 20,
  },
  progressSection: {
    marginTop: 10,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLeftText: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
  },
  progressRightText: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    flexShrink: 1,
    marginLeft: 8,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  notesText: {
    fontSize: 10.5,
    fontStyle: 'italic',
    fontFamily: 'Sora_400Regular',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontFamily: 'Sora_600SemiBold',
  },
  emptyCard: {
    padding: 30,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  attendanceTouchable: {
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  infoDetailHint: {
    fontSize: 8.5,
    fontFamily: 'Sora_500Medium',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 14.5,
    fontFamily: 'Sora_600SemiBold',
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: 'Sora_400Regular',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  traineeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalTraineeName: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
  },
  modalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  modalBadgeText: {
    fontSize: 9.5,
    fontFamily: 'Sora_600SemiBold',
  },
  attendanceHero: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 9,
    fontFamily: 'Sora_600SemiBold',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
  },
  heroPercent: {
    fontSize: 20,
    fontFamily: 'Sora_600SemiBold',
    color: '#ffffff',
    marginTop: 2,
  },
  heroTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  heroTierText: {
    fontSize: 10.5,
    fontFamily: 'Sora_600SemiBold',
    color: '#ffffff',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 10,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  heroStatCol: {
    alignItems: 'center',
  },
  heroStatNum: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
    color: '#ffffff',
  },
  heroStatSub: {
    fontSize: 9.5,
    fontFamily: 'Sora_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  todayTitle: {
    fontSize: 12.5,
    fontFamily: 'Sora_600SemiBold',
  },
  todaySub: {
    fontSize: 10.5,
    fontFamily: 'Sora_400Regular',
    marginTop: 2,
  },
  todayToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 4,
    marginLeft: 8,
  },
  todayToggleText: {
    fontSize: 10.5,
    fontFamily: 'Sora_600SemiBold',
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 4,
  },
  sessionHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sessionNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionNumText: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
  },
  sessionDateText: {
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
  },
  sessionTimeSub: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    marginTop: 1,
  },
  sessionStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 3,
  },
  sessionStatusText: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
  },
  modalNotesCard: {
    padding: 11,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: 12,
  },
  modalNotesHeading: {
    fontSize: 10.5,
    fontFamily: 'Sora_600SemiBold',
  },
  modalNotesBody: {
    fontSize: 11,
    fontStyle: 'italic',
    fontFamily: 'Sora_400Regular',
    lineHeight: 16,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  modalActionBtnText: {
    fontSize: 12,
    fontFamily: 'Sora_600SemiBold',
  },
  formGroup: {
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  formInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  formTextInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Sora_400Regular',
    outlineStyle: 'none',
    outlineWidth: 0,
    borderWidth: 0,
    padding: 0,
  } as any,
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11,
  },
});
