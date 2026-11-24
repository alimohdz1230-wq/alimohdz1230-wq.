export type SectionId =
  | 'registrations'
  | 'attendance'
  | 'groups'
  | 'hifz'
  | 'schedule'
  | 'subscriptions'
  | 'analytics'
  | 'reports'
  | 'qr-cards'
  | 'motivation'
  | 'competitions'
  | 'prayer-times'
  | 'backup'
  | 'settings'
  | 'about';

export type SortMode = 'manual' | 'date' | 'alphabetical';

export interface Group {
  id: string;
  name: string;
  sortMode: SortMode;
  createdAt: string;
}

export interface Student {
  id: string;
  studentCode: string;
  groupId: string;
  fullName: string;
  guardianName: string;
  guardianPhone: string;
  notes: string;
  archived: boolean;
  manualOrder: number;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type SessionPeriod = 'morning' | 'evening';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  period: SessionPeriod;
  status: AttendanceStatus;
  excuseReason?: string;
  updatedAt: string;
}

export type RecitationType = 'hifz' | 'murajaah';
export type EvaluationGrade = 'ممتاز' | 'جيد جدًا' | 'جيد' | 'حسن' | 'إعادة حفظ';

export interface RecitationRecord {
  id: string;
  studentId: string;
  type: RecitationType;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  wird: string;
  evaluation: EvaluationGrade;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export type ArabicWeekday =
  | 'السبت'
  | 'الأحد'
  | 'الإثنين'
  | 'الثلاثاء'
  | 'الأربعاء'
  | 'الخميس'
  | 'الجمعة';

export interface ScheduleItem {
  id: string;
  groupId: string;
  day: ArabicWeekday;
  time: string;
  activity: string;
  room: string;
}

export interface SubscriptionPayment {
  id: string;
  studentId: string;
  month: string; // YYYY-MM
  amount: number;
  paidAt: string; // YYYY-MM-DD
  notes: string;
}

export interface StudentGoal {
  id: string;
  studentId: string;
  title: string;
  targetSurahNumber?: number;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface MotivationStar {
  id: string;
  studentId: string;
  slotIndex: number; // 0..N
  active: boolean;
  achievementName: string;
  awardedAt?: string;
}

export type CompetitionStatus = 'not_started' | 'in_progress' | 'achieved' | 'expired';

export interface CompetitionParticipant {
  studentId: string;
  currentSurahNumber: number;
  status: CompetitionStatus;
  achievedAt?: string;
  prizeName?: string;
  prizeDelivered: boolean;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  groupId?: string;
  startSurahNumber: number;
  targetSurahNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  reward: string;
  notes: string;
  archived: boolean;
  participants: CompetitionParticipant[];
  createdAt: string;
}

export type PrayerCalcMethod =
  | 'UmmAlQura'
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'MoonsightingCommittee';

export interface PrayerSettings {
  mode: 'gps' | 'manual';
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  method: PrayerCalcMethod;
  mosqueName: string;
  mutedPrayers?: Record<string, boolean>;
  iqamaOffsets?: Record<string, number>;
}

export type DisplayMode = 'auto' | 'light' | 'dark' | 'emerald-night' | 'warm-sepia';
export type AccentTheme =
  | 'warm-gold'
  | 'emerald-teal'
  | 'classic-brown'
  | 'olive-leaf'
  | 'royal-navy'
  | 'deep-plum'
  | 'sage-mint'
  | 'slate-indigo';
export type BackgroundShade =
  | 'ivory'
  | 'pearl'
  | 'sand'
  | 'pure'
  | 'olive-mist'
  | 'sky-silk'
  | 'rose-cream'
  | 'warm-stone';
export type FontChoice =
  | 'arfonts-cairo-medium'
  | 'arfonts-al-jazeera-arabic'
  | 'arfonts-sultan-medium';

export interface AppSettings {
  displayMode: DisplayMode;
  accentColor: AccentTheme;
  backgroundShade: BackgroundShade;
  fontSize: number; // 14 to 20
  fontFamily: FontChoice;
  defaultMonthlyFee: number;
  currencyLabel: string;
  autoBackupEnabled: boolean;
  lastBackupAt?: string;
}

export interface AppDatabase {
  version: number;
  groups: Group[];
  students: Student[];
  attendance: AttendanceRecord[];
  recitations: RecitationRecord[];
  schedule: ScheduleItem[];
  payments: SubscriptionPayment[];
  goals: StudentGoal[];
  motivationStars: MotivationStar[];
  competitions: Competition[];
  prayerSettings: PrayerSettings;
  settings: AppSettings;
}

export interface BackupSnapshot {
  id: string;
  createdAt: string;
  reason: 'auto' | 'manual';
  data: AppDatabase;
}
