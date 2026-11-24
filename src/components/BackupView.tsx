import React, { useEffect, useState } from 'react';
import {
  Download,
  Upload,
  ShieldCheck,
  History,
  CheckCircle2,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { AppDatabase, BackupSnapshot } from '../types';
import { loadBackupSnapshots, validateBackupPayload } from '../utils/db';
import { formatGregorianDate, formatHijriDate } from '../utils/date';

interface BackupViewProps {
  db: AppDatabase;
  onCreateManualBackup: () => Promise<void>;
  onToggleAutoBackup: (enabled: boolean) => void;
  onRestoreDatabase: (nextDb: AppDatabase) => Promise<void>;
}

export const BackupView: React.FC<BackupViewProps> = ({
  db,
  onCreateManualBackup,
  onToggleAutoBackup,
  onRestoreDatabase,
}) => {
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingRestore, setPendingRestore] = useState<AppDatabase | null>(null);

  const refreshSnapshots = async () => {
    const list = await loadBackupSnapshots();
    setSnapshots(list);
  };

  useEffect(() => {
    refreshSnapshots();
  }, [db.settings.lastBackupAt]);

  const exportFile = async () => {
    try {
      await onCreateManualBackup();
      const payload = JSON.stringify(db, null, 2);
      const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `نسخة_احتياطية_حلقات_${stamp}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatusMsg('تم إنشاء وحفظ ملف النسخة الاحتياطية الكاملة بنجاح.');
      setErrorMsg('');
      await refreshSnapshots();
    } catch {
      setErrorMsg('تعذر حفظ ملف النسخة الاحتياطية على الجهاز.');
    }
  };

  const shareBackupToAnotherDevice = async () => {
    try {
      await onCreateManualBackup();
      const payload = JSON.stringify(db, null, 2);
      const stamp = new Date().toISOString().slice(0, 10);
      const file = new File([payload], `نسخة_احتياطية_حلقات_${stamp}.json`, {
        type: 'application/json',
      });

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: 'نسخة احتياطية — حلقات',
            text: 'ملف النسخة الاحتياطية الكاملة لنقل البيانات إلى جهاز آخر.',
            files: [file],
          });
          return;
        } catch {
          // Fallback to download below
        }
      }
      await exportFile();
    } catch {
      setErrorMsg('تعذر مشاركة ملف النسخة الاحتياطية.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setStatusMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const check = validateBackupPayload(parsed);
        if (!check.valid || !check.data) {
          setErrorMsg(check.error || 'ملف النسخة الاحتياطية غير سليم.');
          setPendingRestore(null);
        } else {
          setPendingRestore(check.data);
        }
      } catch {
        setErrorMsg('تعذر قراءة الملف. تأكد من أن الملف بصيغة JSON صالحة.');
        setPendingRestore(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('تعذر قراءة الملف المحدد.');
      setPendingRestore(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmRestore = async () => {
    if (!pendingRestore) return;
    try {
      await onRestoreDatabase(pendingRestore);
      setPendingRestore(null);
      setErrorMsg('');
      setStatusMsg('تمت استعادة جميع البيانات والعلاقات والإعدادات بنجاح.');
    } catch {
      setErrorMsg('حدث خطأ أثناء استعادة البيانات. يرجى المحاولة مرة أخرى.');
    }
  };

  const lastBackupText = db.settings.lastBackupAt
    ? `${formatGregorianDate(db.settings.lastBackupAt.slice(0, 10))} (${new Date(
        db.settings.lastBackupAt
      ).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})`
    : 'لم يتم إنشاء نسخة بعد';

  return (
    <div className="space-y-6">
      {/* Backup Controls */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-hairline)]">
          <div>
            <h3 className="text-base font-bold">النسخ الاحتياطي الكامل</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              يشمل جميع الطلبة، الأفواج، الحضور، الحفظ والمراجعة، الاشتراكات، المسابقات، اللوحة التحفيزية، والإعدادات.
            </p>
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            آخر نسخة احتياطية: <strong className="text-[var(--text-primary)]">{lastBackupText}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportFile}
            className="inline-flex items-center gap-2 min-h-[46px] px-5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)]"
          >
            <Download className="h-4 w-4" />
            <span>حفظ نسخة احتياطية يدوية (ملف)</span>
          </button>

          <button
            type="button"
            onClick={shareBackupToAnotherDevice}
            className="inline-flex items-center gap-2 min-h-[46px] px-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
          >
            <Share2 className="h-4 w-4" />
            <span>نقل النسخة إلى هاتف آخر</span>
          </button>
        </div>

        {/* Auto Backup Toggle */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
          <div>
            <div className="text-sm font-bold">النسخ الاحتياطي التلقائي المحلي</div>
            <div className="text-xs text-[var(--text-secondary)]">
              يحفظ لقطات احتياطية تلقائية داخل قاعدة بيانات الجهاز عند تحديث السجلات.
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleAutoBackup(!db.settings.autoBackupEnabled)}
            className={`min-h-[40px] px-4 rounded-xl text-xs font-bold transition-colors ${
              db.settings.autoBackupEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
            }`}
          >
            {db.settings.autoBackupEnabled ? 'مفعّل' : 'معطّل'}
          </button>
        </div>
      </section>

      {/* Restore from External File */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--accent-primary)]" />
          <h3 className="text-base font-bold">استعادة البيانات من ملف خارجي</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          يتم التحقق من سلامة ملف النسخة الاحتياطية وبنية السجلات تلقائيًا قبل الاستعادة لضمان عدم فقدان أي بيانات.
        </p>

        <label className="inline-flex items-center gap-2 min-h-[46px] px-5 rounded-xl border-2 border-dashed border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)] text-xs font-bold cursor-pointer hover:opacity-90">
          <Upload className="h-4 w-4" />
          <span>اختيار ملف نسخة احتياطية (.json)</span>
          <input type="file" accept=".json,application/json" onChange={handleFileImport} className="hidden" />
        </label>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {pendingRestore && (
          <div className="p-4 rounded-xl border border-amber-400 bg-amber-50/70 dark:bg-amber-950/25 space-y-3">
            <div className="font-bold text-sm text-amber-900 dark:text-amber-300">
              تم التحقق من سلامة النسخة الاحتياطية! تفاصيل السجلات المستوردة:
            </div>
            <div className="text-xs text-[var(--text-primary)] grid grid-cols-2 sm:grid-cols-4 gap-2 tabular-nums">
              <div>الأفواج: {pendingRestore.groups.length}</div>
              <div>الطلبة: {pendingRestore.students.length}</div>
              <div>سجلات الحضور: {pendingRestore.attendance.length}</div>
              <div>سجلات الحفظ/المراجعة: {pendingRestore.recitations.length}</div>
              <div>الاشتراكات: {pendingRestore.payments.length}</div>
              <div>المسابقات: {pendingRestore.competitions.length}</div>
              <div>الأهداف: {pendingRestore.goals.length}</div>
              <div>الجدول: {pendingRestore.schedule.length}</div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={confirmRestore}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold"
              >
                تأكيد استعادة البيانات الآن
              </button>
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Local Snapshots History */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-[var(--accent-primary)]" />
          <span>النسخ الاحتياطية المحفوظة محليًا ({snapshots.length})</span>
        </h3>
        {snapshots.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
            لا توجد لقطات محلية بعد. اضغط على «حفظ نسخة احتياطية» لإنشاء أول لقطة.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-sm">
                    {snap.reason === 'manual' ? 'نسخة يدوية' : 'نسخة تلقائية'} —{' '}
                    {formatGregorianDate(snap.createdAt.slice(0, 10))}
                  </div>
                  <div className="text-[var(--text-secondary)] tabular-nums">
                    {formatHijriDate(snap.createdAt.slice(0, 10))} · {snap.data.students.length} طالب ·{' '}
                    {snap.data.recitations.length} سجل تسميع
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRestore(snap.data)}
                  className="px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] font-semibold hover:bg-[var(--bg-subtle)]"
                >
                  استعادة هذه النسخة
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
