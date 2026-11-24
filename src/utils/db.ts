import {
  AppDatabase,
  BackupSnapshot,
} from '../types';

const DB_NAME = 'HalaqatDB';
const DB_VERSION = 1;
const STORE_MAIN = 'appState';
const STORE_BACKUPS = 'backups';
const MAIN_KEY = 'primary';
const LS_FALLBACK_KEY = 'halaqat_db_v1';
const LS_BACKUPS_KEY = 'halaqat_backups_v1';

const LEGACY_DB_NAME = 'MaqraatAlNoorDB';
const LEGACY_LS_FALLBACK_KEY = 'maqraat_alnoor_db_v1';
const LEGACY_LS_BACKUPS_KEY = 'maqraat_alnoor_backups_v1';

export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createInitialDatabase(): AppDatabase {
  return {
    version: 3,
    groups: [],
    students: [],
    attendance: [],
    recitations: [],
    schedule: [],
    payments: [],
    goals: [],
    motivationStars: [],
    competitions: [],
    prayerSettings: {
      mode: 'manual',
      country: 'الجزائر',
      city: 'الجزائر العاصمة',
      latitude: 36.7538,
      longitude: 3.0588,
      method: 'MuslimWorldLeague',
      mosqueName: '',
    },
    settings: {
      displayMode: 'light',
      accentColor: 'emerald-teal',
      backgroundShade: 'ivory',
      fontSize: 16,
      fontFamily: 'arfonts-cairo-medium',
      defaultMonthlyFee: 1000,
      currencyLabel: 'دج',
      autoBackupEnabled: true,
      lastBackupAt: new Date().toISOString(),
    },
  };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      dbPromise = null;
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_MAIN)) {
        db.createObjectStore(STORE_MAIN);
      }
      if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
        db.createObjectStore(STORE_BACKUPS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

function migrateDatabase(data: AppDatabase): { migrated: AppDatabase; changed: boolean } {
  let next = data;
  let changed = false;

  if ((next.version ?? 1) < 2) {
    const cleanName =
      next.prayerSettings?.mosqueName === 'مسجد النور'
        ? ''
        : next.prayerSettings?.mosqueName || '';
    next = {
      ...next,
      version: 2,
      prayerSettings: {
        ...next.prayerSettings,
        mosqueName: cleanName,
      },
    };
    changed = true;
  }

  if ((next.version ?? 1) < 3) {
    const seededGroupIds = new Set(['grp_fajr', 'grp_noor']);
    const seededStudentIds = new Set(['stu_1', 'stu_2', 'stu_3', 'stu_4', 'stu_5', 'stu_6']);
    const seededAttIds = new Set(['att_1', 'att_2', 'att_3', 'att_4', 'att_5']);
    const seededRecIds = new Set(['rec_1', 'rec_2', 'rec_3', 'rec_4']);
    const seededSchIds = new Set(['sch_1', 'sch_2', 'sch_3', 'sch_4', 'sch_5']);
    const seededPayIds = new Set(['pay_1', 'pay_2']);
    const seededGoalIds = new Set(['goal_1', 'goal_2']);
    const seededStarIds = new Set(['star_1', 'star_2', 'star_3']);
    const seededCompIds = new Set(['comp_1']);

    next = {
      ...next,
      version: 3,
      groups: next.groups.filter(
        (g) =>
          !seededGroupIds.has(g.id) &&
          g.name.trim() !== 'فوج الفجر' &&
          g.name.trim() !== 'فوج النور'
      ),
      students: next.students.filter((s) => !seededStudentIds.has(s.id)),
      attendance: next.attendance.filter((a) => !seededAttIds.has(a.id)),
      recitations: next.recitations.filter((r) => !seededRecIds.has(r.id)),
      schedule: next.schedule.filter((s) => !seededSchIds.has(s.id)),
      payments: next.payments.filter((p) => !seededPayIds.has(p.id)),
      goals: next.goals.filter((g) => !seededGoalIds.has(g.id)),
      motivationStars: next.motivationStars.filter((m) => !seededStarIds.has(m.id)),
      competitions: next.competitions.filter((c) => !seededCompIds.has(c.id)),
    };
    changed = true;
  }

  return { migrated: next, changed };
}

export async function loadDatabase(): Promise<AppDatabase> {
  try {
    const db = await openDB();
    const result = await new Promise<AppDatabase | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_MAIN, 'readonly');
      const store = tx.objectStore(STORE_MAIN);
      const req = store.get(MAIN_KEY);
      req.onsuccess = () => resolve(req.result as AppDatabase | undefined);
      req.onerror = () => reject(req.error);
    });
    if (result && Array.isArray(result.groups) && Array.isArray(result.students)) {
      const { migrated, changed } = migrateDatabase(result);
      if (changed) await saveDatabase(migrated);
      return migrated;
    }
  } catch {
    // Fallback to localStorage below
  }

  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY) || localStorage.getItem(LEGACY_LS_FALLBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppDatabase;
      if (parsed && Array.isArray(parsed.groups)) {
        const { migrated, changed } = migrateDatabase(parsed);
        if (changed || !localStorage.getItem(LS_FALLBACK_KEY)) {
          await saveDatabase(migrated);
        }
        return migrated;
      }
    }
  } catch {
    // Ignore parse error
  }

  try {
    if (typeof indexedDB !== 'undefined') {
      const legacyResult = await new Promise<AppDatabase | undefined>((resolve) => {
        const req = indexedDB.open(LEGACY_DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          req.transaction?.abort();
          resolve(undefined);
        };
        req.onsuccess = () => {
          const legacyDb = req.result;
          if (!legacyDb.objectStoreNames.contains(STORE_MAIN)) {
            legacyDb.close();
            resolve(undefined);
            return;
          }
          const tx = legacyDb.transaction(STORE_MAIN, 'readonly');
          const getReq = tx.objectStore(STORE_MAIN).get(MAIN_KEY);
          getReq.onsuccess = () => {
            legacyDb.close();
            resolve(getReq.result as AppDatabase | undefined);
          };
          getReq.onerror = () => {
            legacyDb.close();
            resolve(undefined);
          };
        };
        req.onerror = () => resolve(undefined);
      });
      if (legacyResult && Array.isArray(legacyResult.groups)) {
        const { migrated } = migrateDatabase(legacyResult);
        await saveDatabase(migrated);
        return migrated;
      }
    }
  } catch {
    // Ignore legacy DB read errors
  }

  const initial = createInitialDatabase();
  await saveDatabase(initial);
  return initial;
}

