import React, { useMemo, useState } from 'react';
import {
  Users,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft,
  Search,
  Plus,
} from 'lucide-react';
import { Group, SortMode, Student } from '../types';
import { sortStudents } from '../utils/sortStudents';
import { formatGregorianDate } from '../utils/date';

interface GroupsViewProps {
  groups: Group[];
  students: Student[];
  onCreateGroup: (name: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onChangeGroupSort: (groupId: string, sortMode: SortMode) => void;
  onReorderManualStudent: (groupId: string, studentId: string, direction: 'up' | 'down') => void;
  onTransferStudent: (studentId: string, targetGroupId: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  students,
  onCreateGroup,
  onRenameGroup,
  onChangeGroupSort,
  onReorderManualStudent,
  onTransferStudent,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [transferStudentId, setTransferStudentId] = useState<string | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('');

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || groups[0] || null,
    [groups, selectedGroupId]
  );

  const activeStudentsInGroup = useMemo(() => {
    if (!activeGroup) return [];
    const list = students.filter((s) => !s.archived && s.groupId === activeGroup.id);
    const sorted = sortStudents(list, activeGroup.sortMode);
    if (!searchStudent.trim()) return sorted;
    const q = searchStudent.trim().toLowerCase();
    return sorted.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.guardianName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q)
    );
  }, [activeGroup, students, searchStudent]);

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim());
    setNewGroupName('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Groups List Panel */}
      <section className="lg:col-span-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--text-primary)]">الأفواج ({groups.length})</h3>
        </div>

        <form onSubmit={handleAddGroup} className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="اسم فوج جديد..."
            className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <button
            type="submit"
            className="min-h-[42px] px-3.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors inline-flex items-center gap-1 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة</span>
          </button>
        </form>

        <div className="divide-y divide-[var(--border-hairline)]">
          {groups.map((group) => {
            const count = students.filter((s) => !s.archived && s.groupId === group.id).length;
            const isSelected = activeGroup?.id === group.id;
            const isEditing = editingGroupId === group.id;

            return (
              <div
                key={group.id}
                className={`py-3 px-2.5 rounded-xl transition-colors ${
                  isSelected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-subtle)]/50'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editingGroupName.trim()) {
                          onRenameGroup(group.id, editingGroupName.trim());
                        }
                        setEditingGroupId(null);
                      }}
                      className="p-2 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGroupId(null)}
                      className="p-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className="flex-1 text-right min-w-0 py-1"
                    >
                      <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {group.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] tabular-nums mt-0.5">
                        {count} طالب · ترتيب:{' '}
                        {group.sortMode === 'manual'
                          ? 'يدوي'
                          : group.sortMode === 'date'
                          ? 'تاريخ الإضافة'
                          : 'أبجدي'}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGroupId(group.id);
                        setEditingGroupName(group.name);
                      }}
                      className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                      title="تعديل اسم الفوج"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Selected Group Students Roster */}
      <section className="lg:col-span-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        {!activeGroup ? (
          <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
            يرجى إضافة فوج أولًا لعرض قائمة طلابه.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-hairline)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--accent-primary)]" />
                  <span>قائمة طلاب {activeGroup.name}</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                  إجمالي الطلاب المسجلين: {activeStudentsInGroup.length}
                </p>
              </div>

              {/* Three Sorting Options */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)]">
                {(
                  [
                    { id: 'manual', label: 'الترتيب اليدوي' },
                    { id: 'date', label: 'تاريخ الإضافة' },
                    { id: 'alphabetical', label: 'الترتيب الأبجدي' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeGroupSort(activeGroup.id, opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      activeGroup.sortMode === opt.id
                        ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 text-[var(--text-secondary)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="البحث في طلاب الفوج..."
                className="w-full min-h-[42px] pr-9 pl-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {activeStudentsInGroup.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
                لا يوجد طلاب مسجلون في هذا الفوج بعد.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)]">
                {activeStudentsInGroup.map((student, idx) => (
                  <div
                    key={student.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="h-8 w-8 shrink-0 rounded-lg bg-[var(--bg-subtle)] text-[var(--accent-primary)] font-mono-num text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                          {student.fullName}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-mono-num">{student.studentCode}</span>
                          <span>·</span>
                          <span>الولي: {student.guardianName || '—'}</span>
                          <span>·</span>
                          <span className="font-mono-num">{student.guardianPhone || '—'}</span>
                          <span>·</span>
                          <span>أضيف: {formatGregorianDate(student.createdAt.slice(0, 10))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {activeGroup.sortMode === 'manual' && !searchStudent.trim() && (
                        <>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onReorderManualStudent(activeGroup.id, student.id, 'up')}
                            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)] disabled:opacity-35"
                            title="تقديم للأعلى"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === activeStudentsInGroup.length - 1}
                            onClick={() =>
                              onReorderManualStudent(activeGroup.id, student.id, 'down')
                            }
                            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)] disabled:opacity-35"
                            title="تأخير للأسفل"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {transferStudentId === student.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={targetGroupId}
                            onChange={(e) => setTargetGroupId(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-xs"
                          >
                            {groups
                              .filter((g) => g.id !== activeGroup.id)
                              .map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (targetGroupId) {
                                onTransferStudent(student.id, targetGroupId);
                              }
                              setTransferStudentId(null);
                            }}
                            className="p-2 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                            title="تأكيد النقل"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTransferStudentId(null)}
                            className="p-2 rounded-lg border border-[var(--border-hairline)]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        groups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const other = groups.find((g) => g.id !== activeGroup.id);
                              if (other) {
                                setTargetGroupId(other.id);
                                setTransferStudentId(student.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--bg-subtle)] whitespace-nowrap"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            <span>نقل</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
