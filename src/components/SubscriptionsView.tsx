import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, CheckCircle2, Clock3, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { AppSettings, Group, Student, SubscriptionPayment } from '../types';
import { formatGregorianDate, getCurrentMonthISO, getTodayISO } from '../utils/date';

interface SubscriptionsViewProps {
  groups: Group[];
  students: Student[];
  payments: SubscriptionPayment[];
  settings: AppSettings;
  onUpdateDefaultFee: (fee: number, currencyLabel: string) => void;
  onAddPayment: (payment: Omit<SubscriptionPayment, 'id'>) => void;
  onUpdatePayment: (payment: SubscriptionPayment) => void;
  onDeletePayment: (id: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  groups,
  students,
  payments,
  settings,
  onUpdateDefaultFee,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthISO());
  const [filterGroupId, setFilterGroupId] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [feeInput, setFeeInput] = useState(String(settings.defaultMonthlyFee));
  const [currencyInput, setCurrencyInput] = useState(settings.currencyLabel);

  useEffect(() => {
    setFeeInput(String(settings.defaultMonthlyFee));
    setCurrencyInput(settings.currencyLabel);
  }, [settings.defaultMonthlyFee, settings.currencyLabel]);

  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<SubscriptionPayment | null>(null);
  const [confirmDeletePayId, setConfirmDeletePayId] = useState<string | null>(null);
  const [payModalStudent, setPayModalStudent] = useState<Student | null>(null);
  const [payAmount, setPayAmount] = useState(String(settings.defaultMonthlyFee));
  const [payDate, setPayDate] = useState(getTodayISO());
  const [payNotes, setPayNotes] = useState('');

  const activeStudents = useMemo(
    () =>
      students
        .filter((s) => !s.archived)
        .filter((s) => (filterGroupId === 'all' ? true : s.groupId === filterGroupId)),
    [students, filterGroupId]
  );

  const monthPaymentMap = useMemo(() => {
    const map = new Map<string, SubscriptionPayment>();
    payments
      .filter((p) => p.month === selectedMonth)
      .forEach((p) => map.set(p.studentId, p));
    return map;
  }, [payments, selectedMonth]);

  const displayedStudents = useMemo(() => {
    return activeStudents.filter((s) => {
      const paid = monthPaymentMap.has(s.id);
      if (statusFilter === 'paid') return paid;
      if (statusFilter === 'unpaid') return !paid;
      return true;
    });
  }, [activeStudents, monthPaymentMap, statusFilter]);

