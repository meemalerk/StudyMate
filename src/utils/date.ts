export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Start of the current week (Monday 00:00:00), matching common "weekly goal" conventions. */
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  // getDay(): 0 = Sunday ... 6 = Saturday. Shift so Monday is the start.
  const diffToMonday = (day + 6) % 7;

  result.setDate(result.getDate() - diffToMonday);
  result.setHours(0, 0, 0, 0);

  return result;
}

/** Formats a minute count as "1h 30m", "45m", or "2h". */
export function formatHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/** First day (00:00:00) of the month containing `date`. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** A fixed 6x7 grid of days for the calendar view containing `monthDate`'s month.
 * Cells outside that month (leading/trailing) are `null`. Weeks start Monday. */
export function getMonthGrid(monthDate: Date): (Date | null)[] {
  const firstOfMonth = startOfMonth(monthDate);
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  ).getDate();

  // getDay(): 0 = Sunday ... 6 = Saturday. Shift so Monday is column 0.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const cells: (Date | null)[] = [];

  for (let i = 0; i < leadingBlanks; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
