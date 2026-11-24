import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  User,
  Users,
  Phone,
  NotebookPen,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { Student } from '../types';

export function buildStudentQRPayload(
  student: Student,
  groupName: string,
  mosqueName?: string
): string {
  return JSON.stringify({
    app: 'HALAQAH',
    id: student.id,
    code: student.studentCode,
    name: student.fullName,
    group: groupName,
    guardian: student.guardianName,
    phone: student.guardianPhone,
    notes: student.notes,
    school: (mosqueName || '').trim(),
  });
}

interface StudentCardProps {
  student: Student;
  groupName: string;
  mosqueName: string;
  cardRef?: (el: HTMLDivElement | null) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  groupName,
  mosqueName,
  cardRef,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const patternId = `islamic_lattice_${student.id}`;
  const topGradId = `emerald_top_grad_${student.id}`;
  const botGradId = `emerald_bot_grad_${student.id}`;
  const wingGradId = `emerald_wing_grad_${student.id}`;

  useEffect(() => {
    let cancelled = false;
    const payload = buildStudentQRPayload(student, groupName, mosqueName);
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#063d2d', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [
    student.id,
    student.studentCode,
    student.fullName,
    student.guardianName,
    student.guardianPhone,
    student.notes,
    groupName,
    mosqueName,
  ]);

