import React, { useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileDown,
  Printer,
  Share2,
  X,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  AttendanceRecord,
  AttendanceStatus,
  Group,
  RecitationRecord,
  SessionPeriod,
  Student,
} from '../types';
import { getSurahByNumber } from '../data/surahs';
import {
  formatArabicWeekday,
  formatGregorianDate,
  formatHijriDate,
  formatMonthArabic,
  getCurrentMonthISO,
  getTodayISO,
} from '../utils/date';

type ReportScope = 'group-attendance' | 'student-attendance';
type SubTab = 'daily-grid' | 'month-summary';

interface ReportsViewProps {
  groups: Group[];
  students: Student[];
  attendance: AttendanceRecord[];
  recitations: RecitationRecord[];
  mosqueName: string;
  onChangeMosqueName?: (name: string) => void;
  onMarkStudentAttendance?: (
    studentId: string,
    groupId: string,
    date: string,
    period: SessionPeriod,
    status: AttendanceStatus,
    excuseReason?: string
  ) => void;
  onClearStudentAttendance?: (
    studentId: string,
    date: string,
    period: SessionPeriod
  ) => void;
}

function shiftMonthISO(monthISO: string, delta: number): string {
  const [y, m] = monthISO.split('-').map(Number);
  if (!y || !m) return getCurrentMonthISO();
  const d = new Date(y, m - 1 + delta, 15);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  groups,
  students,
  attendance,
  recitations,
  mosqueName,
  onChangeMosqueName,
  onMarkStudentAttendance,
  onClearStudentAttendance,
}) => {
  const activeStudents = useMemo(() => students.filter((s) => !s.archived), [students]);

  const [reportScope, setReportScope] = useState<ReportScope>('group-attendance');
  const [subTab, setSubTab] = useState<SubTab>('daily-grid');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthISO());
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState(activeStudents[0]?.id || '');

  const [editingHeaderSchool, setEditingHeaderSchool] = useState(false);
  const [headerSchoolDraft, setHeaderSchoolDraft] = useState(mosqueName);
  const [exporting, setExporting] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);

  const todayISO = getTodayISO();
  const currentMonthISO = getCurrentMonthISO();

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const groupStudents = useMemo(() => {
    if (!selectedGroup) return activeStudents;
    return activeStudents.filter((s) => s.groupId === selectedGroup.id);
  }, [activeStudents, selectedGroup]);

  const selectedStudent =
    groupStudents.find((s) => s.id === selectedStudentId) ||
    groupStudents[0] ||
    activeStudents[0];

  const schoolTitle = mosqueName.trim() || 'المدرسة القرآنية';

  // Display date for the selected month bar
  const monthRefDateISO =
    selectedMonth === currentMonthISO ? todayISO : `${selectedMonth}-01`;
  const barWeekday = formatArabicWeekday(monthRefDateISO);
  const barGreg = formatGregorianDate(monthRefDateISO);
  const barHijri = formatHijriDate(monthRefDateISO);

  // Days in selectedMonth
  const daysArray = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const totalDays = y && m ? new Date(y, m, 0).getDate() : 30;
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [selectedMonth]);

  // Map: `${studentId}_${day}_${period}` -> AttendanceStatus
  const monthAttMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    attendance.forEach((a) => {
      if (a.date.startsWith(selectedMonth)) {
        const dayNum = Number(a.date.slice(8, 10));
        map.set(`${a.studentId}_${dayNum}_${a.period}`, a.status);
      }
    });
    return map;
  }, [attendance, selectedMonth]);

  // Visible students for the report card
  const reportStudents = useMemo(() => {
    if (reportScope === 'student-attendance') {
      return selectedStudent ? [selectedStudent] : [];
    }
    return groupStudents;
  }, [reportScope, groupStudents, selectedStudent]);

  // End-of-month summary rows
  const monthlySummaryRows = useMemo(() => {
    return reportStudents.map((stu) => {
      const logs = attendance.filter(
        (a) => a.studentId === stu.id && a.date.startsWith(selectedMonth)
      );
      const present = logs.filter((l) => l.status === 'present').length;
      const absent = logs.filter((l) => l.status === 'absent').length;
      const excused = logs.filter((l) => l.status === 'excused').length;
      const total = logs.length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;

      const recs = recitations.filter(
        (r) => r.studentId === stu.id && r.date.startsWith(selectedMonth)
      );
      const hifzCount = recs.filter((r) => r.type === 'hifz').length;
      const murCount = recs.filter((r) => r.type === 'murajaah').length;
      const latestRec = recs[recs.length - 1];
      const latestSurah = latestRec ? getSurahByNumber(latestRec.surahNumber).name : '—';

      return {
        student: stu,
        present,
        absent,
        excused,
        total,
        pct,
        hifzCount,
        murCount,
        latestSurah,
      };
    });
  }, [reportStudents, attendance, recitations, selectedMonth]);

  const handleCycleCellStatus = (
    student: Student,
    dayNum: number,
    period: SessionPeriod
  ) => {
    if (!onMarkStudentAttendance) return;
    const dateISO = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
    const current = monthAttMap.get(`${student.id}_${dayNum}_${period}`);
    const order: (AttendanceStatus | undefined)[] = [
      undefined,
      'present',
      'absent',
      'excused',
    ];
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    const nextStatus = order[nextIdx];

    if (!nextStatus) {
      onClearStudentAttendance?.(student.id, dateISO, period);
    } else {
      onMarkStudentAttendance(student.id, student.groupId, dateISO, period, nextStatus);
    }
  };

  const renderCellMark = (status?: AttendanceStatus) => {
    if (status === 'present') {
      return <span className="text-emerald-700 font-extrabold">✓</span>;
    }
    if (status === 'absent') {
      return <span className="text-red-600 font-extrabold">✗</span>;
    }
    if (status === 'excused') {
      return <span className="text-amber-700 font-extrabold">م</span>;
    }
    return <span className="text-slate-400">—</span>;
  };

  const handleSaveHeaderSchool = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeMosqueName?.(headerSchoolDraft.trim());
    setEditingHeaderSchool(false);
  };

  const buildPdfBlob = async (): Promise<Blob | null> => {
    const node = reportRef.current;
    if (!node) return null;

    const scrollContainer = node.querySelector('[data-report-scroll]') as HTMLElement | null;
    const prevNodeWidth = node.style.width;
    const prevScrollOverflow = scrollContainer?.style.overflowX || '';

    try {
      if (scrollContainer) {
        const fullTableWidth = scrollContainer.scrollWidth;
        if (fullTableWidth > node.clientWidth) {
          scrollContainer.style.overflowX = 'visible';
          node.style.width = `${fullTableWidth + 48}px`;
        }
      }

      const dataUrl = await toPng(node, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } finally {
      if (scrollContainer) {
        scrollContainer.style.overflowX = prevScrollOverflow;
      }
      node.style.width = prevNodeWidth;
    }
  };

  const handleDownloadPDF = async () => {
    setExporting(true);
    setShareMsg('');
    try {
      const blob = await buildPdfBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `تقرير_الحضور_${selectedMonth}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setShareMsg('تم إنشاء وحفظ ملف التقرير PDF بنجاح.');
    } catch {
      setShareMsg('تعذر إنشاء ملف PDF. يمكنك استخدام زر الطباعة كبديل.');
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    setExporting(true);
    setShareMsg('');
    try {
      const blob = await buildPdfBlob();
      const titleLine =
        reportScope === 'group-attendance'
          ? `تقرير الحضور الشهري للفوج: ${selectedGroup?.name || '—'}`
          : `تقرير الحضور الشهري للطالب: ${selectedStudent?.fullName || '—'}`;
      const summary = `${schoolTitle}\n${titleLine}\nالشهر: ${formatMonthArabic(
        selectedMonth
      )}\nالتاريخ الهجري: ${barHijri}\nالتاريخ الميلادي: ${barGreg}`;

      if (blob && typeof navigator !== 'undefined' && 'share' in navigator) {
        const file = new File([blob], `تقرير_${selectedMonth}.pdf`, {
          type: 'application/pdf',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: titleLine,
            text: summary,
            files: [file],
          });
          return;
        }
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
      }
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير_الحضور_${selectedMonth}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      setShareMsg('تم نسخ ملخص التقرير وتنزيل ملف PDF جاهزًا للمشاركة.');
    } catch {
      setShareMsg('تم تجهيز التقرير للمشاركة.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 1. Dynamic Accent Rounded Header */}
      <section className="rounded-3xl accent-header-gradient text-white p-5 shadow-sm no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-xs font-semibold text-white/85">التقارير و PDF</div>

            {editingHeaderSchool ? (
              <form
                onSubmit={handleSaveHeaderSchool}
                className="flex items-center gap-2 pt-1 max-w-md"
              >
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
                <h2 className="text-lg sm:text-xl font-extrabold truncate">{schoolTitle}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderSchoolDraft(mosqueName);
                    setEditingHeaderSchool(true);
                  }}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white shrink-0 transition-colors"
                  title="تعديل اسم المدرسة"
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

      {/* 2. Month & Dual-Calendar Date Selector Bar */}
      <section className="rounded-2xl bg-white border border-[#e3e6e0] px-3 py-2.5 flex items-center justify-between gap-2 shadow-2xs no-print">
        <button
          type="button"
          onClick={() => setSelectedMonth((m) => shiftMonthISO(m, -1))}
          className="h-10 w-10 rounded-xl bg-[#f4f6f2] hover:bg-[#e8ede4] text-[#354424] flex items-center justify-center shrink-0 transition-colors"
          title="الشهر السابق"
          aria-label="الشهر السابق"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center gap-2.5 min-w-0 flex-1 text-center">
          <Calendar className="h-4 w-4 text-[var(--accent-menu)] shrink-0 hidden sm:block" />
          <div className="min-w-0 space-y-0.5">
            <div className="text-xs sm:text-sm font-extrabold text-[#1f2918] truncate">
              {barWeekday}، {barGreg} م
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-[var(--accent-menu)] truncate">
              الموافق لـ {barHijri}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedMonth((m) => shiftMonthISO(m, 1))}
          className="h-10 w-10 rounded-xl bg-[#f4f6f2] hover:bg-[#e8ede4] text-[#354424] flex items-center justify-center shrink-0 transition-colors"
          title="الشهر التالي"
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </section>

      {/* 3. Olive-Green "حفظ تقرير الشهر PDF" & "مشاركة" Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 no-print">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadPDF}
            className="min-h-[44px] px-5 rounded-2xl bg-[var(--accent-menu)] hover:opacity-95 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs disabled:opacity-60 transition-opacity"
          >
            <FileDown className="h-4 w-4" />
            <span>{exporting ? 'جارٍ إنشاء PDF...' : 'حفظ تقرير الشهر PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] px-4 rounded-2xl bg-white border border-[#dfe3dc] hover:bg-[#f4f6f2] text-[#2b3723] text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة</span>
          </button>
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={handleShare}
          className="min-h-[44px] px-4 rounded-2xl bg-white border border-[#dfe3dc] hover:bg-[#f4f6f2] text-[#2b3723] text-xs font-bold inline-flex items-center gap-2 shadow-2xs disabled:opacity-60"
        >
          <Share2 className="h-4 w-4 text-[var(--accent-menu)]" />
          <span>مشاركة</span>
        </button>
      </div>

      {shareMsg && (
        <div className="text-xs font-semibold text-[var(--accent-menu)] no-print">{shareMsg}</div>
      )}

      {/* 4. Report Scope Selector ("تقرير الحضور الشهري للفوج" vs "تقرير الحضور الشهري للطالب") */}
      <div className="grid grid-cols-2 gap-2.5 no-print">
        <button
          type="button"
          onClick={() => setReportScope('group-attendance')}
          className={`min-h-[44px] px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-colors ${
            reportScope === 'group-attendance'
              ? 'bg-[var(--accent-menu-soft)] border-[var(--accent-menu)] text-[var(--accent-menu)] shadow-2xs'
              : 'bg-white border-[#dfe3dc] text-[#455041] hover:bg-[#f4f6f2]'
          }`}
        >
          تقرير الحضور الشهري للفوج
        </button>

        <button
          type="button"
          onClick={() => setReportScope('student-attendance')}
          className={`min-h-[44px] px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-colors ${
            reportScope === 'student-attendance'
              ? 'bg-[var(--accent-menu-soft)] border-[var(--accent-menu)] text-[var(--accent-menu)] shadow-2xs'
              : 'bg-white border-[#dfe3dc] text-[#455041] hover:bg-[#f4f6f2]'
          }`}
        >
          تقرير الحضور الشهري للطالب
        </button>
      </div>

      {/* 5. Horizontal Group Tabs (+ Student picker if student scope active) */}
      <div className="space-y-2.5 no-print">
        {groups.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {groups.map((g) => {
              const active = selectedGroup?.id === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`min-h-[40px] px-4 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-colors ${
                    active
                      ? 'bg-[var(--accent-menu)] text-white border-[var(--accent-menu)] shadow-2xs'
                      : 'bg-white text-[#2f3b27] border-[#dfe3dc] hover:bg-[#f4f6f2]'
                  }`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        )}

        {reportScope === 'student-attendance' && groupStudents.length > 0 && (
          <div>
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full sm:w-80 min-h-[42px] px-3.5 rounded-xl border border-[#dfe3dc] bg-white text-xs sm:text-sm font-bold text-[#1f2918]"
            >
              {groupStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 6. Sub-tabs: "الجدول الشهري (كل الأيام)" (accent underline) & "ملخص نهاية الشهر" */}
      <div className="flex items-center gap-6 border-b border-[#dfe3dc] px-1 no-print">
        <button
          type="button"
          onClick={() => setSubTab('daily-grid')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-colors border-b-2 -mb-px ${
            subTab === 'daily-grid'
              ? 'border-[var(--accent-menu)] text-[var(--accent-menu)]'
              : 'border-transparent text-[#6a7365] hover:text-[#1f2918]'
          }`}
        >
          الجدول الشهري (كل الأيام)
        </button>

        <button
          type="button"
          onClick={() => setSubTab('month-summary')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-colors border-b-2 -mb-px ${
            subTab === 'month-summary'
              ? 'border-[var(--accent-menu)] text-[var(--accent-menu)]'
              : 'border-transparent text-[#6a7365] hover:text-[#1f2918]'
          }`}
        >
          ملخص نهاية الشهر
        </button>
      </div>

      {/* 7. Bottom Printable/Exportable Report Card */}
      <section
        ref={reportRef}
        dir="rtl"
        className="rounded-2xl bg-white border border-[#dfe3dc] p-4 sm:p-6 shadow-2xs space-y-4"
      >
        {/* Report Card Title + Dual Dates + Symbol Legend */}
        <div className="space-y-2 border-b border-[#e5e8e1] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-[#2b3819]">
              {schoolTitle} •{' '}
              {reportScope === 'group-attendance'
                ? `تقرير الحضور الشهري للفوج: ${selectedGroup?.name || 'غير محدد'}`
                : `تقرير الحضور الشهري للطالب: ${selectedStudent?.fullName || 'غير محدد'}`}
            </h3>
            <span className="text-xs font-bold text-[var(--accent-menu)]">
              {formatMonthArabic(selectedMonth)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#545f50]">
            <span>
              <strong>التاريخ الميلادي:</strong> {barGreg} م
            </span>
            <span>
              <strong>الموافق للهجري:</strong> {barHijri}
            </span>
          </div>

          {subTab === 'daily-grid' && (
            <div className="rounded-xl bg-[#f6f8f4] border border-[#e2e7dc] px-3 py-2 text-[11px] sm:text-xs font-semibold text-[#3c4836]">
              السطر العلوي = صباحي | السطر السفلي = مسائي |{' '}
              <span className="text-emerald-700 font-bold">✓ حاضر</span> |{' '}
              <span className="text-red-600 font-bold">✗ غائب</span> |{' '}
              <span className="text-amber-700 font-bold">م مستأذن</span> | اضغط على أي خانة للتعديل
            </div>
          )}
        </div>

        {/* Report Body */}
        {reportStudents.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#616b5b]">
            لا يوجد طلبة لعرض التقرير في هذا الفوج بعد. أضف طلبة من قسم التسجيلات أولًا.
          </div>
        ) : subTab === 'daily-grid' ? (
          <div data-report-scroll className="overflow-x-auto border border-[#e3e6e0] rounded-xl">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-[#f4f6f2] text-[#2b3819] border-b border-[#dfe3dc]">
                  <th className="sticky right-0 z-10 bg-[#f4f6f2] py-2.5 px-3 text-right font-extrabold min-w-[140px] border-l border-[#dfe3dc]">
                    الطالب
                  </th>
                  {daysArray.map((dayNum) => (
                    <th
                      key={dayNum}
                      className="py-2 px-2 font-mono-num font-bold min-w-[42px] border-l border-[#eceee9]"
                    >
                      {dayNum}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ebe5]">
                {reportStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-[#fafbf9]">
                    <td className="sticky right-0 z-10 bg-white py-2 px-3 text-right font-bold text-[#1f2918] border-l border-[#dfe3dc] whitespace-nowrap">
                      {stu.fullName}
                    </td>
                    {daysArray.map((dayNum) => {
                      const morningStatus = monthAttMap.get(`${stu.id}_${dayNum}_morning`);
                      const eveningStatus = monthAttMap.get(`${stu.id}_${dayNum}_evening`);
                      return (
                        <td
                          key={dayNum}
                          className="p-0 border-l border-[#eceee9] align-middle"
                        >
                          <div className="flex flex-col divide-y divide-[#eceee9] min-w-[42px]">
                            <button
                              type="button"
                              onClick={() => handleCycleCellStatus(stu, dayNum, 'morning')}
                              className="h-6 w-full flex items-center justify-center hover:bg-[#eef3e6] transition-colors text-[11px]"
                              title={`${stu.fullName} - يوم ${dayNum} (صباحي)`}
                            >
                              {renderCellMark(morningStatus)}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCycleCellStatus(stu, dayNum, 'evening')}
                              className="h-6 w-full flex items-center justify-center hover:bg-[#eef3e6] transition-colors text-[11px]"
                              title={`${stu.fullName} - يوم ${dayNum} (مسائي)`}
                            >
                              {renderCellMark(eveningStatus)}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* End-of-Month Summary Table */
          <div data-report-scroll className="overflow-x-auto border border-[#e3e6e0] rounded-xl">
            <table className="w-full text-xs sm:text-sm text-right border-collapse">
              <thead>
                <tr className="bg-[#f4f6f2] text-[#2b3819] border-b border-[#dfe3dc]">
                  <th className="py-2.5 px-3 font-extrabold">الطالب</th>
                  <th className="py-2.5 px-3 font-bold text-center">حضور (✓)</th>
                  <th className="py-2.5 px-3 font-bold text-center">غياب (✗)</th>
                  <th className="py-2.5 px-3 font-bold text-center">مستأذن (م)</th>
                  <th className="py-2.5 px-3 font-bold text-center">نسبة المواظبة</th>
                  <th className="py-2.5 px-3 font-bold text-center">الحفظ / المراجعة</th>
                  <th className="py-2.5 px-3 font-bold">آخر سورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ebe5]">
                {monthlySummaryRows.map((row) => (
                  <tr key={row.student.id}>
                    <td className="py-2.5 px-3 font-bold text-[#1f2918]">
                      {row.student.fullName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono-num font-bold text-emerald-700">
                      {row.present}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono-num font-bold text-red-600">
                      {row.absent}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono-num font-bold text-amber-700">
                      {row.excused}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono-num font-bold text-[#556b2f]">
                      {row.pct}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono-num text-[#1f2918]">
                      {row.hifzCount} / {row.murCount}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-[#4f594b]">
                      {row.latestSurah}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
