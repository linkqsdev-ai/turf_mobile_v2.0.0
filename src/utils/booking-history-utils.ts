import { Booking } from '@/store/booking-store';
import { ClassEnrollment } from '@/store/enrollment-store';
import { TournamentRegistration, PublishedTournament } from '@/store/tournament-store';
import { formatSlotsRange } from '@/utils/date-utils';
import { classStatus, formatClassDateRange, formatSessionsShort } from '@/utils/class-schedule';

export type HistoryTypeFilter = 'all' | 'turf' | 'class' | 'tournament';
export type HistoryStatusFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

export interface UnifiedHistoryItem {
  id: string;
  type: 'turf' | 'class' | 'tournament';
  typeLabel: string;
  typeIcon: string;
  title: string;
  subtitle: string;
  location: string;
  dateISO: string;
  dateLabel: string;
  timeLabel: string;
  bookingRef: string;
  image: string;
  totalAmount: number;
  advancePaid: number;
  remaining: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending';
  statusLabel: string;
  createdAt: string;
  sport?: string;
  rawTurf?: Booking;
  rawClass?: {
    enrollment: ClassEnrollment;
    cls?: any;
  };
  rawTournament?: {
    registration: TournamentRegistration;
    tournament?: PublishedTournament;
  };
}

const DEFAULT_TURF_IMG =
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80';
const DEFAULT_CLASS_IMG =
  'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80';
const DEFAULT_TOURNAMENT_IMG =
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80';

/**
 * Returns allowed booking types according to the user's role:
 * - Player: 3 categories (turf, class, tournament)
 * - Organizer: 2 categories (turf, class) - excludes tournament
 * - Coach: 1 category (turf)
 * - Turf Owner: 1 category (tournament)
 */
export function getRoleAllowedHistoryTypes(role?: string): HistoryTypeFilter[] {
  const norm = (role || 'Player').trim().toLowerCase();

  if (norm === 'coach') {
    // Coach can track both Turf bookings and Tournament team entries
    return ['turf', 'tournament'];
  }
  if (norm === 'owner') {
    return ['tournament'];
  }
  if (norm === 'organizer') {
    return ['turf', 'class'];
  }
  // Player, Admin, Super Admin, etc.
  return ['turf', 'class', 'tournament'];
}

