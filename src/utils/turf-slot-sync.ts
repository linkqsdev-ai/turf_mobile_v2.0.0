/**
 * turf-slot-sync.ts
 * Centralized utility to synchronize turf slot availability, booking state,
 * and occupancy statistics across player and owner screens.
 */

import { Booking } from '@/store/booking-store';
import { formatDateISO, formatDateFull, isTimeSlotPassed, parseTimeString } from './date-utils';

export interface SynchronizedSlot {
  time: string;           // "06:00 AM", "07:00 AM", etc.
  icon: 'sunny-outline' | 'sunny' | 'moon-outline' | 'moon';
  status: 'available' | 'booked' | 'blocked' | 'maintenance' | 'passed';
  isAvailable: boolean;
  isBooked: boolean;
  isConfigBlocked: boolean;
  isPassed: boolean;
  bookingRef?: string;
  bookedBy?: string;
}

export interface TurfSlotSummary {
  totalConfigured: number;
  totalAvailable: number;
  totalBooked: number;
  totalPassed: number;
  occupancyPct: number;
  slotsText: string;
  slots: SynchronizedSlot[];
}

export const ALL_STANDARD_TIME_SLOTS: Array<{ time: string; icon: 'sunny-outline' | 'sunny' | 'moon-outline' | 'moon' }> = [
  { time: '06:00 AM', icon: 'sunny-outline' },
  { time: '07:00 AM', icon: 'sunny-outline' },
  { time: '08:00 AM', icon: 'sunny-outline' },
  { time: '09:00 AM', icon: 'sunny-outline' },
  { time: '10:00 AM', icon: 'sunny-outline' },
  { time: '11:00 AM', icon: 'sunny-outline' },
  { time: '12:00 PM', icon: 'sunny' },
  { time: '01:00 PM', icon: 'sunny' },
  { time: '02:00 PM', icon: 'sunny' },
  { time: '03:00 PM', icon: 'sunny' },
  { time: '04:00 PM', icon: 'sunny' },
  { time: '05:00 PM', icon: 'sunny' },
  { time: '06:00 PM', icon: 'moon-outline' },
  { time: '07:00 PM', icon: 'moon-outline' },
  { time: '08:00 PM', icon: 'moon' },
  { time: '09:00 PM', icon: 'moon' },
  { time: '10:00 PM', icon: 'moon' },
  { time: '11:00 PM', icon: 'moon' },
];

/**
 * Standardizes time strings like '6 AM', '06:00 AM', '6:00 AM' to standard '06:00 AM'
 */
export function normalizeSlotTime(tStr: string): string {
  if (!tStr) return '';
  const parsed = parseTimeString(tStr);
  if (!parsed) return tStr.trim();
  const period = parsed.hours >= 12 ? 'PM' : 'AM';
  const hour12 = parsed.hours % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')} ${period}`;
}

/**
 * Computes synchronized slot status and occupancy metrics for any turf and date.
 */
export function computeTurfSlotMetrics(
  turf: any,
  selectedDate: Date = new Date(),
  bookings: Booking[] = []
): TurfSlotSummary {
  const targetISO = formatDateISO(selectedDate);
  const targetDayLabel = formatDateFull(selectedDate);
  const dayShortName = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });

  // 1. Map configured status from turf's slot settings (if customized by owner)
  const configuredMap: Record<string, string> = {};
  let hasExplicitSlots = false;

  if (turf && Array.isArray(turf.slots) && turf.slots.length > 0) {
    turf.slots.forEach((s: any) => {
      if (s && s.day === dayShortName) {
        hasExplicitSlots = true;
        const norm = normalizeSlotTime(s.time);
        configuredMap[norm] = s.status;
      }
    });
  }

  // 2. Find confirmed bookings for this turf on the target date
  const venueBookings = (bookings || []).filter(b => {
    const isVenueMatch =
      (turf?.id && b.venueId === turf.id) ||
      (turf?.name && b.venueName && b.venueName.toLowerCase() === turf.name.toLowerCase());
    const isDateMatch = (b.date === targetISO) || (b.dayLabel === targetDayLabel) || (b.date && b.date.startsWith(targetISO));
    const isConfirmed = b.status !== 'cancelled';
    return isVenueMatch && isDateMatch && isConfirmed;
  });

  const bookedSlotsSet = new Map<string, { bookingRef: string; bookedBy?: string }>();
  venueBookings.forEach(b => {
    if (Array.isArray(b.slots)) {
      b.slots.forEach(s => {
        const norm = normalizeSlotTime(s);
        bookedSlotsSet.set(norm, { bookingRef: b.bookingRef, bookedBy: (b as any).userName || (b as any).bookedBy });
      });
    }
  });

  // 3. Compute status for all standard slots
  const slots: SynchronizedSlot[] = ALL_STANDARD_TIME_SLOTS.map(slotDef => {
    const timeNorm = normalizeSlotTime(slotDef.time);
    const configStatus = configuredMap[timeNorm];
    
    const isConfigBlocked = configStatus === 'blocked' || configStatus === 'maintenance';

    const bookingInfo = bookedSlotsSet.get(timeNorm);
    const isBooked = !!bookingInfo;
    const isPassed = isTimeSlotPassed(timeNorm, selectedDate);

    let status: SynchronizedSlot['status'] = 'available';
    if (isBooked) {
      status = 'booked';
    } else if (configStatus === 'maintenance') {
      status = 'maintenance';
    } else if (isConfigBlocked) {
      status = 'blocked';
    } else if (isPassed) {
      status = 'passed';
    }

    const isAvailable = !isBooked && !isConfigBlocked && !isPassed;

    return {
      time: slotDef.time,
      icon: slotDef.icon,
      status,
      isAvailable,
      isBooked,
      isConfigBlocked,
      isPassed,
      bookingRef: bookingInfo?.bookingRef,
      bookedBy: bookingInfo?.bookedBy,
    };
  });

  // Filter slots to only operational slots for this turf
  const operationalSlots = hasExplicitSlots
    ? slots.filter(s => configuredMap[normalizeSlotTime(s.time)] !== 'blocked' && configuredMap[normalizeSlotTime(s.time)] !== 'maintenance' && configuredMap[normalizeSlotTime(s.time)] !== undefined)
    : slots;

  const totalConfigured = operationalSlots.length > 0 ? operationalSlots.length : 12;
  const totalBooked = operationalSlots.filter(s => s.isBooked).length;
  const totalPassed = operationalSlots.filter(s => s.isPassed && !s.isBooked).length;
  const totalAvailable = operationalSlots.filter(s => s.isAvailable).length;
  
  const occupancyPct = totalConfigured > 0 ? Math.round(((totalConfigured - totalAvailable) / totalConfigured) * 100) : 0;

  const slotsText = `${totalBooked}/${totalConfigured} slots booked today (${totalAvailable} available)`;

  return {
    totalConfigured,
    totalAvailable,
    totalBooked,
    totalPassed,
    occupancyPct,
    slotsText,
    slots,
  };
}
