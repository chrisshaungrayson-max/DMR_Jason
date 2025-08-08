export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Determine meal type from local hour of the timestamp
export function categorizeMealByHour(isoTimestamp: string): MealType {
  const d = new Date(isoTimestamp);
  const hour = d.getHours();
  if (hour >= 5 && hour <= 10) return 'breakfast';
  if (hour >= 11 && hour <= 15) return 'lunch';
  if (hour >= 16 && hour <= 21) return 'dinner';
  return 'snack';
}

// Combine a YYYY-MM-DD date string with the current local time into an ISO string
export function combineDateWithNow(dateStr: string): string {
  try {
    const now = new Date();
    const [year, month, day] = dateStr.split('-').map((x) => parseInt(x, 10));
    if (!year || !month || !day) return now.toISOString();
    const combined = new Date(year, (month - 1), day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return combined.toISOString();
  } catch {
    return new Date().toISOString();
  }
}
