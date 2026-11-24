import { useEffect, useState } from 'react';
import { Award, X } from 'lucide-react';
import {
  AppDatabase,
  AppSettings,
  AttendanceStatus,
  Group,
  PrayerSettings,
  RecitationRecord,
  ScheduleItem,
  SectionId,
  SessionPeriod,
  SortMode,
  Student,
  StudentGoal,
  SubscriptionPayment,
} from './types';
import {
  generateId,
  loadDatabase,
  saveBackupSnapshot,
  saveDatabase,
} from './utils/db';
import { syncCompetitionsWithHifz } from './utils/competitionSync';
import { sortStudents } from './utils/sortStudents';
import { getTodayISO } from './utils/date';
import { Layout } from './components/Layout';
import { RegistrationsView } from './components/RegistrationsView';
import { GroupsView } from './components/GroupsView';
import { AttendanceView } from './components/AttendanceView';
import { HifzView } from './components/HifzView';
import { ScheduleView } from './components/ScheduleView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { QRCardsView } from './components/QRCardsView';
import { MotivationView } from './components/MotivationView';
import { CompetitionsView } from './components/CompetitionsView';
import { PrayerTimesView } from './components/PrayerTimesView';
import { BackupView } from './components/BackupView';
import { SettingsView } from './components/SettingsView';
import { AboutView } from './components/AboutView';