export function buildUnifiedHistoryList({
  bookings = [],
  enrollments = [],
  classes = [],
  registrations = [],
  tournaments = [],
  todayISO = new Date().toISOString().split('T')[0],
}: {
  bookings?: Booking[];
  enrollments?: ClassEnrollment[];
  classes?: any[];
  registrations?: TournamentRegistration[];
  tournaments?: PublishedTournament[];
  todayISO?: string;
}): UnifiedHistoryItem[] {
  const items: UnifiedHistoryItem[] = [];

  // 1. Process Turf Bookings
  for (const b of bookings) {
    const isPast = b.date < todayISO;
    const isCancelled = b.status === 'cancelled';
    const isCompleted = b.status === 'completed' || (!isCancelled && isPast);

    const status: UnifiedHistoryItem['status'] = isCancelled
      ? 'cancelled'
      : isCompleted
      ? 'completed'
      : 'confirmed';

    const statusLabel = isCancelled
      ? 'Cancelled'
      : isCompleted
      ? 'Completed'
      : 'Confirmed';

    items.push({
      id: b.id,
      type: 'turf',
      typeLabel: 'Turf Booking',
      typeIcon: 'football-outline',
      title: b.venueName,
      subtitle: b.venueLocation || 'Trichy, Tamil Nadu',
      location: b.venueLocation || 'Trichy, Tamil Nadu',
      dateISO: b.date,
      dateLabel: b.dayLabel || b.date,
      timeLabel: `${formatSlotsRange(b.slots)} (${b.slots.length} ${b.slots.length === 1 ? 'hr' : 'hrs'})`,
      bookingRef: b.bookingRef,
      image: b.venueImage && b.venueImage.startsWith('http') ? b.venueImage : DEFAULT_TURF_IMG,
      totalAmount: b.totalAmount || 0,
      advancePaid: b.advancePaid || 0,
      remaining: b.remaining || 0,
      status,
      statusLabel,
      createdAt: b.createdAt || b.date,
      rawTurf: b,
    });
  }

  // 2. Process Class Enrollments
  for (const e of enrollments) {
    const cls = classes.find(
      (c) => c.id === e.classId || (c.title && c.title.toLowerCase() === e.className?.toLowerCase())
    );

    const dateISO = cls?.startDate || e.createdAt?.split('T')[0] || todayISO;
    const isPast = cls?.endDate ? cls.endDate < todayISO : false;
    const cStatus = cls ? classStatus(cls.startDate, cls.endDate) : 'unknown';

    const status: UnifiedHistoryItem['status'] =
      cStatus === 'completed' || isPast ? 'completed' : 'confirmed';

    const statusLabel =
      status === 'completed'
        ? 'Completed'
        : cStatus === 'ongoing'
        ? 'Ongoing'
        : 'Enrolled';

    const dateLabel = cls
      ? formatClassDateRange(cls.startDate, cls.endDate)
      : e.createdAt
      ? new Date(e.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Scheduled Class';

    const timeLabel = cls?.time || (cls?.schedule ? formatSessionsShort(cls.schedule) : 'Daily Batches');

    const cleanRef = e.id.replace('enroll-', 'ENR-').slice(0, 12).toUpperCase();

    const classImg = cls?.image || cls?.coverImage;
    const image = classImg && typeof classImg === 'string' && classImg.startsWith('http')
      ? classImg
      : DEFAULT_CLASS_IMG;

    items.push({
      id: e.id,
      type: 'class',
      typeLabel: 'Class Enrollment',
      typeIcon: 'school-outline',
      title: e.className || cls?.title || 'Coaching Academy',
      subtitle: cls?.coachName ? `Coach ${cls.coachName} • ${cls.venue || cls.location || 'Arena'}` : `Student: ${e.studentName || 'Player'}`,
      location: cls?.location || cls?.venue || 'Trichy',
      dateISO,
      dateLabel,
      timeLabel,
      bookingRef: cleanRef,
      image,
      totalAmount: e.amountPaid || cls?.price || 0,
      advancePaid: e.amountPaid || cls?.price || 0,
      remaining: 0,
      status,
      statusLabel,
      createdAt: e.createdAt || dateISO,
      sport: cls?.sport || 'Cricket',
      rawClass: {
        enrollment: e,
        cls,
      },
    });
  }

  // 3. Process Tournament Registrations
  for (const r of registrations) {
    const tourney = tournaments.find(
      (t) => t.id === r.tournamentId || (t.name && t.name.toLowerCase() === r.tournamentName?.toLowerCase())
    );

    const dateISO = tourney?.startDate || r.registeredAt?.split('T')[0] || todayISO;
    const isPast = tourney?.endDate ? tourney.endDate < todayISO : false;
    const isRejected = r.status === 'rejected';

    const status: UnifiedHistoryItem['status'] = isRejected
      ? 'cancelled'
      : isPast || tourney?.status === 'Completed'
      ? 'completed'
      : r.status === 'pending'
      ? 'pending'
      : 'confirmed';

    const statusLabel = isRejected
      ? 'Rejected'
      : status === 'completed'
      ? 'Completed'
      : r.status === 'pending'
      ? 'Pending Review'
      : 'Registered';

    const dateLabel = tourney
      ? `${tourney.startDate} - ${tourney.endDate}`
      : r.registeredAt
      ? new Date(r.registeredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Tournament Match';

    const squadSize = r.squad?.length || 0;
    const timeLabel = `${r.sport || tourney?.sport || 'Tournament'} • ${squadSize > 0 ? `${squadSize} Players` : 'Team Slot'}`;

    const cleanRef = r.id.replace('reg-', 'TRN-').slice(0, 12).toUpperCase();

    const bannerUri =
      tourney?.banner?.uri ||
      (typeof tourney?.banner === 'string' && tourney.banner.startsWith('http') ? tourney.banner : null);
    const image = bannerUri || DEFAULT_TOURNAMENT_IMG;

    const fee = r.entryFee || tourney?.entryFee || 0;
    const isPaid = r.paymentStatus === 'paid';
    const advancePaid = isPaid ? fee : 0;
    const remaining = isPaid ? 0 : fee;

    items.push({
      id: r.id,
      type: 'tournament',
      typeLabel: 'Tournament Entry',
      typeIcon: 'trophy-outline',
      title: r.tournamentName || tourney?.name || 'Championship Cup',
      subtitle: `Team: ${r.teamName}${tourney?.location ? ` • ${tourney.location}` : ''}`,
      location: tourney?.location || tourney?.venueAddress || 'Championship Arena',
      dateISO,
      dateLabel,
      timeLabel,
      bookingRef: cleanRef,
      image,
      totalAmount: fee,
      advancePaid,
      remaining,
      status,
      statusLabel,
      createdAt: r.registeredAt || dateISO,
      sport: r.sport || tourney?.sport || 'Cricket',
      rawTournament: {
        registration: r,
        tournament: tourney,
      },
    });
  }

  // Sort unified history by newest creation / registration date first
  return items.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });
}

