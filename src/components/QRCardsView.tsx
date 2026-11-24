import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { toPng } from 'html-to-image';
import {
  Camera,
  CheckCircle2,
  Download,
  Printer,
  Upload,
  XCircle,
  QrCode,
  VideoOff,
} from 'lucide-react';
import { AttendanceStatus, Group, SessionPeriod, Student } from '../types';
import { getTodayISO } from '../utils/date';
import { StudentCard } from './StudentCard';

interface QRCardsViewProps {
  groups: Group[];
  students: Student[];
  mosqueName: string;
  onChangeMosqueName?: (name: string) => void;
  onMarkStudentAttendance: (
    studentId: string,
    groupId: string,
    date: string,
    period: SessionPeriod,
    status: AttendanceStatus,
    excuseReason?: string
  ) => void;
}

export const QRCardsView: React.FC<QRCardsViewProps> = ({
  groups,
  students,
  mosqueName,
  onChangeMosqueName,
  onMarkStudentAttendance,
}) => {
  const activeStudents = useMemo(() => students.filter((s) => !s.archived), [students]);
  const [filterGroupId, setFilterGroupId] = useState('all');

  // Section 1: Inline QR Attendance Scanner state
  const [scanStatus, setScanStatus] = useState<'present' | 'absent'>('present');
  const [scanPeriod, setScanPeriod] = useState<SessionPeriod>('morning');
  const [scanDate, setScanDate] = useState(getTodayISO());
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastScanned, setLastScanned] = useState<{
    student: Student;
    status: 'present' | 'absent';
    groupName: string;
  } | null>(null);
  const [scanError, setScanError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastDecodedRef = useRef<{ value: string; time: number }>({ value: '', time: 0 });

  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups]);

  const displayedStudents = useMemo(
    () =>
      activeStudents.filter((s) =>
        filterGroupId === 'all' ? true : s.groupId === filterGroupId
      ),
    [activeStudents, filterGroupId]
  );

  const resolveAndMarkQR = (raw: string) => {
    const clean = raw.trim();
    if (!clean) {
      setScanError('يرجى إدخال أو مسح رمز QR الخاص بالطالب.');
      return;
    }

    let parsedId = '';
    let parsedCode = '';

    try {
      const json = JSON.parse(clean);
      if (json && typeof json === 'object') {
        parsedId = String(json.id || '');
        parsedCode = String(json.code || '');
      }
    } catch {
      const parts = clean.split(':');
      if (parts[0] === 'HALAQAH_STUDENT') {
        parsedId = parts[1] || '';
        parsedCode = parts[2] || '';
      }
    }

    const found =
      activeStudents.find(
        (s) =>
          (parsedId && s.id === parsedId) ||
          (parsedCode && s.studentCode.toLowerCase() === parsedCode.toLowerCase()) ||
          s.id === clean ||
          s.studentCode.toLowerCase() === clean.toLowerCase()
      ) || null;

    if (!found) {
      setScanError('لم يتم العثور على طالب مطابق لهذا الرمز.');
      setLastScanned(null);
      return;
    }

    onMarkStudentAttendance(found.id, found.groupId, scanDate, scanPeriod, scanStatus);
    setScanError('');
    setLastScanned({
      student: found,
      status: scanStatus,
      groupName: groupMap.get(found.groupId) || 'غير محدد',
    });
    setManualCode('');
  };

  // Inline Camera QR Scanning Loop
  useEffect(() => {
    if (!cameraActive) return;
    let stream: MediaStream | null = null;
    let rafId = 0;
    let stopped = false;

    const startCamera = async () => {
      setCameraError('');
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError(
            'الكاميرا غير مدعومة في هذا المتصفح. يمكنك استخدام حقل الإدخال أو رفع صورة رمز QR.'
          );
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current && !stopped) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          const tick = () => {
            if (stopped) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imgData.data, imgData.width, imgData.height);
                if (code && code.data) {
                  const now = Date.now();
                  if (
                    lastDecodedRef.current.value !== code.data ||
                    now - lastDecodedRef.current.time > 2500
                  ) {
                    lastDecodedRef.current = { value: code.data, time: now };
                    resolveAndMarkQR(code.data);
                  }
                }
              }
            }
            rafId = requestAnimationFrame(tick);
          };
          rafId = requestAnimationFrame(tick);
        }
      } catch {
        setCameraError(
          'تعذر تشغيل الكاميرا مباشرة. تأكد من صلاحية الكاميرا أو استخدم الإدخال اليدوي / رفع الصورة.'
        );
      }
    };

    startCamera();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive, scanStatus, scanPeriod, scanDate, activeStudents]);

  const handleUploadQRImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {
      setScanError('تعذر قراءة ملف الصورة المختار.');
    };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        setScanError('الصورة المختارة غير صالحة أو تالفة.');
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(data.data, data.width, data.height);
        if (decoded?.data) {
          resolveAndMarkQR(decoded.data);
        } else {
          setScanError('تعذر قراءة رمز QR من الصورة المختارة.');
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownloadCard = async (student: Student) => {
    const node = cardRefs.current[student.id];
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `بطاقة_${student.studentCode}_${student.fullName}.png`;
      a.click();
    } catch {
      setScanError('تعذر حفظ بطاقة الطالب كصورة. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: QR Attendance & Absence Scanner */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4 no-print">
        <div className="flex items-start gap-3">
          <span className="h-10 w-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
            <QrCode className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              مسح رمز QR لتسجيل الحضور والغياب
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              سجّل حضور الطالب أو غيابه تلقائيًا باستخدام كاميرا الجهاز أو قارئ الرموز.
            </p>
          </div>
        </div>

        {/* Status Toggle + Period + Date */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setScanStatus('present')}
            className={`min-h-[42px] px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors border ${
              scanStatus === 'present'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-[var(--bg-canvas)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>تسجيل حاضر</span>
          </button>

          <button
            type="button"
            onClick={() => setScanStatus('absent')}
            className={`min-h-[42px] px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors border ${
              scanStatus === 'absent'
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-[var(--bg-canvas)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <XCircle className="h-4 w-4" />
            <span>تسجيل غائب</span>
          </button>

          <select
            value={scanPeriod}
            onChange={(e) => setScanPeriod(e.target.value as SessionPeriod)}
            className="min-h-[42px] px-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-semibold"
          >
            <option value="morning">الفترة الصباحية</option>
            <option value="evening">الفترة المسائية</option>
          </select>

          <input
            type="date"
            value={scanDate}
            onChange={(e) => setScanDate(e.target.value)}
            className="min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-mono-num"
          />
        </div>

        {/* QR Input & Confirm Scan */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resolveAndMarkQR(manualCode);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="امسح أو أدخل رمز QR الخاص بالطالب (مثال: HQ-1001)"
            className="flex-1 min-w-0 min-h-[44px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm placeholder:text-xs focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-6 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap shrink-0"
          >
            تأكيد المسح
          </button>
        </form>

        {/* Camera & Image Upload Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCameraActive((prev) => !prev)}
            className={`min-h-[42px] px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-colors ${
              cameraActive
                ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            {cameraActive ? <VideoOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            <span>{cameraActive ? 'إيقاف الكاميرا' : 'مسح بالكاميرا'}</span>
          </button>

          <label className="min-h-[42px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-subtle)]">
            <Upload className="h-4 w-4" />
            <span>قراءة QR من صورة</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadQRImage}
              className="hidden"
            />
          </label>
        </div>

        {/* Inline Live Camera Preview */}
        {cameraActive && (
          <div className="rounded-xl overflow-hidden bg-black aspect-video max-w-md relative flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {cameraError && (
              <div className="absolute inset-0 bg-black/80 text-white p-4 text-center text-xs flex items-center justify-center">
                {cameraError}
              </div>
            )}
          </div>
        )}

        {/* Scan Result Feedback */}
        {lastScanned && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex flex-wrap items-center justify-between gap-2 ${
              lastScanned.status === 'present'
                ? 'border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200'
            }`}
          >
            <span>
              تم تسجيل <strong>{lastScanned.status === 'present' ? 'حاضر' : 'غائب'}</strong>{' '}
              للطالب <strong>{lastScanned.student.fullName}</strong> ({lastScanned.groupName}) ·{' '}
              {scanPeriod === 'morning' ? 'الفترة الصباحية' : 'الفترة المسائية'}
            </span>
            <span className="font-mono-num">{lastScanned.student.studentCode}</span>
          </div>
        )}

        {scanError && (
          <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-semibold">
            {scanError}
          </div>
        )}
      </section>

      {/* Section 2: Student Cards List & Immediate Previews */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            بطاقات الطلبة ({displayedStudents.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={mosqueName}
              onChange={(e) => onChangeMosqueName?.(e.target.value)}
              placeholder="المدرسة القرآنية"
              className="min-h-[42px] px-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-primary)]"
            />

            <select
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              className="min-h-[42px] px-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-semibold"
            >
              <option value="all">جميع الأفواج ({activeStudents.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 min-h-[42px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة البطاقات</span>
            </button>
          </div>
        </div>

        {/* Student Cards Preview Grid Inside Section 2 */}
        {displayedStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-8 text-center text-sm text-[var(--text-secondary)]">
            لا يوجد طلبة مسجلون بعد. عند إدراج أي طالب في قسم التسجيلات ستظهر بطاقته هنا تلقائيًا.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {displayedStudents.map((stu) => {
              const gName = groupMap.get(stu.groupId) || 'غير محدد';

              return (
                <div key={stu.id} className="w-full max-w-[520px] mx-auto space-y-2">
                  <StudentCard
                    student={stu}
                    groupName={gName}
                    mosqueName={mosqueName}
                    cardRef={(el) => {
                      cardRefs.current[stu.id] = el;
                    }}
                  />

                  <div className="flex items-center justify-between px-1 no-print">
                    <span className="text-xs text-[var(--text-secondary)] font-mono-num">
                      الرمز: {stu.studentCode}
                      {stu.guardianName ? ` · الولي: ${stu.guardianName}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadCard(stu)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>حفظ البطاقة كصورة</span>
                    </button>
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
