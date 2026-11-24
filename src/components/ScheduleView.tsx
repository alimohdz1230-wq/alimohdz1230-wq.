import React, { useMemo, useState } from 'react';
import { CalendarDays, Plus, Edit3, Trash2, Check, X } from 'lucide-react';
import { ArabicWeekday, Group, ScheduleItem } from '../types';

const WEEKDAYS: ArabicWeekday[] = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

interface ScheduleViewProps {
  groups: Group[];
  schedule: ScheduleItem[];
  onAddScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  onUpdateScheduleItem: (item: ScheduleItem) => void;
  onDeleteScheduleItem: (id: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  groups,
  schedule,
  onAddScheduleItem,
  onUpdateScheduleItem,
  onDeleteScheduleItem,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [day, setDay] = useState<ArabicWeekday>('السبت');
  const [time, setTime] = useState('06:30 - 08:00');
  const [activity, setActivity] = useState('حفظ جديد ومراجعة');
  const [room, setRoom] = useState('قاعة المصحف 1');

  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const groupSchedule = useMemo(() => {
    if (!currentGroup) return [];
    return schedule
      .filter((s) => s.groupId === currentGroup.id)
      .sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || a.time.localeCompare(b.time));
  }, [schedule, currentGroup]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup || !time.trim() || !activity.trim()) return;
    onAddScheduleItem({
      groupId: currentGroup.id,
      day,
      time: time.trim(),
      activity: activity.trim(),
      room: room.trim() || 'القاعة الرئيسية',
    });
  };

  return (
    <div className="space-y-6">
      {/* Group Selector */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">البرنامج الأسبوعي المستقل لكل فوج</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              خصص أيام وتوقيت الحصص والأنشطة والقاعات لكل فوج على حدة.
            </p>
          </div>
          <select
            value={currentGroup?.id || ''}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-semibold"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-[var(--border-hairline)]">
          <div>
            <label className="block text-xs font-medium mb-1">اليوم</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as ArabicWeekday)}
              className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">توقيت الحصة</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="06:30 - 08:00"
              className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">النشاط</label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="حفظ / مراجعة / تجويد"
              className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">القاعة</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="اسم القاعة"
              className="w-full min-h-[42px] px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!currentGroup}
              className="w-full min-h-[42px] px-4 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة حصة</span>
            </button>
          </div>
        </form>
      </section>

      {/* Weekly Schedule Table */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <h4 className="text-base font-bold mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[var(--accent-primary)]" />
          <span>جدول حصص {currentGroup?.name || ''}</span>
        </h4>

        {groupSchedule.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
            لم تتم إضافة حصص في البرنامج الأسبوعي لهذا الفوج بعد.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {groupSchedule.map((item) => {
              const isEditing = editing?.id === item.id;
              if (isEditing && editing) {
                return (
                  <div key={item.id} className="py-3 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                    <select
                      value={editing.day}
                      onChange={(e) =>
                        setEditing({ ...editing, day: e.target.value as ArabicWeekday })
                      }
                      className="px-2.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
                    >
                      {WEEKDAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editing.time}
                      onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                      className="px-2.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm font-mono-num"
                    />
                    <input
                      type="text"
                      value={editing.activity}
                      onChange={(e) => setEditing({ ...editing, activity: e.target.value })}
                      className="px-2.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
                    />
                    <input
                      type="text"
                      value={editing.room}
                      onChange={(e) => setEditing({ ...editing, room: e.target.value })}
                      className="px-2.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
                    />
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!editing.time.trim() || !editing.activity.trim()) return;
                          onUpdateScheduleItem({
                            ...editing,
                            time: editing.time.trim(),
                            activity: editing.activity.trim(),
                            room: editing.room.trim() || 'القاعة الرئيسية',
                          });
                          setEditing(null);
                        }}
                        className="p-2 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="p-2 rounded-lg border border-[var(--border-hairline)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-[80px] font-bold text-sm text-[var(--accent-primary)]">
                      {item.day}
                    </span>
                    <span className="font-mono-num text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                      {item.time}
                    </span>
                    <span className="font-semibold text-sm">{item.activity}</span>
                    <span className="text-xs text-[var(--text-secondary)]">· {item.room}</span>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...item })}
                      className="p-2 rounded-lg hover:bg-[var(--bg-subtle)]"
                      title="تعديل الحصة"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {confirmDeleteId === item.id ? (
                      <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2 py-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteScheduleItem(item.id);
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
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"
                        title="حذف الحصة"
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