  const paidCount = activeStudents.filter((s) => monthPaymentMap.has(s.id)).length;
  const unpaidCount = activeStudents.length - paidCount;
  const monthRevenue = activeStudents.reduce(
    (sum, s) => sum + (monthPaymentMap.get(s.id)?.amount || 0),
    0
  );

  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups]);

  const studentHistoryPayments = useMemo(() => {
    if (!historyStudentId) return [];
    return payments
      .filter((p) => p.studentId === historyStudentId)
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [payments, historyStudentId]);

  const openPayModal = (stu: Student) => {
    setPayModalStudent(stu);
    setPayAmount(String(settings.defaultMonthlyFee));
    setPayDate(getTodayISO());
    setPayNotes('');
  };

  const confirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalStudent) return;
    const numericAmount = payAmount.trim() === '' ? settings.defaultMonthlyFee : Number(payAmount);
    onAddPayment({
      studentId: payModalStudent.id,
      month: selectedMonth,
      amount: Math.max(0, Number.isFinite(numericAmount) ? numericAmount : settings.defaultMonthlyFee),
      paidAt: payDate,
      notes: payNotes.trim(),
    });
    setPayModalStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Monthly Fee Settings & Summary */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <div>
              <label className="block text-xs font-medium mb-1">الشهر المطلوب</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">قيمة الاشتراك الشهري</label>
              <input
                type="number"
                min={0}
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">العملة</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value)}
                  className="w-24 min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateDefaultFee(Number(feeInput) || 0, currencyInput.trim() || 'دج')
                  }
                  className="flex-1 min-h-[42px] px-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-primary)] whitespace-nowrap"
                >
                  تحديث القيمة
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
            <div className="text-xs text-emerald-700 dark:text-emerald-300">الطلبة المسددون</div>
            <div className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300 mt-1">
              {paidCount} طالب
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
            <div className="text-xs text-amber-700 dark:text-amber-300">غير المسددين</div>
            <div className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-300 mt-1">
              {unpaidCount} طالب
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]">
            <div className="text-xs text-[var(--text-secondary)]">إجمالي المحصل للشهر</div>
            <div className="text-xl font-bold tabular-nums mt-1">
              {monthRevenue.toLocaleString('en-US')} {settings.currencyLabel}
            </div>
          </div>
        </div>
      </section>

      {/* Students Subscription Status List */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)]">
            {(
              [
                { id: 'all', label: `الكل (${activeStudents.length})` },
                { id: 'paid', label: `المسددون (${paidCount})` },
                { id: 'unpaid', label: `غير المسددين (${unpaidCount})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
            className="min-h-[42px] px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
          >
            <option value="all">جميع الأفواج</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-[var(--border-hairline)]">
          {displayedStudents.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
              لا يوجد طلاب في هذا التصنيف.
            </div>
          ) : (
            displayedStudents.map((stu) => {
              const payment = monthPaymentMap.get(stu.id);
              return (
                <div
                  key={stu.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm">{stu.fullName}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {groupMap.get(stu.groupId) || ''} ·{' '}
                      {payment ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          مسدد ({payment.amount} {settings.currencyLabel} بتاريخ{' '}
                          {formatGregorianDate(payment.paidAt)})
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          لم يُسدد بعد لشهر {selectedMonth}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {payment ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>مسدد</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openPayModal(stu)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-colors"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        <span>تسجيل الدفع</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setHistoryStudentId(stu.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>السجل</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Record Payment Modal */}
      {payModalStudent && (
        <div className="fixed safe-modal-overlay z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={confirmPay}
            className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold">تسجيل اشتراك — {payModalStudent.fullName}</h3>
            <div className="text-xs text-[var(--text-secondary)] font-mono-num">
              عن شهر: {selectedMonth}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                المبلغ ({settings.currencyLabel})
              </label>
              <input
                type="number"
                min={0}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">تاريخ السداد</label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">ملاحظات</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="مثال: نقدًا / تحويل"
                className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayModalStudent(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold"
              >
                تأكيد السداد
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student Payment History Modal */}
      {historyStudentId && (
        <div className="fixed safe-modal-overlay z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">
                سجل المدفوعات — {students.find((s) => s.id === historyStudentId)?.fullName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setHistoryStudentId(null);
                  setEditingPayment(null);
                }}
                className="p-2 rounded-lg hover:bg-[var(--bg-subtle)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-hairline)]">
              {studentHistoryPayments.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
                  لا توجد مدفوعات مسجلة لهذا الطالب بعد.
                </div>
              ) : (
                studentHistoryPayments.map((pay) => {
                  const isEdit = editingPayment?.id === pay.id;
                  if (isEdit && editingPayment) {
                    return (
                      <div key={pay.id} className="py-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="month"
                            value={editingPayment.month}
                            onChange={(e) =>
                              setEditingPayment({ ...editingPayment, month: e.target.value })
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-mono-num"
                          />
                          <input
                            type="number"
                            value={editingPayment.amount}
                            onChange={(e) =>
                              setEditingPayment({
                                ...editingPayment,
                                amount: Number(e.target.value) || 0,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-mono-num"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={editingPayment.paidAt}
                            onChange={(e) =>
                              setEditingPayment({ ...editingPayment, paidAt: e.target.value })
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs font-mono-num"
                          />
                          <input
                            type="text"
                            value={editingPayment.notes}
                            onChange={(e) =>
                              setEditingPayment({ ...editingPayment, notes: e.target.value })
                            }
                            placeholder="ملاحظات"
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdatePayment(editingPayment);
                              setEditingPayment(null);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPayment(null)}
                            className="p-1.5 rounded-lg border border-[var(--border-hairline)]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={pay.id} className="py-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm font-mono-num">
                          شهر {pay.month} — {pay.amount} {settings.currencyLabel}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          تاريخ الدفع: {formatGregorianDate(pay.paidAt)}
                          {pay.notes ? ` · ${pay.notes}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingPayment({ ...pay })}
                          className="p-2 rounded-lg hover:bg-[var(--bg-subtle)]"
                          title="تعديل الدفعة"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {confirmDeletePayId === pay.id ? (
                          <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2 py-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePayment(pay.id);
                                setConfirmDeletePayId(null);
                              }}
                              className="text-xs font-bold text-red-600 dark:text-red-400 px-1"
                            >
                              تأكيد
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePayId(null)}
                              className="text-xs text-[var(--text-secondary)] px-1"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePayId(pay.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"
                            title="حذف الدفعة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!monthPaymentMap.has(historyStudentId) && (
              <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-4 w-4" />
                  <span>الشهر الحالي ({selectedMonth}) غير مسدد</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
