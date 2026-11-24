import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Plus,
  Archive,
  CheckCircle2,
  Clock,
  Gift,
  Users,
  ArrowRight,
  Award,
} from 'lucide-react';
import { Competition, Group, Student } from '../types';
import { getSurahByNumber } from '../data/surahs';
import { SurahSearchSelect } from './SurahSearchSelect';
import {
  addDaysISO,
  daysBetween,
  formatGregorianDate,
  getTodayISO,
} from '../utils/date';
import { computeCompetitionProgressPercent } from '../utils/competitionSync';

interface CompetitionsViewProps {
  groups: Group[];
  students: Student[];
  competitions: Competition[];
  onCreateCompetition: (input: {
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
  }) => void;
  onUpdateParticipantPrize: (
    competitionId: string,
    studentId: string,
    prizeName: string,
    prizeDelivered: boolean
  ) => void;
  onArchiveCompetition: (competitionId: string) => void;
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({
  groups,
  students,
  competitions,
  onCreateCompetition,
  onUpdateParticipantPrize,
  onArchiveCompetition,
}) => {
  const activeStudents = useMemo(() => students.filter((s) => !s.archived), [students]);
  const [viewMode, setViewMode] = useState<'active' | 'archive' | 'create'>('active');
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  // Creation form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectionMode, setSelectionMode] = useState<'group' | 'manual'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [manualStudentIds, setManualStudentIds] = useState<string[]>([]);
  const [startSurah, setStartSurah] = useState(62);
  const [targetSurah, setTargetSurah] = useState(39);
  const [startDate, setStartDate] = useState(getTodayISO());
  const [durationDays, setDurationDays] = useState(30);
  const [endDate, setEndDate] = useState(addDaysISO(getTodayISO(), 30));
  const [reward, setReward] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const effectiveGroupId =
    groups.find((g) => g.id === selectedGroupId)?.id || groups[0]?.id || '';

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups]);

  const activeComps = useMemo(
    () => competitions.filter((c) => !c.archived),
    [competitions]
  );
  const archivedComps = useMemo(
    () => competitions.filter((c) => c.archived),
    [competitions]
  );

  const selectedCompetition = useMemo(
    () => competitions.find((c) => c.id === selectedCompId) || null,
    [competitions, selectedCompId]
  );

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setEndDate(addDaysISO(val, durationDays));
  };

  const handleDurationChange = (days: number) => {
    const safe = Math.max(1, Number.isFinite(days) ? Math.floor(days) : 1);
    setDurationDays(safe);
    setEndDate(addDaysISO(startDate, safe));
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setDurationDays(Math.max(1, daysBetween(startDate, val)));
  };

  const toggleManualStudent = (id: string) => {
    setManualStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const participantIds =
      selectionMode === 'group'
        ? activeStudents.filter((s) => s.groupId === effectiveGroupId).map((s) => s.id)
        : manualStudentIds;

    if (!name.trim()) {
      setFormError('يرجى كتابة اسم المسابقة.');
      return;
    }
    if (participantIds.length === 0) {
      setFormError('يرجى اختيار مشارك واحد على الأقل (تأكد من وجود طلبة في الفوج المحدد).');
      return;
    }

    onCreateCompetition({
      name: name.trim(),
      description: description.trim(),
      groupId: selectionMode === 'group' ? effectiveGroupId : undefined,
      participantIds,
      startSurahNumber: startSurah,
      targetSurahNumber: targetSurah,
      startDate,
      endDate,
      durationDays,
      reward: reward.trim() || 'جائزة تقديرية',
      notes: notes.trim(),
    });

    setName('');
    setDescription('');
    setManualStudentIds([]);
    setReward('');
    setNotes('');
    setFormError('');
    setViewMode('active');
  };

  const renderStatusLabel = (status: string) => {
    switch (status) {
      case 'achieved':
        return { text: 'حقق الهدف', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' };
      case 'in_progress':
        return { text: 'قيد التقدم', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' };
      case 'expired':
        return { text: 'انتهت المدة دون تحقيق الهدف', cls: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300' };
      default:
        return { text: 'لم يبدأ', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  // Competition Detail Page
  if (selectedCompetition) {
    const today = getTodayISO();
    const remainingDays =
      today > selectedCompetition.endDate ? 0 : daysBetween(today, selectedCompetition.endDate);
    const achievers = selectedCompetition.participants.filter((p) => p.status === 'achieved');

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCompId(null)}
                className="min-h-[42px] px-3.5 rounded-xl border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)] inline-flex items-center gap-1.5 text-xs font-semibold"
              >
                <ArrowRight className="h-4 w-4" />
                <span>المسابقات</span>
              </button>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {selectedCompetition.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedCompetition.description}
                </p>
              </div>
            </div>

            {!selectedCompetition.archived && (
              <button
                type="button"
                onClick={() => {
                  onArchiveCompetition(selectedCompetition.id);
                  setSelectedCompId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
              >
                <Archive className="h-4 w-4" />
                <span>نقل إلى الأرشيف</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)]">
              <div className="text-xs text-[var(--text-secondary)]">سورة البداية</div>
              <div className="font-bold text-sm mt-0.5">
                {getSurahByNumber(selectedCompetition.startSurahNumber).name}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)]">
              <div className="text-xs text-[var(--text-secondary)]">السورة المستهدفة</div>
              <div className="font-bold text-sm text-[var(--accent-primary)] mt-0.5">
                {getSurahByNumber(selectedCompetition.targetSurahNumber).name}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)]">
              <div className="text-xs text-[var(--text-secondary)]">الأيام المتبقية</div>
              <div className="font-bold text-sm tabular-nums mt-0.5">
                {remainingDays} يوم (من أصل {selectedCompetition.durationDays})
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)]">
              <div className="text-xs text-[var(--text-secondary)]">المكافأة</div>
              <div className="font-bold text-sm text-[var(--gold-primary)] mt-0.5">
                {selectedCompetition.reward}
              </div>
            </div>
          </div>
        </div>

        {/* Congratulations Banner for Achievers */}
        {achievers.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
              <Award className="h-5 w-5" />
              <span>تهنئة! الطلبة الذين حققوا الهدف المستهدف ({achievers.length})</span>
            </div>
            <div className="text-xs text-emerald-800/90 dark:text-emerald-200/90 space-y-1">
              {achievers.map((a) => {
                const stu = studentMap.get(a.studentId);
                return (
                  <div key={a.studentId}>
                    مبارك للطالب <strong>{stu?.fullName}</strong> وصوله إلى سورة{' '}
                    {getSurahByNumber(selectedCompetition.targetSurahNumber).name} بتاريخ{' '}
                    {a.achievedAt ? formatGregorianDate(a.achievedAt) : ''} — وهو مؤهل لاستلام
                    الجائزة.
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Participants Progress Table */}
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold">
              متابعة تقدم المشاركين ({selectedCompetition.participants.length})
            </h4>
            <span className="text-xs text-[var(--text-secondary)]">
              يُحدّث تلقائيًا عند تسجيل الحفظ للطالب
            </span>
          </div>

          <div className="divide-y divide-[var(--border-hairline)]">
            {selectedCompetition.participants.map((p) => {
              const stu = studentMap.get(p.studentId);
              const pct =
                p.status === 'achieved'
                  ? 100
                  : computeCompetitionProgressPercent(
                      p.currentSurahNumber,
                      selectedCompetition.startSurahNumber,
                      selectedCompetition.targetSurahNumber
                    );
              const badge = renderStatusLabel(p.status);

              return (
                <div key={p.studentId} className="py-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span>{stu?.fullName || 'طالب'}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${badge.cls}`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                        {stu ? groupMap.get(stu.groupId) : ''} · وصل إلى سورة{' '}
                        <strong>{getSurahByNumber(p.currentSurahNumber).name}</strong> · المستهدف:{' '}
                        <strong>{getSurahByNumber(selectedCompetition.targetSurahNumber).name}</strong>{' '}
                        · المتبقي: {remainingDays} يوم
                      </div>
                    </div>

                    <div className="text-left font-mono-num text-sm font-bold text-[var(--accent-primary)]">
                      {pct}%
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        p.status === 'achieved' ? 'bg-emerald-600' : 'bg-[var(--accent-primary)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Winner Prize Delivery Control */}
                  {p.status === 'achieved' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-[var(--gold-primary)]" />
                        <span>
                          تاريخ الإنجاز: {p.achievedAt ? formatGregorianDate(p.achievedAt) : '—'} ·
                          الجائزة: {p.prizeName || selectedCompetition.reward}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateParticipantPrize(
                            selectedCompetition.id,
                            p.studentId,
                            p.prizeName || selectedCompetition.reward,
                            !p.prizeDelivered
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          p.prizeDelivered
                            ? 'bg-emerald-600 text-white'
                            : 'border border-emerald-600 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {p.prizeDelivered ? 'تم تسليم الجائزة' : 'تسجيل تسليم الجائزة'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)]">
          <button
            type="button"
            onClick={() => setViewMode('active')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold min-h-[40px] whitespace-nowrap ${
              viewMode === 'active'
                ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-xs'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            المسابقات الجارية ({activeComps.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('archive')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold min-h-[40px] whitespace-nowrap ${
              viewMode === 'archive'
                ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-xs'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            أرشيف المسابقات ({archivedComps.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setViewMode('create')}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)]"
        >
          <Plus className="h-4 w-4" />
          <span>إنشاء مسابقة جديدة</span>
        </button>
      </div>

      {/* Create New Competition Form */}
      {viewMode === 'create' && (
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <h3 className="text-base font-bold mb-4">إنشاء مسابقة قرآنية جديدة</h3>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">اسم المسابقة *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مسابقة بلوغ سورة الزمر"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">الجائزة أو المكافأة</label>
                <input
                  type="text"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="مثال: مصحف فاخر ومكافأة تشجيعية"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">وصف المسابقة أو الهدف منها</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف موجز لشروط المسابقة وهدفها"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
              />
            </div>

            {/* Participant Selection */}
            <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-bold">تحديد المشاركين</label>
                <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-subtle)]">
                  <button
                    type="button"
                    onClick={() => setSelectionMode('group')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      selectionMode === 'group'
                        ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    اختيار فوج كامل
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionMode('manual')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      selectionMode === 'manual'
                        ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    اختيار يدوي (من عدة أفواج)
                  </button>
                </div>
              </div>

              {selectionMode === 'group' ? (
                <select
                  value={effectiveGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setFormError('');
                  }}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm"
                >
                  {groups.length === 0 ? (
                    <option value="">لا توجد أفواج متاحة</option>
                  ) : (
                    groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({activeStudents.filter((s) => s.groupId === g.id).length} طالب)
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeStudents.map((stu) => {
                    const checked = manualStudentIds.includes(stu.id);
                    return (
                      <label
                        key={stu.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                          checked
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] font-bold'
                            : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleManualStudent(stu.id)}
                          className="accent-[var(--accent-primary)]"
                        />
                        <span className="truncate">{stu.fullName}</span>
                        <span className="text-[var(--text-secondary)] mr-auto shrink-0">
                          {groupMap.get(stu.groupId)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Surahs & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SurahSearchSelect
                label="السورة التي يبدأ منها المشاركون"
                value={startSurah}
                onChange={(s) => setStartSurah(s.number)}
              />
              <SurahSearchSelect
                label="السورة المستهدفة"
                value={targetSurah}
                onChange={(s) => setTargetSurah(s.number)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">تاريخ البداية</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">عدد الأيام المخصصة</label>
                <input
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">تاريخ النهاية</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">ملاحظات خاصة بالمسابقة</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
              />
            </div>

            {formError && (
              <div className="p-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('active')}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold"
              >
                اعتماد المسابقة
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Active or Archived Competitions List */}
      {viewMode !== 'create' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(viewMode === 'active' ? activeComps : archivedComps).length === 0 ? (
            <div className="md:col-span-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--text-secondary)]">
              {viewMode === 'active'
                ? 'لا توجد مسابقات جارية حاليًا. أنشئ مسابقة جديدة لبدء التنافس.'
                : 'أرشيف المسابقات فارغ.'}
            </div>
          ) : (
            (viewMode === 'active' ? activeComps : archivedComps).map((comp) => {
              const achieversCount = comp.participants.filter(
                (p) => p.status === 'achieved'
              ).length;
              const remaining =
                getTodayISO() > comp.endDate ? 0 : daysBetween(getTodayISO(), comp.endDate);

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedCompId(comp.id)}
                  className="text-right rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 hover:border-[var(--accent-primary)] transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-10 w-10 rounded-xl bg-[var(--gold-soft)] text-[var(--gold-primary)] flex items-center justify-center shrink-0">
                        <Trophy className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="font-bold text-base text-[var(--text-primary)]">
                          {comp.name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          من سورة {getSurahByNumber(comp.startSurahNumber).name} إلى{' '}
                          {getSurahByNumber(comp.targetSurahNumber).name}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)] pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {comp.participants.length} مشارك
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {achieversCount} حقق الهدف
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="h-3.5 w-3.5" />
                      {comp.archived ? 'مؤرشفة' : `متبقي ${remaining} يوم`}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-[var(--accent-primary)]">
                    فتح تفاصيل المسابقة والنتائج
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