  return (
    <div
      ref={cardRef}
      dir="rtl"
      className="relative w-full max-w-[520px] mx-auto aspect-[1.6/1] flex flex-col justify-between rounded-[18px] sm:rounded-[22px] overflow-hidden border border-[#e3d9c3] bg-[#faf4e8] text-[#172822] shadow-md select-none"
    >
      {/* Subtle Islamic Geometric Lattice Background */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.065]"
      >
        <defs>
          <pattern
            id={patternId}
            width="38"
            height="38"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M19 0 L38 19 L19 38 L0 19 Z"
              fill="none"
              stroke="#9b7b3e"
              strokeWidth="0.9"
            />
            <circle
              cx="19"
              cy="19"
              r="6"
              fill="none"
              stroke="#9b7b3e"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Top Dark Emerald Curved Banner */}
      <div className="relative h-12 sm:h-16 shrink-0 overflow-hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 600 90"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id={topGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#095e47" />
              <stop offset="55%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#043729" />
            </linearGradient>
          </defs>
          <path d="M140,0 C190,54 335,76 600,86 L600,0 Z" fill="#c89e3c" />
          <path d="M154,0 C202,48 345,68 600,79 L600,0 Z" fill={`url(#${topGradId})`} />
        </svg>

        <div className="relative z-10 h-full flex items-center gap-2 sm:gap-3 px-4 sm:px-5 pb-1">
          <svg
            viewBox="0 0 64 56"
            className="h-7 w-8 sm:h-9 sm:w-10 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M8,12 C18,6 27,8 32,15 C37,8 46,6 56,12 L53,34 C44,29 36,30 32,36 C28,30 20,29 11,34 Z"
              fill="#ffffff"
              stroke="#d4af37"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <line
              x1="32"
              y1="15"
              x2="32"
              y2="36"
              stroke="#c89e3c"
              strokeWidth="2.5"
            />
            <path
              d="M18,48 L36,33 M46,48 L28,33"
              stroke="#d4af37"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          <div className="h-6 sm:h-8 w-[1.5px] bg-[#d4af37]/85 rounded-full shrink-0" />

          <div className="text-right leading-tight">
            <div className="text-xs sm:text-base font-extrabold text-white">
              بطاقة طالب
            </div>
            <div className="text-[9px] sm:text-[11px] text-[#f2dfaa] font-medium">
              حلقات تحفيظ القرآن الكريم
            </div>
          </div>
        </div>
      </div>

      {/* Compact Horizontal Body: Details (Right) & QR Code (Left) */}
      <div className="relative z-10 flex-1 min-h-0 px-3.5 sm:px-5 py-1 flex flex-row items-center justify-between gap-3 sm:gap-5">
        {/* Right Side: Name, Group, Phone, Notes */}
        <div className="flex-1 min-w-0 divide-y divide-[#c89e3c]/40">
          {/* Student Name */}
          <div className="py-1 sm:py-1.5 flex items-center gap-2 sm:gap-2.5">
            <span className="h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-[#08634a] to-[#043d2e] text-white flex items-center justify-center shrink-0 ring-1 ring-[#c89e3c]/35">
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
            <div className="min-w-0 truncate text-[11px] sm:text-sm font-extrabold text-[#12261e]">
              {student.fullName}
            </div>
          </div>

          {/* Group */}
          <div className="py-1 sm:py-1.5 flex items-center gap-2 sm:gap-2.5">
            <span className="h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-[#08634a] to-[#043d2e] text-white flex items-center justify-center shrink-0 ring-1 ring-[#c89e3c]/35">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
            <div className="min-w-0 truncate text-[10px] sm:text-xs font-bold text-[#1b332a]">
              الفوج : {groupName || 'غير محدد'}
            </div>
          </div>

          {/* Phone */}
          <div className="py-1 sm:py-1.5 flex items-center gap-2 sm:gap-2.5">
            <span className="h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-[#08634a] to-[#043d2e] text-white flex items-center justify-center shrink-0 ring-1 ring-[#c89e3c]/35">
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
            <div className="min-w-0 truncate text-[10px] sm:text-xs font-bold text-[#1b332a]">
              <span>رقم الهاتف : </span>
              <span className="font-mono-num" dir="ltr">
                {student.guardianPhone || '—'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="py-1 sm:py-1.5 flex items-center gap-2 sm:gap-2.5">
            <span className="h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-[#08634a] to-[#043d2e] text-white flex items-center justify-center shrink-0 ring-1 ring-[#c89e3c]/35">
              <NotebookPen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
            <div className="min-w-0 truncate text-[9.5px] sm:text-[11px] font-semibold text-[#233f34]">
              ملاحظات : {student.notes || '—'}
            </div>
          </div>
        </div>

        {/* Left Side: Compact Square QR + Scan Pill */}
        <div className="shrink-0 flex flex-col items-center justify-center gap-1 sm:gap-1.5">
          <div className="p-1.5 sm:p-2 rounded-[14px] sm:rounded-[16px] border-2 border-[#c89e3c] bg-gradient-to-br from-white via-[#fffdf8] to-[#f8eed6] shadow-xs">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`رمز QR للطالب ${student.fullName}`}
                className="h-[76px] w-[76px] sm:h-[116px] sm:w-[116px] block rounded"
              />
            ) : (
              <div className="h-[76px] w-[76px] sm:h-[116px] sm:w-[116px] flex items-center justify-center">
                <QrCode className="h-7 w-7 sm:h-9 sm:w-9 text-[#064e3b]" />
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-[#043d2e] to-[#06553f] text-white text-[8.5px] sm:text-[10px] font-bold shadow-xs border border-[#c89e3c]/40 whitespace-nowrap">
            <ScanLine className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#f0cf72]" />
            <span>امسح الرمز لتسجيل الحضور</span>
          </div>
        </div>
      </div>

      {/* Bottom Dark Emerald Curved Footer */}
      <div className="relative h-8 sm:h-10 shrink-0 overflow-hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 600 50"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id={botGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#043729" />
              <stop offset="50%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#095e47" />
            </linearGradient>
            <linearGradient id={wingGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#032d21" />
              <stop offset="100%" stopColor="#054534" />
            </linearGradient>
          </defs>
          <path d="M0,37 C190,38 390,8 600,3 L600,50 L0,50 Z" fill="#c89e3c" />
          <path d="M0,41 C195,41 395,13 600,9 L600,50 L0,50 Z" fill={`url(#${botGradId})`} />
          <path d="M0,0 C75,21 145,40 215,50 L0,50 Z" fill="#c89e3c" />
          <path d="M0,5 C72,25 138,42 202,50 L0,50 Z" fill={`url(#${wingGradId})`} />
        </svg>

        <div className="relative z-10 h-full flex items-center justify-center gap-2.5 px-4 pt-1">
          <span className="h-[1.5px] w-10 sm:w-16 bg-[#d4af37]" />
          <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[200px]">
            {mosqueName.trim() || 'المدرسة القرآنية'}
          </span>
          <span className="h-[1.5px] w-10 sm:w-16 bg-[#d4af37]" />
        </div>
      </div>
    </div>
  );
};
