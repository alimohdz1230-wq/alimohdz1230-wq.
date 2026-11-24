import React, { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  UserPlus,
  Search,
  Edit3,
  Trash2,
  Archive,
  RotateCcw,
  Check,
  X,
  QrCode,
  Download,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Plus,
  LayoutGrid,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  Group,
  SessionPeriod,
  Student,
} from '../types';
import {
  addDaysISO,
  formatArabicWeekday,
  formatGregorianDate,
  formatHijriDate,
  getTodayISO,
} from '../utils/date';
import { StudentCard } from './StudentCard';

interface RegistrationsViewProps {
  groups: Group[];
  students: Student[];
  attendance: AttendanceRecord[];
  mosqueName: string;
  onChangeMosqueName: (name: string) => void;
  onAddStudent: (input: {
    groupName: string;
    fullName: string;
    guardianName: string;
    guardianPhone: string;
    notes: string;
  }) => { student: Student; groupName: string } | void;
  onUpdateStudent: (student: Student, targetGroupName?: string) => void;
  onToggleArchiveStudent: (studentId: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onMarkStudentAttendance: (
    studentId: string,
    groupId: string,
    date: string,
    period: SessionPeriod,
    status: AttendanceStatus,
    excuseReason?: string
  ) => void;
  onMarkBatchAttendance: (
    studentIds: { studentId: string; groupId: string }[],
    date: string,
    period: SessionPeriod,
    status: AttendanceStatus
  ) => void;
  onOpenQRCards?: () => void;
}

export const RegistrationsView: React.FC<RegistrationsViewProps> = ({
  groups,
  students,
  attendance,
  mosqueName,
  onChangeMosqueName,
  onAddStudent,
  onUpdateStudent,
  onToggleArchiveStudent,
  onDeleteStudent,
  onMarkStudentAttendance,
  onMarkBatchAttendance,
  onOpenQRCards,
}) => {
  const todayISO = getTodayISO();
  const [selectedDate, setSelectedDate] = useState(todayISO);

  // Header school editing
  const [editingHeaderSchool, setEditingHeaderSchool] = useState(false);
  const [headerSchoolDraft, setHeaderSchoolDraft] = useState(mosqueName);

  // Search, "خاناتي" options & Group tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showMyPanelsMenu, setShowMyPanelsMenu] = useState(false);

  // Add Student Modal (+ FAB)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState(groups[0]?.name || '');
  const [fullName, setFullName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Instant Created Card & Row Card Modal
  const [justCreatedCard, setJustCreatedCard] = useState<{
    student: Student;
    groupName: string;
  } | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const createdCardRef = useRef<HTMLDivElement | null>(null);
  const modalCardRef = useRef<HTMLDivElement | null>(null);

  // Edit & Delete Student Modal / Confirmation
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Batch feedback notice
  const [batchNotice, setBatchNotice] = useState('');

  const groupMap = useMemo(() => {
    const map = new Map<string, Group>();
    groups.forEach((g) => map.set(g.id, g));
    return map;
  }, [groups]);

  const activeStudents = useMemo(() => students.filter((s) => !s.archived), [students]);
  const archivedStudents = useMemo(() => students.filter((s) => s.archived), [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students
      .filter((s) => (showArchived ? s.archived : !s.archived))
      .filter((s) => (filterGroupId === 'all' ? true : s.groupId === filterGroupId))
      .filter((s) => {
        if (!q) return true;
        const gName = groupMap.get(s.groupId)?.name || '';
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.guardianName.toLowerCase().includes(q) ||
          s.guardianPhone.includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          gName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [students, showArchived, filterGroupId, searchQuery, groupMap]);

  // Quick attendance lookup map for selectedDate
  const dayAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance.forEach((rec) => {
      if (rec.date === selectedDate) {
        map.set(`${rec.studentId}_${rec.period}`, rec);
      }
    });
    return map;
  }, [attendance, selectedDate]);

  const handleSaveHeaderSchool = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeMosqueName(headerSchoolDraft.trim());
    setEditingHeaderSchool(false);
  };

  const handleSubmitNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !groupNameInput.trim()) {
      setFormError('يرجى إدخال اسم الفوج واسم الطالب الكامل.');
      return;
    }
    const created = onAddStudent({
      groupName: groupNameInput.trim(),
      fullName: fullName.trim(),
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      notes: notes.trim(),
    });
    if (created) {
      setJustCreatedCard(created);
    }
    setFullName('');
    setGuardianName('');
    setGuardianPhone('');
    setNotes('');
    setFormError('');
    setAddModalOpen(false);
  };

