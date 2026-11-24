import React, { useMemo, useState } from 'react';
import { Target, Plus, CheckCircle2, Trash2, Award, TrendingUp } from 'lucide-react';
import {
  AttendanceRecord,
  Group,
  MotivationStar,
  RecitationRecord,
  Student,
  StudentGoal,
} from '../types';
import { getSurahByNumber } from '../data/surahs';
import { SurahSearchSelect } from './SurahSearchSelect';
import { addDaysISO, formatGregorianDate, getTodayISO } from '../utils/date';

interface AnalyticsViewProps {
  groups: Group[];
  students: Student[];
  attendance: AttendanceRecord[];
  recitations: RecitationRecord[];
  goals: StudentGoal[];
  motivationStars: MotivationStar[];
  onAddGoal: (goal: Omit<StudentGoal, 'id' | 'createdAt' | 'completed'>) => void;
  onToggleGoalCompleted: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  groups,
  students,
  attendance,
  recitations,
  goals,
  motivationStars,
  onAddGoal,
  onToggleGoalCompleted,
  onDeleteGoal,
}) => {
  const activeStudents = useMemo(() => students.filter((s) => !s.archived), [students]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudents[0]?.id || '');

  // New goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalSurah, setGoalSurah] = useState<number>(78);
  const [goalDate, setGoalDate] = useState(addDaysISO(getTodayISO(), 30));
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState<string | null>(null);

  const student = activeStudents.find((s) => s.id === selectedStudentId) || activeStudents[0];

  // Overall stats
  const globalStats = useMemo(() => {
    const hifzRecords = recitations.filter((r) => r.type === 'hifz');
    const murRecords = recitations.filter((r) => r.type === 'murajaah');
    const totalHifzAyahs = hifzRecords.reduce((sum, r) => sum + (r.endAyah - r.startAyah + 1), 0);
    const totalMurAyahs = murRecords.reduce((sum, r) => sum + (r.endAyah - r.startAyah + 1), 0);
    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const attendanceRate =
      attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;
    const completedGoals = goals.filter((g) => g.completed).length;

    return {
      totalStudents: activeStudents.length,
      totalGroups: groups.length,
      totalHifzAyahs,
      totalMurAyahs,
      attendanceRate,
      completedGoals,
    };
  }, [recitations, attendance, goals, activeStudents.length, groups.length]);

  // Individual Student Stats
  const studentStats = useMemo(() => {
    if (!student) return null;
    const stuAtt = attendance.filter((a) => a.studentId === student.id);
    const present = stuAtt.filter((a) => a.status === 'present').length;
    const absent = stuAtt.filter((a) => a.status === 'absent').length;
    const excused = stuAtt.filter((a) => a.status === 'excused').length;
    const attRate = stuAtt.length > 0 ? Math.round((present / stuAtt.length) * 100) : 100;

    const stuHifz = recitations.filter((r) => r.studentId === student.id && r.type === 'hifz');
    const stuMur = recitations.filter((r) => r.studentId === student.id && r.type === 'murajaah');
    const hifzAyahs = stuHifz.reduce((sum, r) => sum + (r.endAyah - r.startAyah + 1), 0);
    const murAyahs = stuMur.reduce((sum, r) => sum + (r.endAyah - r.startAyah + 1), 0);

    const excellentCount = [...stuHifz, ...stuMur].filter((r) => r.evaluation === 'ممتاز').length;
    const stars = motivationStars.filter((m) => m.studentId === student.id && m.active);
    const stuGoals = goals.filter((g) => g.studentId === student.id);

    return {
      present,
      absent,
      excused,
      attRate,
      hifzSessions: stuHifz.length,
      murSessions: stuMur.length,
      hifzAyahs,
      murAyahs,
      excellentCount,
      stars,
      stuGoals,
    };
  }, [student, attendance, recitations, motivationStars, goals]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !goalTitle.trim()) return;
    onAddGoal({
      studentId: student.id,
      title: goalTitle.trim(),
      targetSurahNumber: goalSurah,
      targetDate: goalDate,
    });
    setGoalTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Global Overview Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-secondary)]">آيات الحفظ المسجلة</div>
          <div className="text-2xl font-bold tabular-nums text-[var(--accent-primary)] mt-1">
            {globalStats.totalHifzAyahs} آية
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
            عبر {globalStats.totalStudents} طالب
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-secondary)]">آيات المراجعة المسجلة</div>
          <div className="text-2xl font-bold tabular-nums text-[var(--gold-primary)] mt-1">
            {globalStats.totalMurAyahs} آية
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
            في {globalStats.totalGroups} أفواج
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-secondary)]">متوسط نسبة الحضور</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{globalStats.attendanceRate}%</div>
          <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] mt-2 overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)]"
              style={{ width: `${globalStats.attendanceRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-secondary)]">الأهداف المحققة</div>
          <div className="text-2xl font-bold tabular-nums mt-1">
            {globalStats.completedGoals} / {goals.length}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">أهداف الطلبة</div>
        </div>
      </section>

      {/* Per-Student Statistics, Achievements & Goals */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-hairline)]">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />
              <span>إحصائيات وإنجازات وأهداف الطالب</span>
            </h3>
          </div>
          <select
            value={student?.id || ''}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-semibold"
          >
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>

        {student && studentStats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]">
                <div className="text-xs text-[var(--text-secondary)]">مجموع الحفظ</div>
                <div className="text-lg font-bold tabular-nums mt-0.5">
                  {studentStats.hifzAyahs} آية
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                  {studentStats.hifzSessions} حصة تسميع
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]">
                <div className="text-xs text-[var(--text-secondary)]">مجموع المراجعة</div>
                <div className="text-lg font-bold tabular-nums mt-0.5">
                  {studentStats.murAyahs} آية
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                  {studentStats.murSessions} حصة مراجعة
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]">
                <div className="text-xs text-[var(--text-secondary)]">نسبة الحضور</div>
                <div className="text-lg font-bold tabular-nums mt-0.5">{studentStats.attRate}%</div>
                <div className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                  حاضر: {studentStats.present} · غائب: {studentStats.absent} · عذر:{' '}
                  {studentStats.excused}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]">
                <div className="text-xs text-[var(--text-secondary)]">التقدير الممتاز والنجوم</div>
                <div className="text-lg font-bold tabular-nums mt-0.5">
                  {studentStats.excellentCount} ممتاز · {studentStats.stars.length} نجمة
                </div>
              </div>
            </div>

            {/* Goals & Achievements Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Goals Management */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--accent-primary)]" />
                  <span>الأهداف المسجلة للطالب</span>
                </h4>

                <form
                  onSubmit={handleCreateGoal}
                  className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-3"
                >
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="عنوان الهدف (مثال: إتمام جزء تبارك)"
                    className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm"
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <SurahSearchSelect
                      label=""
                      value={goalSurah}
                      onChange={(s) => setGoalSurah(s.number)}
                    />
                    <input
                      type="date"
                      value={goalDate}
                      onChange={(e) => setGoalDate(e.target.value)}
                      className="min-h-[44px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm font-mono-num"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full min-h-[40px] rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة هدف</span>
                  </button>
                </form>

                <div className="divide-y divide-[var(--border-hairline)]">
                  {studentStats.stuGoals.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                      لا توجد أهداف مسجلة لهذا الطالب بعد.
                    </div>
                  ) : (
                    studentStats.stuGoals.map((goal) => (
                      <div key={goal.id} className="py-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleGoalCompleted(goal.id)}
                          className="flex items-start gap-2.5 text-right flex-1 min-w-0"
                        >
                          <CheckCircle2
                            className={`h-5 w-5 shrink-0 mt-0.5 ${
                              goal.completed
                                ? 'text-emerald-600'
                                : 'text-[var(--text-secondary)] opacity-40'
                            }`}
                          />
                          <div className="min-w-0">
                            <div
                              className={`text-sm font-semibold ${
                                goal.completed ? 'line-through text-[var(--text-secondary)]' : ''
                              }`}
                            >
                              {goal.title}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                              {goal.targetSurahNumber
                                ? `الهدف: سورة ${getSurahByNumber(goal.targetSurahNumber).name}`
                                : ''}
                              {goal.targetDate
                                ? ` · الموعد: ${formatGregorianDate(goal.targetDate)}`
                                : ''}
                            </div>
                          </div>
                        </button>
                        {confirmDeleteGoalId === goal.id ? (
                          <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2 py-1 rounded-lg shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteGoal(goal.id);
                                setConfirmDeleteGoalId(null);
                              }}
                              className="text-xs font-bold text-red-600 dark:text-red-400 px-1"
                            >
                              تأكيد
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteGoalId(null)}
                              className="text-xs text-[var(--text-secondary)] px-1"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteGoalId(goal.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 shrink-0"
                            title="حذف الهدف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Award className="h-4 w-4 text-[var(--gold-primary)]" />
                  <span>سجل الإنجازات والأوسمة</span>
                </h4>

                <div className="divide-y divide-[var(--border-hairline)]">
                  {studentStats.stars.length === 0 &&
                  studentStats.stuGoals.filter((g) => g.completed).length === 0 ? (
                    <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                      ستظهر هنا الإنجازات المكتسبة من اللوحة التحفيزية والأهداف المحققة.
                    </div>
                  ) : (
                    <>
                      {studentStats.stars.map((st) => (
                        <div key={st.id} className="py-3 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[var(--text-primary)]">
                              {st.achievementName || 'نجمة تحفيزية'}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">
                              نجمة تميز · {st.awardedAt ? formatGregorianDate(st.awardedAt) : ''}
                            </div>
                          </div>
                          <span className="text-amber-500 font-bold text-sm">★</span>
                        </div>
                      ))}
                      {studentStats.stuGoals
                        .filter((g) => g.completed)
                        .map((g) => (
                          <div key={g.id} className="py-3 flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                {g.title}
                              </div>
                              <div className="text-xs text-[var(--text-secondary)]">
                                هدف محقق{' '}
                                {g.completedAt ? `· ${formatGregorianDate(g.completedAt)}` : ''}
                              </div>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
