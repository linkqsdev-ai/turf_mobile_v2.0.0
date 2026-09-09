/**
 * date-utils.ts
 * Real date utilities for calendar generation, formatting, and slot management.
 */

export interface CalendarDay {
  dayNumber: number;
  date: Date | null;
  isDisabled: boolean;
  isPast: boolean;
  isToday: boolean;
  isPadding: boolean;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DAY_LABELS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

/**
 * Returns a grid of calendar days for a given month/year,
 * padded so the first day aligns to Monday.
 */
export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday=0 ... Sunday=6
  let startPadding = firstDay.getDay() - 1;
  if (startPadding < 0) startPadding = 6; // Sunday maps to index 6

  const grid: CalendarDay[] = [];

  // Add padding days
  for (let i = 0; i < startPadding; i++) {
    grid.push({ dayNumber: 0, date: null, isDisabled: true, isPast: false, isToday: false, isPadding: true });
  }

  // Add real days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    grid.push({
      dayNumber: day,
      date,
      isDisabled: isPast,
      isPast,
      isToday,
      isPadding: false,
    });
  }

  return grid;
}

/**
 * Format a Date to a human-readable string: "Mon, 24 Jun 2026"
 */
export function formatDateFull(date: Date): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${dayNames[date.getDay()]}, ${date.getDate()} ${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format a Date to "24 Jun 2026"
 */
export function formatDateShort(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format a Date to ISO date string: "2026-06-24"
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse "HH:MM" to a display string: "8:00 AM"
 */
export function formatTime24to12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Get today's Date object
 */
export function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Advance month (returns new year/month pair)
 */
export function advanceMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  if (m > 11) { m = 0; y++; }
  if (m < 0) { m = 11; y--; }
  return { year: y, month: m };
}

/**
 * Generate time block labels like '6 AM', '7 AM', '12 PM', '11 PM'
 */
export function generateTimeBlocks(startHour: number, endHour: number): string[] {
  const blocks: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    blocks.push(label);
  }
  return blocks;
}

/**
 * Parse any time string into 24-hour hours and minutes.
 * Handles formats: "06:00 AM", "6:00 PM", "6 AM", "6:00 PM - 7:00 PM", "14:30", etc.
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  // Strip currency / extra annotations e.g. "(₹150)"
  const cleanStr = timeStr.replace(/\(.*?\)/g, '').trim();
  // If time range like "09:00 AM - 10:30 AM", take start time
  const startPart = cleanStr.split('-')[0].trim();

  // 12-hour or 24-hour match
  const match = startPart.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

/**
 * Calculates the end time of a 1-hour slot (or custom duration).
 * e.g. "12:00 PM" -> "01:00 PM", "11:00 AM" -> "12:00 PM", "11:00 PM" -> "12:00 AM"
 */
export function getSlotEndTime(timeStr: string, durationHours: number = 1): string {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return timeStr;

  let endHour = (parsed.hours + durationHours) % 24;
  const endMinute = parsed.minutes;
  const period = endHour >= 12 ? 'PM' : 'AM';
  const displayHour = endHour % 12 || 12;

  return `${String(displayHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')} ${period}`;
}

/**
 * Format a list of selected 1-hour slots into a clean time range string.
 * e.g. ['12:00 PM'] -> "12:00 PM – 01:00 PM"
 * e.g. ['01:00 PM', '02:00 PM'] -> "01:00 PM – 03:00 PM"
 * e.g. [] -> "TBD"
 */
export function formatSlotsRange(slots: string[]): string {
  if (!slots || slots.length === 0) return 'TBD';
  
  // Sort slots by chronologic time
  const sorted = [...slots].sort((a, b) => {
    const pA = parseTimeString(a);
    const pB = parseTimeString(b);
    if (!pA || !pB) return 0;
    return pA.hours * 60 + pA.minutes - (pB.hours * 60 + pB.minutes);
  });

  if (sorted.length === 1) {
    return `${sorted[0]} – ${getSlotEndTime(sorted[0], 1)}`;
  }

  const startTime = sorted[0];
  const lastStartTime = sorted[sorted.length - 1];
  const endTime = getSlotEndTime(lastStartTime, 1);

  return `${startTime} – ${endTime}`;
}

/**
 * Check whether a time slot is in the past compared to current time.
 * @param timeStr - e.g. "06:00 AM", "6:00 PM", "09:00 AM - 10:30 AM"
 * @param targetDate - Optional Date, date string, or day number. If omitted, defaults to today.
 */
export function isTimeSlotPassed(timeStr: string, targetDate?: Date | string | number | null): boolean {
  const now = new Date();
  let slotDate: Date;

  if (!targetDate) {
    slotDate = new Date();
  } else if (targetDate instanceof Date) {
    slotDate = targetDate;
  } else if (typeof targetDate === 'number') {
    // If just day of month number for current month/year
    slotDate = new Date(now.getFullYear(), now.getMonth(), targetDate);
  } else if (typeof targetDate === 'string') {
    const lower = targetDate.toLowerCase();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const matchingDayIndex = dayNames.findIndex(d => lower.startsWith(d));
    
    if (matchingDayIndex !== -1 && !targetDate.includes(' ') && !targetDate.includes('-') && !targetDate.includes('/')) {
      // Day of week name (e.g. 'Monday', 'Tue')
      const currentDayOfWeek = now.getDay();
      const nowMondayIdx = (currentDayOfWeek + 6) % 7;
      const targetMondayIdx = (matchingDayIndex + 6) % 7;
      
      if (targetMondayIdx < nowMondayIdx) {
        return true; // Past day in current week
      } else if (targetMondayIdx > nowMondayIdx) {
        return false; // Future day in current week
      } else {
        slotDate = now;
      }
    } else {
      const parsedDate = new Date(targetDate);
      slotDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
  } else {
    slotDate = new Date();
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetStart = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate()).getTime();

  if (targetStart < todayStart) {
    return true; // Entire day has passed
  }

  if (targetStart > todayStart) {
    return false; // Future date
  }

  // Same day (Today): Check time against current hour & minute
  const parsed = parseTimeString(timeStr);
  if (!parsed) return false;

  const slotDateTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parsed.hours,
    parsed.minutes,
    0,
    0
  );

  return slotDateTime.getTime() <= now.getTime();
}