export function filterUnifiedHistory({
  items,
  typeFilter = 'all',
  statusFilter = 'all',
  searchQuery = '',
  allowedTypes,
}: {
  items: UnifiedHistoryItem[];
  typeFilter?: HistoryTypeFilter;
  statusFilter?: HistoryStatusFilter;
  searchQuery?: string;
  allowedTypes?: HistoryTypeFilter[];
}): UnifiedHistoryItem[] {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    // Role allowed type restriction
    if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(item.type)) {
      return false;
    }

    // Type Filter
    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    // Status Filter
    if (statusFilter === 'upcoming') {
      if (item.status !== 'confirmed' && item.status !== 'pending') return false;
    } else if (statusFilter === 'completed') {
      if (item.status !== 'completed') return false;
    } else if (statusFilter === 'cancelled') {
      if (item.status !== 'cancelled') return false;
    }

    // Search Query
    if (query) {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchSubtitle = item.subtitle.toLowerCase().includes(query);
      const matchRef = item.bookingRef.toLowerCase().includes(query);
      const matchLoc = item.location.toLowerCase().includes(query);
      const matchStudent = item.rawClass?.enrollment.studentName?.toLowerCase().includes(query);
      const matchTeam = item.rawTournament?.registration.teamName?.toLowerCase().includes(query);

      if (!matchTitle && !matchSubtitle && !matchRef && !matchLoc && !matchStudent && !matchTeam) {
        return false;
      }
    }

    return true;
  });
}

export function computeHistoryMetrics(items: UnifiedHistoryItem[]) {
  const totalCount = items.length;
  const turfCount = items.filter((i) => i.type === 'turf').length;
  const classCount = items.filter((i) => i.type === 'class').length;
  const tournamentCount = items.filter((i) => i.type === 'tournament').length;

  const upcomingCount = items.filter((i) => i.status === 'confirmed' || i.status === 'pending').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const cancelledCount = items.filter((i) => i.status === 'cancelled').length;

  const totalSpent = items
    .filter((i) => i.status !== 'cancelled')
    .reduce((sum, i) => sum + (i.advancePaid || i.totalAmount || 0), 0);

  return {
    totalCount,
    turfCount,
    classCount,
    tournamentCount,
    upcomingCount,
    completedCount,
    cancelledCount,
    totalSpent,
  };
}