export default function App() {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('registrations');
  const [winnerAlerts, setWinnerAlerts] = useState<
    { competitionName: string; studentName: string; reward: string }[]
  >([]);

  // Load persisted IndexedDB state on mount
  useEffect(() => {
    loadDatabase().then((loaded) => {
      const { updated } = syncCompetitionsWithHifz(loaded.competitions, loaded.recitations);
      setDb({ ...loaded, competitions: updated });
    });
  }, []);

  // Apply display mode, accent, background shade, font size, and font family to <html>
  useEffect(() => {
    if (!db) return;
    const root = document.documentElement;
    const { displayMode, accentColor, backgroundShade, fontSize, fontFamily } = db.settings;

    const applyDark = () => {
      if (displayMode === 'dark' || displayMode === 'emerald-night') {
        root.classList.add('dark');
      } else if (displayMode === 'light' || displayMode === 'warm-sepia') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      }
    };

    applyDark();
    root.setAttribute('data-display', displayMode);
    root.setAttribute('data-accent', accentColor);
    root.setAttribute('data-bg', backgroundShade);
    root.setAttribute('data-font', fontFamily);
    root.style.fontSize = `${fontSize}px`;

    if (displayMode === 'auto') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyDark();
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [db?.settings]);

  // Automatic local backup snapshot when enabled (debounced at most once every 2 minutes)
  useEffect(() => {
    if (!db || !db.settings.autoBackupEnabled) return;
    const lastMs = db.settings.lastBackupAt ? new Date(db.settings.lastBackupAt).getTime() : 0;
    if (Date.now() - lastMs < 120_000) return;

    const timer = setTimeout(() => {
      const now = new Date().toISOString();
      const snapDb: AppDatabase = {
        ...db,
        settings: { ...db.settings, lastBackupAt: now },
      };
      saveBackupSnapshot({
        id: generateId('auto'),
        createdAt: now,
        reason: 'auto',
        data: snapDb,
      }).then(() => {
        saveDatabase(snapDb);
        setDb((prev) =>
          prev ? { ...prev, settings: { ...prev.settings, lastBackupAt: now } } : prev
        );
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [db]);

  // Helper to commit DB changes to IndexedDB + optional auto-backup
  const commitDb = (updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveDatabase(next);
      return next;
    });
  };

  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <div className="text-sm font-semibold">جارٍ تحميل قاعدة البيانات المحلية...</div>
      </div>
    );
  }

  // --- Handlers: Groups & Students ---
  const ensureGroupByName = (groups: Group[], name: string): { groups: Group[]; groupId: string } => {
    const normalized = name.trim();
    const existing = groups.find((g) => g.name.trim() === normalized);
    if (existing) return { groups, groupId: existing.id };
    const newGroup: Group = {
      id: generateId('grp'),
      name: normalized,
      sortMode: 'manual',
      createdAt: new Date().toISOString(),
    };
    return { groups: [...groups, newGroup], groupId: newGroup.id };
  };

  const getNextStudentCode = (studentsList: Student[]): string => {
    const maxCodeNum = studentsList.reduce((max, s) => {
      const match = /^HQ-(\d+)$/i.exec(s.studentCode || '');
      const num = match ? Number(match[1]) : 1000;
      return Math.max(max, Number.isFinite(num) ? num : 1000);
    }, 1000);
    return `HQ-${maxCodeNum + 1}`;
  };

  const handleAddStudent = (input: {
    groupName: string;
    fullName: string;
    guardianName: string;
    guardianPhone: string;
    notes: string;
  }): { student: Student; groupName: string } => {
    const { groups: nextGroups, groupId } = ensureGroupByName(db.groups, input.groupName);
    const maxOrder = db.students
      .filter((s) => s.groupId === groupId)
      .reduce((m, s) => Math.max(m, s.manualOrder), 0);
    const newStudent: Student = {
      id: generateId('stu'),
      studentCode: getNextStudentCode(db.students),
      groupId,
      fullName: input.fullName,
      guardianName: input.guardianName,
      guardianPhone: input.guardianPhone,
      notes: input.notes,
      archived: false,
      manualOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };

    commitDb((prev) => {
      const { groups, groupId: gId } = ensureGroupByName(prev.groups, input.groupName);
      const safeOrder =
        prev.students
          .filter((s) => s.groupId === gId)
          .reduce((m, s) => Math.max(m, s.manualOrder), 0) + 1;
      const committedStudent: Student = {
        ...newStudent,
        groupId: gId,
        manualOrder: safeOrder,
        studentCode: getNextStudentCode(prev.students),
      };
      return {
        ...prev,
        groups,
        students: [...prev.students, committedStudent],
      };
    });

    const resolvedGroupName =
      nextGroups.find((g) => g.id === groupId)?.name || input.groupName.trim();
    return { student: newStudent, groupName: resolvedGroupName };
  };

  const handleUpdateStudent = (student: Student, targetGroupName?: string) => {
    commitDb((prev) => {
      let groups = prev.groups;
      let groupId = student.groupId;
      if (targetGroupName && targetGroupName.trim()) {
        const res = ensureGroupByName(groups, targetGroupName);
        groups = res.groups;
        groupId = res.groupId;
      }
      return {
        ...prev,
        groups,
        students: prev.students.map((s) => (s.id === student.id ? { ...student, groupId } : s)),
      };
    });
  };

  const handleToggleArchiveStudent = (studentId: string) => {
    commitDb((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, archived: !s.archived } : s
      ),
    }));
  };

  const handleDeleteStudent = (studentId: string) => {
    commitDb((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== studentId),
      attendance: prev.attendance.filter((a) => a.studentId !== studentId),
      recitations: prev.recitations.filter((r) => r.studentId !== studentId),
      payments: prev.payments.filter((p) => p.studentId !== studentId),
      goals: prev.goals.filter((g) => g.studentId !== studentId),
      motivationStars: prev.motivationStars.filter((m) => m.studentId !== studentId),
      competitions: prev.competitions.map((c) => ({
        ...c,
        participants: c.participants.filter((p) => p.studentId !== studentId),
      })),
    }));
  };

  const handleCreateGroup = (name: string) => {
    commitDb((prev) => {
      const { groups } = ensureGroupByName(prev.groups, name);
      return { ...prev, groups };
    });
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    commitDb((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, name: newName } : g)),
    }));
  };

  const handleChangeGroupSort = (groupId: string, sortMode: SortMode) => {
    commitDb((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, sortMode } : g)),
    }));
  };

  const handleReorderManualStudent = (
    groupId: string,
    studentId: string,
    direction: 'up' | 'down'
  ) => {
    commitDb((prev) => {
      const groupStudents = sortStudents(
        prev.students.filter((s) => !s.archived && s.groupId === groupId),
        'manual'
      );
      const idx = groupStudents.findIndex((s) => s.id === studentId);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= groupStudents.length) return prev;

      const reordered = [...groupStudents];
      const [moved] = reordered.splice(idx, 1);
      reordered.splice(swapIdx, 0, moved);

      const orderMap = new Map<string, number>();
      reordered.forEach((s, i) => orderMap.set(s.id, i + 1));

      return {
        ...prev,
        students: prev.students.map((s) =>
          orderMap.has(s.id) ? { ...s, manualOrder: orderMap.get(s.id)! } : s
        ),
      };
    });
  };

  const handleTransferStudent = (studentId: string, targetGroupId: string) => {
    commitDb((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, groupId: targetGroupId } : s
      ),
    }));
  };

  // --- Handlers: Attendance ---
  const handleSaveSessionAttendance = (
    groupId: string,
    date: string,
    period: SessionPeriod,
    entries: { studentId: string; status: AttendanceStatus; excuseReason?: string }[]
  ) => {
    commitDb((prev) => {
      const remaining = prev.attendance.filter(
        (a) => !(a.groupId === groupId && a.date === date && a.period === period)
      );
      const now = new Date().toISOString();
      const added = entries.map((e) => ({
        id: generateId('att'),
        studentId: e.studentId,
        groupId,
        date,
        period,
        status: e.status,
        excuseReason: e.status === 'excused' ? e.excuseReason || '' : undefined,
        updatedAt: now,
      }));
      return { ...prev, attendance: [...remaining, ...added] };
    });
  };

  const handleMarkSingleStudentAttendance = (
    studentId: string,
    groupId: string,
    date: string,
    period: SessionPeriod,
    status: AttendanceStatus,
    excuseReason?: string
  ) => {
    commitDb((prev) => {
      const filtered = prev.attendance.filter(
        (a) => !(a.studentId === studentId && a.date === date && a.period === period)
      );
      return {
        ...prev,
        attendance: [
          ...filtered,
          {
            id: generateId('att'),
            studentId,
            groupId,
            date,
            period,
            status,
            excuseReason: status === 'excused' ? excuseReason || '' : undefined,
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    });
  };

  const handleClearSingleStudentAttendance = (
    studentId: string,
    date: string,
    period: SessionPeriod
  ) => {
    commitDb((prev) => ({
      ...prev,
      attendance: prev.attendance.filter(
        (a) => !(a.studentId === studentId && a.date === date && a.period === period)
      ),
    }));
  };

  const handleMarkBatchAttendance = (
    studentIds: { studentId: string; groupId: string }[],
    date: string,
    period: SessionPeriod,
    status: AttendanceStatus
  ) => {
    if (studentIds.length === 0) return;
    commitDb((prev) => {
      const targetSet = new Set(studentIds.map((s) => s.studentId));
      const remaining = prev.attendance.filter(
        (a) => !(targetSet.has(a.studentId) && a.date === date && a.period === period)
      );
      const now = new Date().toISOString();
      const added = studentIds.map((item) => ({
        id: generateId('att'),
        studentId: item.studentId,
        groupId: item.groupId,
        date,
        period,
        status,
        updatedAt: now,
      }));
      return { ...prev, attendance: [...remaining, ...added] };
    });
  };

  // --- Handlers: Hifz & Murajaah (with Auto Competition Sync) ---
  const handleAddRecitation = (input: Omit<RecitationRecord, 'id' | 'createdAt'>) => {
    commitDb((prev) => {
      const nextRec: RecitationRecord = {
        ...input,
        id: generateId('rec'),
        createdAt: new Date().toISOString(),
      };
      const nextRecitations = [...prev.recitations, nextRec];
      const { updated, newAchievers } = syncCompetitionsWithHifz(
        prev.competitions,
        nextRecitations
      );

      if (newAchievers.length > 0) {
        setWinnerAlerts((alerts) => [
          ...alerts,
          ...newAchievers.map((na) => ({
            competitionName: na.competitionName,
            studentName:
              prev.students.find((s) => s.id === na.studentId)?.fullName || 'الطالب',
            reward: na.reward,
          })),
        ]);
      }

      return {
        ...prev,
        recitations: nextRecitations,
        competitions: updated,
      };
    });
  };

  const handleUpdateRecitation = (record: RecitationRecord) => {
    commitDb((prev) => {
      const nextRecitations = prev.recitations.map((r) => (r.id === record.id ? record : r));
      const { updated } = syncCompetitionsWithHifz(prev.competitions, nextRecitations);
      return {
        ...prev,
        recitations: nextRecitations,
        competitions: updated,
      };
    });
  };

  const handleDeleteRecitation = (id: string) => {
    commitDb((prev) => {
      const nextRecitations = prev.recitations.filter((r) => r.id !== id);
      const { updated } = syncCompetitionsWithHifz(prev.competitions, nextRecitations);
      return {
        ...prev,
        recitations: nextRecitations,
        competitions: updated,
      };
    });
  };

  // --- Handlers: Schedule ---
  const handleAddScheduleItem = (item: Omit<ScheduleItem, 'id'>) => {
    commitDb((prev) => ({
      ...prev,
      schedule: [...prev.schedule, { ...item, id: generateId('sch') }],
    }));
  };

  const handleUpdateScheduleItem = (item: ScheduleItem) => {
    commitDb((prev) => ({
      ...prev,
      schedule: prev.schedule.map((s) => (s.id === item.id ? item : s)),
    }));
  };

  const handleDeleteScheduleItem = (id: string) => {
    commitDb((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((s) => s.id !== id),
    }));
  };

  // --- Handlers: Subscriptions ---
  const handleUpdateDefaultFee = (fee: number, currencyLabel: string) => {
    commitDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, defaultMonthlyFee: fee, currencyLabel },
    }));
  };

  const handleAddPayment = (payment: Omit<SubscriptionPayment, 'id'>) => {
    commitDb((prev) => ({
      ...prev,
      payments: [...prev.payments, { ...payment, id: generateId('pay') }],
    }));
  };

  const handleUpdatePayment = (payment: SubscriptionPayment) => {
    commitDb((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === payment.id ? payment : p)),
    }));
  };

  const handleDeletePayment = (id: string) => {
    commitDb((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }));
  };

  // --- Handlers: Goals ---
  const handleAddGoal = (goal: Omit<StudentGoal, 'id' | 'createdAt' | 'completed'>) => {
    commitDb((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          ...goal,
          id: generateId('goal'),
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleToggleGoalCompleted = (goalId: string) => {
    commitDb((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              completed: !g.completed,
              completedAt: !g.completed ? getTodayISO() : undefined,
            }
          : g
      ),
    }));
  };

  const handleDeleteGoal = (goalId: string) => {
    commitDb((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  };

  // --- Handlers: Motivation Stars ---
  const handleToggleStar = (studentId: string, slotIndex: number, achievementName?: string) => {
    commitDb((prev) => {
      const existing = prev.motivationStars.find(
        (m) => m.studentId === studentId && m.slotIndex === slotIndex
      );

      if (existing) {
        // If achievementName is explicitly provided while already active, update it; if omitted, deactivate
        const nextActive = achievementName !== undefined ? true : false;
        return {
          ...prev,
          motivationStars: prev.motivationStars.map((m) =>
            m.id === existing.id
              ? {
                  ...m,
                  active: nextActive,
                  achievementName: achievementName ?? m.achievementName,
                  awardedAt: nextActive ? m.awardedAt || getTodayISO() : undefined,
                }
              : m
          ),
        };
      }

      return {
        ...prev,
        motivationStars: [
          ...prev.motivationStars,
          {
            id: generateId('star'),
            studentId,
            slotIndex,
            active: true,
            achievementName: achievementName || 'إنجاز متميز',
            awardedAt: getTodayISO(),
          },
        ],
      };
    });
  };

  // --- Handlers: Competitions ---
  const handleCreateCompetition = (input: {
    name: string;
    description: string;
    groupId?: string;
    participantIds: string[];
    startSurahNumber: number;
    targetSurahNumber: number;
    startDate: string;
    endDate: string;
    durationDays: number;
    reward: string;
    notes: string;
  }) => {
    commitDb((prev) => {
      const newComp = {
        id: generateId('comp'),
        name: input.name,
        description: input.description,
        groupId: input.groupId,
        startSurahNumber: input.startSurahNumber,
        targetSurahNumber: input.targetSurahNumber,
        startDate: input.startDate,
        endDate: input.endDate,
        durationDays: input.durationDays,
        reward: input.reward,
        notes: input.notes,
        archived: false,
        participants: input.participantIds.map((studentId) => ({
          studentId,
          currentSurahNumber: input.startSurahNumber,
          status: 'not_started' as const,
          prizeDelivered: false,
        })),
        createdAt: new Date().toISOString(),
      };
      const { updated } = syncCompetitionsWithHifz([newComp, ...prev.competitions], prev.recitations);
      return {
        ...prev,
        competitions: updated,
      };
    });
  };

  const handleUpdateParticipantPrize = (
    competitionId: string,
    studentId: string,
    prizeName: string,
    prizeDelivered: boolean
  ) => {
    commitDb((prev) => ({
      ...prev,
      competitions: prev.competitions.map((c) =>
        c.id === competitionId
          ? {
              ...c,
              participants: c.participants.map((p) =>
                p.studentId === studentId ? { ...p, prizeName, prizeDelivered } : p
              ),
            }
          : c
      ),
    }));
  };

  const handleArchiveCompetition = (competitionId: string) => {
    commitDb((prev) => ({
      ...prev,
      competitions: prev.competitions.map((c) =>
        c.id === competitionId ? { ...c, archived: true } : c
      ),
    }));
  };

  // --- Handlers: Prayer, Backup & Settings ---
  const handleUpdatePrayerSettings = (next: PrayerSettings) => {
    commitDb((prev) => ({ ...prev, prayerSettings: next }));
  };

  const handleUpdateSettings = (next: AppSettings) => {
    commitDb((prev) => ({ ...prev, settings: next }));
  };

  const handleCreateManualBackup = async () => {
    const now = new Date().toISOString();
    const updatedDb: AppDatabase = {
      ...db,
      settings: { ...db.settings, lastBackupAt: now },
    };
    await saveBackupSnapshot({
      id: generateId('bkp'),
      createdAt: now,
      reason: 'manual',
      data: updatedDb,
    });
    commitDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, lastBackupAt: now },
    }));
  };

  const handleToggleAutoBackup = (enabled: boolean) => {
    commitDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, autoBackupEnabled: enabled },
    }));
  };

  const handleRestoreDatabase = async (nextDb: AppDatabase) => {
    const { updated } = syncCompetitionsWithHifz(nextDb.competitions, nextDb.recitations);
    const finalized: AppDatabase = { ...nextDb, competitions: updated };
    await saveDatabase(finalized);
    setDb(finalized);
  };

  return (
    <Layout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      mosqueName={db.prayerSettings.mosqueName}
      onChangeMosqueName={(name) =>
        commitDb((prev) => ({
          ...prev,
          prayerSettings: { ...prev.prayerSettings, mosqueName: name },
        }))
      }
    >
      {/* Winner Congratulations Banner */}
      {winnerAlerts.length > 0 && (
        <div className="mb-5 space-y-2 no-print">
          {winnerAlerts.map((alert, i) => (
            <div
              key={i}
              className="rounded-2xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 text-sm text-emerald-900 dark:text-emerald-200">
                <Award className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <strong>تهنئة بإتمام المسابقة!</strong> أتمّ الطالب{' '}
                  <strong>{alert.studentName}</strong> هدف مسابقة «{alert.competitionName}» واستحق
                  المكافأة ({alert.reward}).
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWinnerAlerts((prev) => prev.filter((_, idx) => idx !== i))}
                className="p-1.5 rounded-lg hover:bg-emerald-900/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'registrations' && (
        <RegistrationsView
          groups={db.groups}
          students={db.students}
          attendance={db.attendance}
          mosqueName={db.prayerSettings.mosqueName}
          onChangeMosqueName={(name) =>
            commitDb((prev) => ({
              ...prev,
              prayerSettings: { ...prev.prayerSettings, mosqueName: name },
            }))
          }
          onAddStudent={handleAddStudent}
          onUpdateStudent={handleUpdateStudent}
          onToggleArchiveStudent={handleToggleArchiveStudent}
          onDeleteStudent={handleDeleteStudent}
          onMarkStudentAttendance={handleMarkSingleStudentAttendance}
          onMarkBatchAttendance={handleMarkBatchAttendance}
          onOpenQRCards={() => setActiveSection('qr-cards')}
        />
      )}

      {activeSection === 'attendance' && (
        <AttendanceView
          groups={db.groups}
          students={db.students}
          attendance={db.attendance}
          onSaveSessionAttendance={handleSaveSessionAttendance}
        />
      )}

      {activeSection === 'groups' && (
        <GroupsView
          groups={db.groups}
          students={db.students}
          onCreateGroup={handleCreateGroup}
          onRenameGroup={handleRenameGroup}
          onChangeGroupSort={handleChangeGroupSort}
          onReorderManualStudent={handleReorderManualStudent}
          onTransferStudent={handleTransferStudent}
        />
      )}

      {activeSection === 'hifz' && (
        <HifzView
          groups={db.groups}
          students={db.students}
          recitations={db.recitations}
          onAddRecitation={handleAddRecitation}
          onUpdateRecitation={handleUpdateRecitation}
          onDeleteRecitation={handleDeleteRecitation}
        />
      )}

      {activeSection === 'schedule' && (
        <ScheduleView
          groups={db.groups}
          schedule={db.schedule}
          onAddScheduleItem={handleAddScheduleItem}
          onUpdateScheduleItem={handleUpdateScheduleItem}
          onDeleteScheduleItem={handleDeleteScheduleItem}
        />
      )}

      {activeSection === 'subscriptions' && (
        <SubscriptionsView
          groups={db.groups}
          students={db.students}
          payments={db.payments}
          settings={db.settings}
          onUpdateDefaultFee={handleUpdateDefaultFee}
          onAddPayment={handleAddPayment}
          onUpdatePayment={handleUpdatePayment}
          onDeletePayment={handleDeletePayment}
        />
      )}

      {activeSection === 'analytics' && (
        <AnalyticsView
          groups={db.groups}
          students={db.students}
          attendance={db.attendance}
          recitations={db.recitations}
          goals={db.goals}
          motivationStars={db.motivationStars}
          onAddGoal={handleAddGoal}
          onToggleGoalCompleted={handleToggleGoalCompleted}
          onDeleteGoal={handleDeleteGoal}
        />
      )}

      {activeSection === 'reports' && (
        <ReportsView
          groups={db.groups}
          students={db.students}
          attendance={db.attendance}
          recitations={db.recitations}
          mosqueName={db.prayerSettings.mosqueName}
          onChangeMosqueName={(name) =>
            commitDb((prev) => ({
              ...prev,
              prayerSettings: { ...prev.prayerSettings, mosqueName: name },
            }))
          }
          onMarkStudentAttendance={handleMarkSingleStudentAttendance}
          onClearStudentAttendance={handleClearSingleStudentAttendance}
        />
      )}

      {activeSection === 'qr-cards' && (
        <QRCardsView
          groups={db.groups}
          students={db.students}
          mosqueName={db.prayerSettings.mosqueName}
          onChangeMosqueName={(name) =>
            commitDb((prev) => ({
              ...prev,
              prayerSettings: { ...prev.prayerSettings, mosqueName: name },
            }))
          }
          onMarkStudentAttendance={handleMarkSingleStudentAttendance}
        />
      )}

      {activeSection === 'motivation' && (
        <MotivationView
          groups={db.groups}
          students={db.students}
          motivationStars={db.motivationStars}
          onToggleStar={handleToggleStar}
        />
      )}

      {activeSection === 'competitions' && (
        <CompetitionsView
          groups={db.groups}
          students={db.students}
          competitions={db.competitions}
          onCreateCompetition={handleCreateCompetition}
          onUpdateParticipantPrize={handleUpdateParticipantPrize}
          onArchiveCompetition={handleArchiveCompetition}
        />
      )}

      {activeSection === 'prayer-times' && (
        <PrayerTimesView
          prayerSettings={db.prayerSettings}
          onUpdatePrayerSettings={handleUpdatePrayerSettings}
        />
      )}

      {activeSection === 'backup' && (
        <BackupView
          db={db}
          onCreateManualBackup={handleCreateManualBackup}
          onToggleAutoBackup={handleToggleAutoBackup}
          onRestoreDatabase={handleRestoreDatabase}
        />
      )}

      {activeSection === 'settings' && (
        <SettingsView settings={db.settings} onUpdateSettings={handleUpdateSettings} />
      )}

      {activeSection === 'about' && <AboutView />}
    </Layout>
  );
}
