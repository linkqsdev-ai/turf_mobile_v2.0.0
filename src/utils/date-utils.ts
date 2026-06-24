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
