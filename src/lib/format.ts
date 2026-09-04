// Money formatting in PKR (default) — pass currency code as needed
export function fmtPKR(n: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function fmtGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${g.toFixed(0)} g`;
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
export function monthLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

// Compact "YYYY-MM" key for a date.
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Parse a "YYYY-MM" filter value into a Date (first day of that month).
// Falls back to the current month when the value is missing or invalid.
export function parseMonthKey(s?: string | null): Date {
  const m = /^(\d{4})-(\d{2})$/.exec(s || '');
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (mo >= 1 && mo <= 12) return new Date(y, mo - 1, 1);
  }
  return new Date();
}

// Shift a date by `delta` months, returning the first day of the resulting month.
export function shiftMonth(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}