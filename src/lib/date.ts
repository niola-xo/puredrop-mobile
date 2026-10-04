/**
 * PureDrop Mobile Lagos Timezone Date Utilities
 * All delivery calculations strictly use Africa/Lagos (UTC+1).
 */

const LAGOS_TZ = 'Africa/Lagos';

export const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
] as const;

export function getWeekdayName(weekdayNumber: number): string {
  const map: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };
  return map[weekdayNumber] ?? 'Monday';
}

export function getLagosNow(): Date {
  const now = new Date();
  const lagosTimeString = now.toLocaleString('en-US', { timeZone: LAGOS_TZ });
  return new Date(lagosTimeString);
}

export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatReadableDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns array of the next 30 delivery dates starting tomorrow in Lagos time
 */
export function getNext30DeliveryDates(): { iso: string; readable: string }[] {
  const lagos = getLagosNow();
  const dates: { iso: string; readable: string }[] = [];

  for (let i = 1; i <= 30; i++) {
    const candidate = new Date(lagos.getFullYear(), lagos.getMonth(), lagos.getDate() + i);
    const iso = formatDateIso(candidate);
    dates.push({
      iso,
      readable: formatReadableDate(iso),
    });
  }

  return dates;
}

/**
 * Calculates the first subscription delivery date:
 * First occurrence of chosenWeekday that is at least 1 day after today in Lagos.
 */
export function calculateFirstSubscriptionDeliveryDate(chosenWeekday: number): string {
  const lagos = getLagosNow();
  const candidate = new Date(lagos.getFullYear(), lagos.getMonth(), lagos.getDate() + 1);

  while (candidate.getDay() !== chosenWeekday) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return formatDateIso(candidate);
}