export async function saveDatabase(data: AppDatabase): Promise<void> {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors on fallback
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MAIN, 'readwrite');
      const store = tx.objectStore(STORE_MAIN);
      const req = store.put(data, MAIN_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback already saved to localStorage
  }
}

export async function saveBackupSnapshot(snapshot: BackupSnapshot): Promise<void> {
  try {
    const existing = await loadBackupSnapshots();
    const updated = [snapshot, ...existing].slice(0, 10);
    localStorage.setItem(LS_BACKUPS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BACKUPS, 'readwrite');
      const store = tx.objectStore(STORE_BACKUPS);
      store.put(snapshot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback already stored
  }
}

export async function loadBackupSnapshots(): Promise<BackupSnapshot[]> {
  try {
    const db = await openDB();
    const list = await new Promise<BackupSnapshot[]>((resolve, reject) => {
      const tx = db.transaction(STORE_BACKUPS, 'readonly');
      const store = tx.objectStore(STORE_BACKUPS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as BackupSnapshot[]) || []);
      req.onerror = () => reject(req.error);
    });
    if (list.length > 0) {
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    }
  } catch {
    // Fallback
  }

  try {
    const raw = localStorage.getItem(LS_BACKUPS_KEY) || localStorage.getItem(LEGACY_LS_BACKUPS_KEY);
    if (raw) {
      return (JSON.parse(raw) as BackupSnapshot[]).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
    }
  } catch {
    // Ignore
  }
  return [];
}

export function validateBackupPayload(raw: unknown): {
  valid: boolean;
  error?: string;
  data?: AppDatabase;
} {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'صيغة الملف غير صالحة أو فارغة.' };
  }
  const obj = raw as Partial<AppDatabase>;
  const requiredArrays: (keyof AppDatabase)[] = [
    'groups',
    'students',
    'attendance',
    'recitations',
    'schedule',
    'payments',
    'goals',
    'motivationStars',
    'competitions',
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(obj[key])) {
      return { valid: false, error: `الملف يفتقد إلى سجل أساسي (${key}).` };
    }
  }
  if (!obj.settings || typeof obj.settings !== 'object') {
    return { valid: false, error: 'الملف يفتقد إلى إعدادات التطبيق.' };
  }
  if (!obj.prayerSettings || typeof obj.prayerSettings !== 'object') {
    return { valid: false, error: 'الملف يفتقد إلى إعدادات مواقيت الصلاة.' };
  }
  const defaults = createInitialDatabase();
  const normalized: AppDatabase = {
    version: typeof obj.version === 'number' ? obj.version : defaults.version,
    groups: obj.groups!,
    students: obj.students!,
    attendance: obj.attendance!,
    recitations: obj.recitations!,
    schedule: obj.schedule!,
    payments: obj.payments!,
    goals: obj.goals!,
    motivationStars: obj.motivationStars!,
    competitions: obj.competitions!,
    prayerSettings: {
      ...defaults.prayerSettings,
      ...obj.prayerSettings,
    },
    settings: {
      ...defaults.settings,
      ...obj.settings,
    },
  };
  return { valid: true, data: normalized };
}
