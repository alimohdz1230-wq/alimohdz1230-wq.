import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  History,
  UserCheck,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  Group,
  SessionPeriod,
  Student,
} from '../types';
import { formatArabicWeekday, formatGregorianDate, getCurrentMonthISO, getTodayISO } from '../utils/date';
import { sortStudents } from '../utils/sortStudents';

interface AttendanceViewProps {
  groups: Group[];
  students: Student[];
  attendance: AttendanceRecord[];
  onSaveSessionAttendance: (
    groupId: string,
    date: string,
    period: SessionPeriod,
    entries: { studentId: string; status: AttendanceStatus; excuseReason?: string }[]
  ) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  groups,
  students,
  attendance,
  onSaveSessionAttendance,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [date, setDate] = useState(getTodayISO());
  const [period, setPeriod] = useState<SessionPeriod>('morning');
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'student-summary'>('record');

  // Local draft overrides keyed by `${groupId}_${date}_${period}`
  const [drafts, setDrafts] = useState<
    Record<string, Record<string, { status: AttendanceStatus; excuseReason: string }>>
  >({});
  const [savedNotice, setSavedNotice] = useState('');

  const activeStudents = useMemo(() => students.filter((s) => !s.archived), [students]);

  // History / student summary state
  const [summaryMonth, setSummaryMonth] = useState(getCurrentMonthISO());
  const [summaryStudentId, setSummaryStudentId] = useState(activeStudents[0]?.id || '');

  const effectiveSummaryStudentId =
    activeStudents.find((s) => s.id === summaryStudentId)?.id || activeStudents[0]?.id || '';

  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const groupStudents = useMemo(() => {
    if (!currentGroup) return [];
    return sortStudents(
      activeStudents.filter((s) => s.groupId === currentGroup.id),
      currentGroup.sortMode
    );
  }, [currentGroup, activeStudents]);

  const sessionKey = `${currentGroup?.id || ''}_${date}_${period}`;

  const currentEntries = useMemo(() => {
    const map: Record<string, { status: AttendanceStatus; excuseReason: string }> = {};
    const draft = drafts[sessionKey];
    groupStudents.forEach((s) => {
      if (draft && draft[s.id]) {
        map[s.id] = draft[s.id];
      } else {
        const existing = attendance.find(
          (a) =>
            a.studentId === s.id &&
            a.groupId === currentGroup?.id &&
            a.date === date &&
            a.period === period
        );
        if (existing) {
          map[s.id] = {
            status: existing.status,
            excuseReason: existing.excuseReason || '',
          };
        } else {
          map[s.id] = { status: 'present', excuseReason: '' };
        }
      }
    });
    return map;
  }, [drafts, sessionKey, groupStudents, attendance, currentGroup, date, period]);

  const updateStudentDraft = (
    studentId: string,
    status: AttendanceStatus,
    excuseReason?: string
  ) => {
    setDrafts((prev) => {
      const sessionDraft = { ...(prev[sessionKey] || currentEntries) };
      sessionDraft[studentId] = {
        status,
        excuseReason:
          excuseReason !== undefined
            ? excuseReason
            : status === 'excused'
            ? sessionDraft[studentId]?.excuseReason || ''
            : '',
      };
      return { ...prev, [sessionKey]: sessionDraft };
    });
  };

  const handleMarkAllPresent = () => {
    const next: Record<string, { status: AttendanceStatus; excuseReason: string }> = {};
    groupStudents.forEach((s) => {
      next[s.id] = { status: 'present', excuseReason: '' };
    });
    setDrafts((prev) => ({ ...prev, [sessionKey]: next }));
  };

  const handleSave = () => {
    if (!currentGroup) return;
    const entries = groupStudents.map((s) => ({
      studentId: s.id,
      status: currentEntries[s.id]?.status || 'present',
      excuseReason: currentEntries[s.id]?.excuseReason || '',
    }));
    onSaveSessionAttendance(currentGroup.id, date, period, entries);
    setSavedNotice('تم حفظ سجل الحضور لهذه الحصة بنجاح.');
    setTimeout(() => setSavedNotice(''), 3000);
  };

  // Previous sessions list
  const previousSessions = useMemo(() => {
    const map = new Map<
      string,
      {
        groupId: string;
        date: string;
        period: SessionPeriod;
        present: number;
        absent: number;
        excused: number;
      }
    >();
    attendance.forEach((rec) => {
      if (currentGroup && rec.groupId !== currentGroup.id) return;
      const key = `${rec.groupId}_${rec.date}_${rec.period}`;
      const cur = map.get(key) || {
        groupId: rec.groupId,
        date: rec.date,
        period: rec.period,
        present: 0,
        absent: 0,
        excused: 0,
      };
      cur[rec.status] += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (a.period === b.period ? 0 : a.period === 'evening' ? -1 : 1)
    );
  }, [attendance, currentGroup]);

  // Individual student monthly & daily attendance
  const studentAttendanceLogs = useMemo(() => {
    if (!effectiveSummaryStudentId) return [];
    return attendance
      .filter((a) => a.studentId === effectiveSummaryStudentId && a.date.startsWith(summaryMonth))
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          (a.period === b.period ? 0 : a.period === 'evening' ? -1 : 1)
      );
  }, [attendance, effectiveSummaryStudentId, summaryMonth]);

