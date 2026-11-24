import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Edit3,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  EvaluationGrade,
  Group,
  RecitationRecord,
  RecitationType,
  Student,
} from '../types';
import { getSurahByNumber } from '../data/surahs';
import { sortStudents } from '../utils/sortStudents';
import { formatArabicWeekday, formatGregorianDate, getTodayISO } from '../utils/date';
import { SurahSearchSelect } from './SurahSearchSelect';

const EVALUATIONS: EvaluationGrade[] = ['ممتاز', 'جيد جدًا', 'جيد', 'حسن', 'إعادة حفظ'];

interface HifzViewProps {
  groups: Group[];
  students: Student[];
  recitations: RecitationRecord[];
  onAddRecitation: (input: Omit<RecitationRecord, 'id' | 'createdAt'>) => void;
  onUpdateRecitation: (record: RecitationRecord) => void;
  onDeleteRecitation: (id: string) => void;
}

export const HifzView: React.FC<HifzViewProps> = ({
  groups,
  students,
  recitations,
  onAddRecitation,
  onUpdateRecitation,
  onDeleteRecitation,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Entry form state
  const [recType, setRecType] = useState<RecitationType>('hifz');
  const [surahNumber, setSurahNumber] = useState<number>(62);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(11);
  const [wird, setWird] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationGrade>('ممتاز');
  const [date, setDate] = useState<string>(getTodayISO());
  const [notice, setNotice] = useState<string>('');

  // Editing existing record & delete confirmation
  const [editingRecord, setEditingRecord] = useState<RecitationRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const groupStudents = useMemo(() => {
    if (!selectedGroup) return [];
    return sortStudents(
      students.filter((s) => !s.archived && s.groupId === selectedGroup.id),
      selectedGroup.sortMode
    );
  }, [selectedGroup, students]);

  const currentSurah = useMemo(() => getSurahByNumber(surahNumber), [surahNumber]);

  const studentHifzLogs = useMemo(
    () =>
      recitations
        .filter((r) => r.studentId === selectedStudentId && r.type === 'hifz')
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [recitations, selectedStudentId]
  );

  const studentMurajaahLogs = useMemo(
    () =>
      recitations
        .filter((r) => r.studentId === selectedStudentId && r.type === 'murajaah')
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [recitations, selectedStudentId]
  );

  const handleSaveRecitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const clampedStart = Math.max(1, Math.min(currentSurah.ayahCount, startAyah));
    const clampedEnd = Math.max(clampedStart, Math.min(currentSurah.ayahCount, endAyah));

    onAddRecitation({
      studentId: selectedStudent.id,
      type: recType,
      surahNumber,
      startAyah: clampedStart,
      endAyah: clampedEnd,
      wird: wird.trim(),
      evaluation,
      date,
    });
    setWird('');
    setNotice(
      recType === 'hifz'
        ? 'تم تسجيل الحفظ بنجاح وتحديث سجل الطالب والمسابقات المرتبطة.'
        : 'تم تسجيل المراجعة في سجل المراجعة بنجاح.'
    );
    setTimeout(() => setNotice(''), 3500);
  };

  // Step 1: Groups Selection
  if (!selectedGroup) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            اختر الفوج لمتابعة الحفظ والمراجعة
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            اضغط على اسم الفوج لعرض طلابه ثم اختيار الطالب لتسجيل التسميع.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--text-secondary)]">
            لا توجد أفواج مسجلة بعد. يرجى إضافة طالب من قسم التسجيلات أولًا.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              const count = students.filter((s) => !s.archived && s.groupId === group.id).length;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className="text-right rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 hover:border-[var(--accent-primary)] transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="h-10 w-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-mono-num text-[var(--text-secondary)]">
                      {count} طالب
                    </span>
                  </div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">{group.name}</div>
                  <div className="text-xs text-[var(--accent-primary)] font-semibold">
                    عرض قائمة الطلبة
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Students in Group
  if (!selectedStudent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedGroupId(null)}
              className="min-h-[42px] px-3.5 rounded-xl border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)] inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowRight className="h-4 w-4" />
              <span>الأفواج</span>
            </button>
            <div>
              <h3 className="text-base font-bold">{selectedGroup.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                اضغط على اسم الطالب للدخول إلى صفحة الحفظ والمراجعة الخاصة به ({groupStudents.length} طالب)
              </p>
            </div>
          </div>
        </div>

        {groupStudents.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--text-secondary)]">
            لا يوجد طلاب في هذا الفوج.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupStudents.map((stu, idx) => {
              const stuHifzCount = recitations.filter(
                (r) => r.studentId === stu.id && r.type === 'hifz'
              ).length;
              const stuMurCount = recitations.filter(
                (r) => r.studentId === stu.id && r.type === 'murajaah'
              ).length;
              const lastHifz = recitations
                .filter((r) => r.studentId === stu.id && r.type === 'hifz')
                .sort((a, b) => b.date.localeCompare(a.date))[0];

              return (
                <button
                  key={stu.id}
                  type="button"
                  onClick={() => setSelectedStudentId(stu.id)}
                  className="text-right rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 hover:border-[var(--accent-primary)] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-9 w-9 shrink-0 rounded-xl bg-[var(--bg-subtle)] font-mono-num text-xs font-bold flex items-center justify-center text-[var(--accent-primary)]">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {stu.fullName}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                        حفظ: {stuHifzCount} · مراجعة: {stuMurCount}
                        {lastHifz
                          ? ` · آخر حفظ: ${getSurahByNumber(lastHifz.surahNumber).name}`
                          : ''}
                      </div>
                    </div>
                  </div>
                  <BookOpen className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const displayedLogs = recType === 'hifz' ? studentHifzLogs : studentMurajaahLogs;

  // Step 3: Dedicated Student Page
  return (
    <div className="space-y-6">
      {/* Top Student Header */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSelectedStudentId(null)}
            className="min-h-[42px] px-3.5 rounded-xl border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)] inline-flex items-center gap-1.5 text-xs font-semibold shrink-0"
          >
            <ArrowRight className="h-4 w-4" />
            <span>الطلبة</span>
          </button>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">
              {selectedStudent.fullName}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] tabular-nums">
              {selectedGroup.name} · {selectedStudent.studentCode}
            </p>
          </div>
        </div>

        {/* Mode Toggle: Hifz vs Murajaah */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--bg-subtle)] shrink-0">
          <button
            type="button"
            onClick={() => setRecType('hifz')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors min-h-[42px] ${
              recType === 'hifz'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-xs'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/60'
            }`}
          >
            حفظ
          </button>
          <button
            type="button"
            onClick={() => setRecType('murajaah')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors min-h-[42px] ${
              recType === 'murajaah'
                ? 'bg-[var(--gold-primary)] text-white shadow-xs'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/60'
            }`}
          >
            مراجعة
          </button>
        </div>
      </div>

      {/* Entry Form */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <h4 className="text-base font-bold text-[var(--text-primary)] mb-4">
          {recType === 'hifz' ? 'تسجيل حفظ جديد' : 'تسجيل مراجعة جديدة'}
        </h4>

        <form onSubmit={handleSaveRecitation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <SurahSearchSelect
                value={surahNumber}
                onChange={(surah) => {
                  setSurahNumber(surah.number);
                  setStartAyah(1);
                  setEndAyah(surah.ayahCount);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                من الآية (الحد: {currentSurah.ayahCount})
              </label>
              <input
                type="number"
                min={1}
                max={currentSurah.ayahCount}
                value={startAyah}
                onChange={(e) => setStartAyah(Number(e.target.value) || 1)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                إلى الآية (الحد: {currentSurah.ayahCount})
              </label>
              <input
                type="number"
                min={1}
                max={currentSurah.ayahCount}
                value={endAyah}
                onChange={(e) => setEndAyah(Number(e.target.value) || 1)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">الورد</label>
              <input
                type="text"
                value={wird}
                onChange={(e) => setWird(e.target.value)}
                placeholder="مثال: نصف ثمن، وجه كامل، 5 أسطر..."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">التاريخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
              />
            </div>
          </div>

          {/* Independent Evaluation Buttons */}
          <div>
            <label className="block text-sm font-medium mb-2">التقييم</label>
            <div className="flex flex-wrap gap-2">
              {EVALUATIONS.map((grade) => {
                const active = evaluation === grade;
                const isRetry = grade === 'إعادة حفظ';
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setEvaluation(grade)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${
                      active
                        ? isRetry
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-hairline)]">
            {notice ? (
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {notice}
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 min-h-[46px] px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>حفظ في {recType === 'hifz' ? 'سجل الحفظ' : 'سجل المراجعة'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Separated Log Table */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-base font-bold text-[var(--text-primary)]">
            {recType === 'hifz'
              ? `سجل الحفظ المستقل (${studentHifzLogs.length})`
              : `سجل المراجعة المستقل (${studentMurajaahLogs.length})`}
          </h4>
          <span className="text-xs text-[var(--text-secondary)]">
            يتم فصل سجل الحفظ عن سجل المراجعة بالكامل
          </span>
        </div>

        {displayedLogs.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
            لا توجد عمليات مسجلة في {recType === 'hifz' ? 'سجل الحفظ' : 'سجل المراجعة'} بعد.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {displayedLogs.map((rec) => {
              const surah = getSurahByNumber(rec.surahNumber);
              const isEditing = editingRecord?.id === rec.id;

              if (isEditing && editingRecord) {
                const editSurah = getSurahByNumber(editingRecord.surahNumber);
                return (
                  <div key={rec.id} className="py-4 space-y-3 bg-[var(--bg-subtle)]/40 px-3 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <SurahSearchSelect
                          label="السورة"
                          value={editingRecord.surahNumber}
                          onChange={(s) =>
                            setEditingRecord({
                              ...editingRecord,
                              surahNumber: s.number,
                              startAyah: 1,
                              endAyah: Math.min(editingRecord.endAyah, s.ayahCount),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">من الآية</label>
                        <input
                          type="number"
                          min={1}
                          max={editSurah.ayahCount}
                          value={editingRecord.startAyah}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              startAyah: Number(e.target.value) || 1,
                            })
                          }
                          className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm font-mono-num"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">إلى الآية</label>
                        <input
                          type="number"
                          min={1}
                          max={editSurah.ayahCount}
                          value={editingRecord.endAyah}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              endAyah: Number(e.target.value) || 1,
                            })
                          }
                          className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm font-mono-num"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={editingRecord.wird}
                        onChange={(e) =>
                          setEditingRecord({ ...editingRecord, wird: e.target.value })
                        }
                        placeholder="الورد"
                        className="px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm"
                      />
                      <select
                        value={editingRecord.evaluation}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            evaluation: e.target.value as EvaluationGrade,
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm"
                      >
                        {EVALUATIONS.map((ev) => (
                          <option key={ev} value={ev}>
                            {ev}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editingRecord.date}
                        onChange={(e) =>
                          setEditingRecord({ ...editingRecord, date: e.target.value })
                        }
                        className="px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm font-mono-num"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const clampedStart = Math.max(
                            1,
                            Math.min(editSurah.ayahCount, editingRecord.startAyah || 1)
                          );
                          const clampedEnd = Math.max(
                            clampedStart,
                            Math.min(editSurah.ayahCount, editingRecord.endAyah || clampedStart)
                          );
                          onUpdateRecitation({
                            ...editingRecord,
                            startAyah: clampedStart,
                            endAyah: clampedEnd,
                            wird: editingRecord.wird.trim(),
                          });
                          setEditingRecord(null);
                        }}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>حفظ التعديل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRecord(null)}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>إلغاء</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={rec.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      سورة {surah.name} — من الآية {rec.startAyah} إلى الآية {rec.endAyah}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex flex-wrap items-center gap-2">
                      <span>
                        {formatArabicWeekday(rec.date)} {formatGregorianDate(rec.date)}
                      </span>
                      {rec.wird && (
                        <>
                          <span>·</span>
                          <span>الورد: {rec.wird}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        rec.evaluation === 'إعادة حفظ'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                          : 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                      }`}
                    >
                      {rec.evaluation}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingRecord({ ...rec })}
                      className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                      title="تعديل السجل"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {confirmDeleteId === rec.id ? (
                      <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2 py-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteRecitation(rec.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-xs font-bold text-red-600 dark:text-red-400 px-1"
                        >
                          تأكيد
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-[var(--text-secondary)] px-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(rec.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"
                        title="حذف السجل"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