  const handleDownloadCard = async (node: HTMLDivElement | null, student: Student) => {
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `بطاقة_${student.studentCode}_${student.fullName}.png`;
      a.click();
    } catch {
      setBatchNotice('تعذر حفظ صورة البطاقة. يرجى المحاولة مرة أخرى.');
      setTimeout(() => setBatchNotice(''), 3500);
    }
  };

  const startEdit = (student: Student) => {
    setEditingStudent({ ...student });
    setEditGroupName(groupMap.get(student.groupId)?.name || '');
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.fullName.trim() || !editGroupName.trim()) return;
    onUpdateStudent(editingStudent, editGroupName.trim());
    setEditingStudent(null);
  };

  const handleBatchPresent = (period: SessionPeriod) => {
    const targets = filteredStudents
      .filter((s) => !s.archived)
      .map((s) => ({ studentId: s.id, groupId: s.groupId }));
    if (targets.length === 0) return;
    onMarkBatchAttendance(targets, selectedDate, period, 'present');
    setBatchNotice(
      `تم تحضير جميع الطلبة الظاهرين (${targets.length}) في الفترة ${
        period === 'morning' ? 'الصباحية' : 'المسائية'
      }.`
    );
    setTimeout(() => setBatchNotice(''), 3000);
  };

  const renderStatusButtons = (student: Student, period: SessionPeriod) => {
    const rec = dayAttendanceMap.get(`${student.id}_${period}`);
    const currentStatus = rec?.status;

    const buttons: {
      status: AttendanceStatus;
      label: string;
      activeClass: string;
    }[] = [
      {
        status: 'present',
        label: 'حضور',
        activeClass:
          'bg-[var(--accent-menu)] text-white border-[var(--accent-menu)] shadow-xs',
      },
      {
        status: 'absent',
        label: 'غياب',
        activeClass: 'bg-red-600 text-white border-red-600 shadow-xs',
      },
      {
        status: 'excused',
        label: 'عذر',
        activeClass: 'bg-amber-600 text-white border-amber-600 shadow-xs',
      },
    ];

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3f4a3c] shrink-0 min-w-[68px]">
            {period === 'morning' ? (
              <Sun className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-700" />
            )}
            <span>{period === 'morning' ? 'صباحي' : 'مسائي'}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {buttons.map((b) => {
              const active = currentStatus === b.status;
              return (
                <button
                  key={b.status}
                  type="button"
                  onClick={() =>
                    onMarkStudentAttendance(
                      student.id,
                      student.groupId,
                      selectedDate,
                      period,
                      b.status,
                      rec?.excuseReason
                    )
                  }
                  className={`min-h-[34px] px-2 rounded-lg text-xs font-bold border transition-colors ${
                    active
                      ? b.activeClass
                      : 'bg-white border-[#dde2da] text-[#3a4238] hover:bg-[#f2f4ef]'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {currentStatus === 'excused' && (
          <input
            type="text"
            value={rec?.excuseReason || ''}
            onChange={(e) =>
              onMarkStudentAttendance(
                student.id,
                student.groupId,
                selectedDate,
                period,
                'excused',
                e.target.value
              )
            }
            placeholder="سبب العذر..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/70 text-[11px] text-[#2c332b] focus:outline-none"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto">
      {/* 1. Dynamic Accent Rounded Header */}
      <section className="rounded-3xl accent-header-gradient text-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-xs font-semibold text-white/85">
              شؤون الطلاب • {activeStudents.length} طالب · {groups.length} أفواج
            </div>

            {editingHeaderSchool ? (
              <form onSubmit={handleSaveHeaderSchool} className="flex items-center gap-2 pt-1 max-w-md">
                <input
                  type="text"
                  value={headerSchoolDraft}
                  onChange={(e) => setHeaderSchoolDraft(e.target.value)}
                  placeholder="اكتب اسم المدرسة القرآنية..."
                  className="flex-1 min-h-[40px] px-3 rounded-xl bg-white/95 text-[#1f2918] text-sm font-bold focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="min-h-[40px] px-3.5 rounded-xl bg-[#a67c52] hover:bg-[#936a43] text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>حفظ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingHeaderSchool(false)}
                  className="min-h-[40px] px-2.5 rounded-xl bg-white/15 text-white text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold truncate">
                  {mosqueName.trim() || 'حلقات تحفيظ القرآن الكريم'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderSchoolDraft(mosqueName);
                    setEditingHeaderSchool(true);
                  }}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white shrink-0 transition-colors"
                  title="تعديل اسم المدرسة"
                  aria-label="تعديل اسم المدرسة"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setHeaderSchoolDraft(mosqueName);
              setEditingHeaderSchool(true);
            }}
            className="min-h-[40px] px-4 rounded-xl bg-[#e07a22] hover:bg-[#c86817] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs shrink-0 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>تعديل</span>
          </button>
        </div>
      </section>

      {/* 2. Day Navigation Strip (Weekday + Gregorian + Corresponding Hijri Date) */}
      <section className="rounded-2xl bg-white border border-[#e3e6e0] px-3 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setSelectedDate((d) => addDaysISO(d, -1))}
          className="h-10 w-10 rounded-xl bg-[#f4f6f2] hover:bg-[#e8ede4] text-[#354424] flex items-center justify-center shrink-0 transition-colors"
          title="اليوم السابق"
          aria-label="اليوم السابق"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="text-center min-w-0 flex-1 space-y-0.5">
          <div className="text-xs sm:text-sm font-extrabold text-[#1f2918] truncate">
            {formatArabicWeekday(selectedDate)}، {formatGregorianDate(selectedDate)} م
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-[var(--accent-menu)] truncate">
            الموافق لـ {formatHijriDate(selectedDate)}
            {selectedDate !== todayISO && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayISO)}
                className="mr-2 underline text-[#a67c52] font-bold"
              >
                (العودة لليوم)
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedDate((d) => addDaysISO(d, 1))}
          className="h-10 w-10 rounded-xl bg-[#f4f6f2] hover:bg-[#e8ede4] text-[#354424] flex items-center justify-center shrink-0 transition-colors"
          title="اليوم التالي"
          aria-label="اليوم التالي"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </section>

      {/* 3. Search Row ("ابحث عن طالب...") + "خاناتي" Button */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#6d7668] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن طالب..."
            className="w-full min-h-[44px] pr-10 pl-3.5 rounded-2xl border border-[#dfe3dc] bg-white text-sm text-[#1f2918] placeholder:text-[#7c8577] focus:outline-none focus:border-[#556b2f]"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowMyPanelsMenu((v) => !v)}
          className={`min-h-[44px] px-4 rounded-2xl border text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors ${
            showMyPanelsMenu || showArchived
              ? 'bg-[var(--accent-menu)] text-white border-[var(--accent-menu)]'
              : 'bg-white text-[#2f3b27] border-[#dfe3dc] hover:bg-[#f4f6f2]'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>خاناتي</span>
        </button>
      </div>

      {/* Expandable "خاناتي" Quick Menu */}
      {showMyPanelsMenu && (
        <div className="rounded-2xl bg-white border border-[#dfe3dc] p-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                !showArchived
                  ? 'bg-[var(--accent-menu)] text-white'
                  : 'bg-[#f4f6f2] text-[#3a4238] hover:bg-[#e8ede4]'
              }`}
            >
              الطلبة النشطون ({activeStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                showArchived
                  ? 'bg-[#a67c52] text-white'
                  : 'bg-[#f4f6f2] text-[#3a4238] hover:bg-[#e8ede4]'
              }`}
            >
              الأرشيف ({archivedStudents.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setGroupNameInput(groups[0]?.name || '');
              setAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[var(--accent-menu-soft)] text-[var(--accent-menu)] text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>تسجيل طالب جديد</span>
          </button>
        </div>
      )}

      {/* 4. Horizontal Scrollable Group Tabs ("الكل (N)" + each group tab) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterGroupId('all')}
          className={`min-h-[40px] px-4 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-colors ${
            filterGroupId === 'all'
              ? 'bg-[var(--accent-menu)] text-white border-[var(--accent-menu)] shadow-xs'
              : 'bg-white text-[#2f3b27] border-[#dfe3dc] hover:bg-[#f4f6f2]'
          }`}
        >
          الكل ({activeStudents.length})
        </button>

        {groups.map((g) => {
          const count = activeStudents.filter((s) => s.groupId === g.id).length;
          const active = filterGroupId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setFilterGroupId(g.id)}
              className={`min-h-[40px] px-4 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-colors ${
                active
                  ? 'bg-[var(--accent-menu)] text-white border-[var(--accent-menu)] shadow-xs'
                  : 'bg-white text-[#2f3b27] border-[#dfe3dc] hover:bg-[#f4f6f2]'
              }`}
            >
              {g.name} ({count})
            </button>
          );
        })}
      </div>

      {/* 5. Batch Morning & Evening Attendance Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleBatchPresent('morning')}
          disabled={filteredStudents.length === 0 || showArchived}
          className="min-h-[44px] px-3 rounded-2xl bg-white border border-[#dfe3dc] hover:border-[#556b2f] text-[#2b3723] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50 transition-colors"
        >
          <Sun className="h-4 w-4 text-amber-600 shrink-0" />
          <span>تحضير الكل صباحي</span>
        </button>

        <button
          type="button"
          onClick={() => handleBatchPresent('evening')}
          disabled={filteredStudents.length === 0 || showArchived}
          className="min-h-[44px] px-3 rounded-2xl bg-white border border-[#dfe3dc] hover:border-[#556b2f] text-[#2b3723] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50 transition-colors"
        >
          <Moon className="h-4 w-4 text-indigo-700 shrink-0" />
          <span>تحضير الكل مسائي</span>
        </button>
      </div>

      {batchNotice && (
        <div className="rounded-xl border border-[#556b2f]/35 bg-[#eef3e6] px-4 py-2.5 text-xs font-bold text-[#3c4f1d]">
          {batchNotice}
        </div>
      )}

      {/* Instant Student Card Preview Immediately After Adding */}
      {justCreatedCard && (
        <section className="rounded-2xl border border-[#556b2f]/40 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#1f2918]">
                تم تسجيل الطالب وإصدار بطاقته مباشرة
              </h3>
              <p className="text-xs text-[#616b5b]">
                رمز QR فريد خاص بالطالب ({justCreatedCard.student.studentCode})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleDownloadCard(createdCardRef.current, justCreatedCard.student)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dfe3dc] text-[#2b3723] text-xs font-semibold hover:bg-[#f4f6f2]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>حفظ البطاقة</span>
              </button>
              {onOpenQRCards && (
                <button
                  type="button"
                  onClick={onOpenQRCards}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-menu)] text-white text-xs font-bold"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>قسم البطاقات</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setJustCreatedCard(null)}
                className="p-1.5 rounded-lg hover:bg-[#f4f6f2] text-[#616b5b]"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <StudentCard
            student={justCreatedCard.student}
            groupName={justCreatedCard.groupName}
            mosqueName={mosqueName}
            cardRef={(el) => {
              createdCardRef.current = el;
            }}
          />
        </section>
      )}

      {/* 6. Center Student Cards with Inner Morning/Evening Attendance Box */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-[#dfe3dc] bg-white p-10 text-center space-y-3">
          <div className="text-sm font-semibold text-[#5b6557]">
            {showArchived
              ? 'لا يوجد طلبة في الأرشيف حاليًا.'
              : 'لا يوجد طلبة مسجلون بعد. اضغط على زر (+) في الأسفل لتسجيل طالب جديد.'}
          </div>
          {!showArchived && (
            <button
              type="button"
              onClick={() => {
                setGroupNameInput(groups[0]?.name || '');
                setAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 min-h-[42px] px-5 rounded-xl bg-[var(--accent-menu)] text-white text-xs font-bold hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>تسجيل طالب جديد</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredStudents.map((student) => {
            const gName = groupMap.get(student.groupId)?.name || 'غير محدد';

            return (
              <div
                key={student.id}
                className="rounded-2xl border border-[#dfe3dc] bg-white p-4 space-y-3 shadow-2xs"
              >
                {/* Student Card Header: Name + Group/Guardian (Right) & Edit/Delete Icons (Left) */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-base font-extrabold text-[#1b2416] truncate">
                      {student.fullName}
                    </div>
                    <div className="text-xs font-semibold text-[#5c6857] flex flex-wrap items-center gap-1.5">
                      <span className="text-[var(--accent-menu)]">{gName}</span>
                      <span>•</span>
                      <span>الولي: {student.guardianName || '—'}</span>
                      {student.guardianPhone && (
                        <>
                          <span>•</span>
                          <span className="font-mono-num" dir="ltr">
                            {student.guardianPhone}
                          </span>
                        </>
                      )}
                    </div>
                    {student.notes && (
                      <div className="text-[11px] text-[#707b6b] truncate">
                        ملاحظات: {student.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Icons on Left: QR Card + Edit + Red Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewStudent(student)}
                      className="h-9 w-9 rounded-xl bg-[var(--accent-menu-soft)] hover:opacity-90 text-[var(--accent-menu)] flex items-center justify-center transition-colors"
                      title="عرض بطاقة الطالب ورمز QR"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(student)}
                      className="h-9 w-9 rounded-xl bg-[#f4f6f2] hover:bg-[#e8ede4] text-[#3d4739] flex items-center justify-center transition-colors"
                      title="تعديل بيانات الطالب"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {confirmDeleteId === student.id ? (
                      <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteStudent(student.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-xs font-bold text-red-600 px-1"
                        >
                          تأكيد
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-[#5c6857] px-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(student.id)}
                        className="h-9 w-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
                        title="حذف الطالب"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inner Attendance Box: Morning ("صباحي") & Evening ("مسائي") */}
                {!student.archived && (
                  <div className="rounded-xl border border-[#e6eae2] bg-[#f8f9f6] p-3 space-y-2.5">
                    {renderStatusButtons(student, 'morning')}
                    <div className="border-t border-[#e6eae2]" />
                    {renderStatusButtons(student, 'evening')}
                  </div>
                )}

                {student.archived && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onToggleArchiveStudent(student.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>استعادة من الأرشيف</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Accent Floating Action Button (+) Bottom-Left */}
      <button
        type="button"
        onClick={() => {
          setGroupNameInput(
            filterGroupId !== 'all'
              ? groupMap.get(filterGroupId)?.name || ''
              : groups[0]?.name || ''
          );
          setFormError('');
          setAddModalOpen(true);
        }}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-6 z-40 h-14 w-14 rounded-full bg-[var(--accent-menu)] hover:opacity-95 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 no-print"
        title="تسجيل طالب جديد"
        aria-label="إضافة طالب جديد"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* Add New Student Modal */}
      {addModalOpen && (
        <div className="fixed safe-modal-overlay z-50 flex items-center justify-center bg-black/55 p-4 no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#dfe3dc] p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#1b2416]">تسجيل طالب جديد</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-2 rounded-lg text-[#455041] hover:bg-[#f4f6f2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#354424] mb-1">اسم الفوج *</label>
                <input
                  type="text"
                  list="groups-datalist-modal"
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  placeholder="اختر فوجًا أو اكتب اسم فوج جديد"
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416] placeholder:text-[#6d7668] focus:outline-none focus:border-[#556b2f]"
                  required
                />
                <datalist id="groups-datalist-modal">
                  {groups.map((g) => (
                    <option key={g.id} value={g.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#354424] mb-1">
                  اسم الطالب الكامل *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم واللقب"
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416] placeholder:text-[#6d7668] focus:outline-none focus:border-[#556b2f]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#354424] mb-1">اسم الولي</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="اسم ولي الأمر"
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416] placeholder:text-[#6d7668] focus:outline-none focus:border-[#556b2f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#354424] mb-1">
                    رقم هاتف الولي
                  </label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416] placeholder:text-[#6d7668] font-mono-num focus:outline-none focus:border-[#556b2f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#354424] mb-1">الملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات تربوية أو مستوى الحفظ"
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416] placeholder:text-[#6d7668] focus:outline-none focus:border-[#556b2f]"
                />
              </div>

              {formError && <div className="text-xs font-bold text-red-600">{formError}</div>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-[#dfe3dc] text-[#2b3723] text-xs font-bold hover:bg-[#f4f6f2]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-xl bg-[#556b2f] hover:bg-[#465926] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>تسجيل وإصدار البطاقة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed safe-modal-overlay z-50 flex items-center justify-center bg-black/55 p-4 no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#dfe3dc] p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#1b2416]">تعديل بيانات الطالب</h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-2 rounded-lg text-[#455041] hover:bg-[#f4f6f2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#354424] mb-1">اسم الفوج *</label>
                <input
                  type="text"
                  list="groups-datalist-edit"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416]"
                  required
                />
                <datalist id="groups-datalist-edit">
                  {groups.map((g) => (
                    <option key={g.id} value={g.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#354424] mb-1">
                  اسم الطالب الكامل *
                </label>
                <input
                  type="text"
                  value={editingStudent.fullName}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, fullName: e.target.value })
                  }
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#354424] mb-1">اسم الولي</label>
                  <input
                    type="text"
                    value={editingStudent.guardianName}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, guardianName: e.target.value })
                    }
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#354424] mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={editingStudent.guardianPhone}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })
                    }
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416] font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#354424] mb-1">الملاحظات</label>
                <input
                  type="text"
                  value={editingStudent.notes}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, notes: e.target.value })
                  }
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-[#f8f9f6] text-sm text-[#1b2416]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onToggleArchiveStudent(editingStudent.id);
                    setEditingStudent(null);
                  }}
                  className="min-h-[40px] px-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>{editingStudent.archived ? 'استعادة من الأرشيف' : 'أرشفة الطالب'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="min-h-[40px] px-4 rounded-xl border border-[#dfe3dc] text-[#2b3723] text-xs font-bold hover:bg-[#f4f6f2]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-5 rounded-xl bg-[#556b2f] text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Student Card Modal */}
      {previewStudent && (
        <div className="fixed safe-modal-overlay z-50 flex items-center justify-center bg-black/60 p-4 no-print">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#dfe3dc] p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-[#1b2416]">
                بطاقة الطالب: {previewStudent.fullName}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadCard(modalCardRef.current, previewStudent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dfe3dc] text-[#2b3723] text-xs font-semibold hover:bg-[#f4f6f2]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>حفظ كصورة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewStudent(null)}
                  className="p-2 rounded-lg text-[#455041] hover:bg-[#f4f6f2]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <StudentCard
              student={previewStudent}
              groupName={groupMap.get(previewStudent.groupId)?.name || 'غير محدد'}
              mosqueName={mosqueName}
              cardRef={(el) => {
                modalCardRef.current = el;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
