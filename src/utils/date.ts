export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseSafeDate(dateStr: string | Date): Date | null {
  const d = typeof dateStr === 'string' ? new Date(`${dateStr}T12:00:00`) : dateStr;
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatGregorianDate(dateStr: string | Date): string {
  const d = parseSafeDate(dateStr);
  if (!d) return typeof dateStr === 'string' ? dateStr : '';
  try {
    return new Intl.DateTimeFormat('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function formatHijriDate(dateStr: string | Date): string {
  const d = parseSafeDate(dateStr);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return '';
    }
  }
}

export function formatArabicWeekday(dateStr: string): string {
  const d = parseSafeDate(dateStr);
  if (!d) return '';
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[d.getDay()] || '';
}

export function formatMonthArabic(monthISO: string): string {
  const [y, m] = monthISO.split('-').map(Number);
  if (!y || !m) return monthISO;
  const d = new Date(y, m - 1, 15);
  if (Number.isNaN(d.getTime())) return monthISO;
  try {
    const greg = new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'long' }).format(d);
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'long',
    }).format(d);
    return `${greg} / ${hijri}`;
  } catch {
    return monthISO;
  }
}

export function daysBetween(startISO: string, endISO: string): number {
  const a = new Date(`${startISO}T00:00:00`).getTime();
  const b = new Date(`${endISO}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
}

export function addDaysISO(startISO: string, days: number): string {
  const d = parseSafeDate(startISO) || new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