  const studentStats = useMemo(() => {
    const present = studentAttendanceLogs.filter((l) => l.status === 'present').length;
    const absent = studentAttendanceLogs.filter((l) => l.status === 'absent').length;
    const excused = studentAttendanceLogs.filter((l) => l.status === 'excused').length;
    return { present, absent, excused, total: studentAttendanceLogs.length };
  }, [studentAttendanceLogs]);

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)]">
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activeTab === 'record'
                ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-xs'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            تسجيل الحضور
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activeTab === 'history'
                ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-xs'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            السجلات السابقة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('student-summary')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activeTab === 'student-summary'
                ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-xs'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            الحضور اليومي والشهري للطالب
          </button>
        </div>
      </div>

      {activeTab === 'record' && (
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-5">
          {/* Session Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">الفوج</label>
              <select
                value={currentGroup?.id || ''}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">تاريخ الحصة</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">الفترة</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPeriod('morning')}
                  className={`min-h-[44px] rounded-xl text-sm font-semibold border transition-colors ${
                    period === 'morning'
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)]'
                  }`}
                >
                  صباحية
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('evening')}
                  className={`min-h-[44px] rounded-xl text-sm font-semibold border transition-colors ${
                    period === 'evening'
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)]'
                  }`}
                >
                  مسائية
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-hairline)]">
            <div className="text-xs text-[var(--text-secondary)]">
              {formatArabicWeekday(date)} · {formatGregorianDate(date)} ·{' '}
              {period === 'morning' ? 'الفترة الصباحية' : 'الفترة المسائية'}
            </div>
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
            >
              <UserCheck className="h-4 w-4 text-[var(--accent-primary)]" />
              <span>تحديد الجميع حاضرًا</span>
            </button>
          </div>

          {/* Student 1-tap attendance list */}
          {groupStudents.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
              لا يوجد طلاب في هذا الفوج.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {groupStudents.map((student, index) => {
                const entry = currentEntries[student.id] || {
                  status: 'present',
                  excuseReason: '',
                };
                return (
                  <div key={student.id} className="py-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 shrink-0 rounded-lg bg-[var(--bg-subtle)] font-mono-num text-xs font-bold flex items-center justify-center text-[var(--text-secondary)]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                            {student.fullName}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] font-mono-num">
                            {student.studentCode}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateStudentDraft(student.id, 'present')}
                          className={`min-h-[42px] px-3.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors ${
                            entry.status === 'present'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>حاضر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStudentDraft(student.id, 'absent')}
                          className={`min-h-[42px] px-3.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors ${
                            entry.status === 'absent'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                          }`}
                        >
                          <XCircle className="h-4 w-4" />
                          <span>غائب</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStudentDraft(student.id, 'excused')}
                          className={`min-h-[42px] px-3.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors ${
                            entry.status === 'excused'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                          }`}
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>عذر</span>
                        </button>
                      </div>
                    </div>

                    {entry.status === 'excused' && (
                      <div className="pr-11">
                        <input
                          type="text"
                          value={entry.excuseReason}
                          onChange={(e) =>
                            updateStudentDraft(student.id, 'excused', e.target.value)
                          }
                          placeholder="اكتب سبب العذر هنا (مثال: موعد طبي، ظرف عائلي)..."
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-hairline)]">
            {savedNotice ? (
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {savedNotice}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={groupStudents.length === 0}
              className="inline-flex items-center gap-2 min-h-[46px] px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>حفظ سجل الحضور</span>
            </button>
          </div>
        </section>
      )}

      {activeTab === 'history' && (
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-[var(--accent-primary)]" />
              <span>سجلات الحضور السابقة</span>
            </h3>
            <select
              value={currentGroup?.id || ''}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="min-h-[42px] px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {previousSessions.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
              لا توجد حصص مسجلة لهذا الفوج بعد.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {previousSessions.map((sess) => (
                <div
                  key={`${sess.groupId}_${sess.date}_${sess.period}`}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm">
                      {formatArabicWeekday(sess.date)} — {formatGregorianDate(sess.date)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                      {sess.period === 'morning' ? 'الفترة الصباحية' : 'الفترة المسائية'} · حاضر:{' '}
                      {sess.present} · غائب: {sess.absent} · عذر: {sess.excused}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(sess.groupId);
                      setDate(sess.date);
                      setPeriod(sess.period);
                      setActiveTab('record');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
                  >
                    عرض وتعديل
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'student-summary' && (
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">الطالب</label>
              <select
                value={effectiveSummaryStudentId}
                onChange={(e) => setSummaryStudentId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
              >
                {activeStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الشهر</label>
              <input
                type="month"
                value={summaryMonth}
                onChange={(e) => setSummaryMonth(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]">
              <div className="text-xs text-[var(--text-secondary)]">إجمالي الحصص</div>
              <div className="text-xl font-bold tabular-nums mt-1">{studentStats.total}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <div className="text-xs text-emerald-700 dark:text-emerald-300">حاضر</div>
              <div className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300 mt-1">
                {studentStats.present}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30">
              <div className="text-xs text-red-700 dark:text-red-300">غائب</div>
              <div className="text-xl font-bold tabular-nums text-red-700 dark:text-red-300 mt-1">
                {studentStats.absent}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <div className="text-xs text-amber-700 dark:text-amber-300">بعذر</div>
              <div className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-300 mt-1">
                {studentStats.excused}
              </div>
            </div>
          </div>

          <div className="divide-y divide-[var(--border-hairline)]">
            {studentAttendanceLogs.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
                لا توجد سجلات حضور لهذا الطالب في الشهر المحدد.
              </div>
            ) : (
              studentAttendanceLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">
                      {formatArabicWeekday(log.date)} · {formatGregorianDate(log.date)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {log.period === 'morning' ? 'الفترة الصباحية' : 'الفترة المسائية'}
                      {log.excuseReason ? ` — سبب العذر: ${log.excuseReason}` : ''}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      log.status === 'present'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : log.status === 'absent'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {log.status === 'present' ? 'حاضر' : log.status === 'absent' ? 'غائب' : 'عذر'}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
};
