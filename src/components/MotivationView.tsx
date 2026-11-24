import React, { useMemo, useState } from 'react';
import {
  Star,
  Plus,
  Minus,
  Edit3,
  Check,
  X,
  Trophy,
} from 'lucide-react';
import { Group, MotivationStar, Student } from '../types';
import { sortStudents } from '../utils/sortStudents';

interface MotivationViewProps {
  groups: Group[];
  students: Student[];
  motivationStars: MotivationStar[];
  onToggleStar: (studentId: string, slotIndex: number, achievementName?: string) => void;
}

const TOTAL_SLOTS = 10;

export const MotivationView: React.FC<MotivationViewProps> = ({
  groups,
  students,
  motivationStars,
  onToggleStar,
}) => {
  const [filterGroupId, setFilterGroupId] = useState('all');
  const [activeEdit, setActiveEdit] = useState<{
    studentId: string;
    slotIndex: number;
    text: string;
  } | null>(null);

  const displayedStudents = useMemo(() => {
    const list = students
      .filter((s) => !s.archived)
      .filter((s) => (filterGroupId === 'all' ? true : s.groupId === filterGroupId));
    if (filterGroupId !== 'all') {
      const grp = groups.find((g) => g.id === filterGroupId);
      if (grp) return sortStudents(list, grp.sortMode);
    }
    return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [students, filterGroupId, groups]);

  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups]);

  const totalEarnedStars = useMemo(
    () =>
      displayedStudents.reduce(
        (sum, s) =>
          sum + motivationStars.filter((m) => m.studentId === s.id && m.active).length,
        0
      ),
    [displayedStudents, motivationStars]
  );

  const handleStarClick = (student: Student, slotIndex: number, starData?: MotivationStar) => {
    const isActive = Boolean(starData?.active);
    if (isActive) {
      onToggleStar(student.id, slotIndex);
      if (
        activeEdit &&
        activeEdit.studentId === student.id &&
        activeEdit.slotIndex === slotIndex
      ) {
        setActiveEdit(null);
      }
    } else {
      onToggleStar(student.id, slotIndex, starData?.achievementName || 'إنجاز متميز');
    }
  };

  const handleIncrementStar = (student: Student, stuStars: MotivationStar[], latestText: string) => {
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const existing = stuStars.find((s) => s.slotIndex === i);
      if (!existing?.active) {
        onToggleStar(student.id, i, existing?.achievementName || latestText || 'إنجاز متميز');
        return;
      }
    }
  };

  const handleDecrementStar = (student: Student, activeStars: MotivationStar[]) => {
    if (activeStars.length === 0) return;
    const lastActive = activeStars[activeStars.length - 1];
    onToggleStar(student.id, lastActive.slotIndex);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Prominent Gold-Framed Beige Honor Board */}
      <section className="relative overflow-hidden rounded-[28px] border-2 border-[#c89e3c] bg-[#faf4e8] text-[#172822] shadow-lg">
        {/* Subtle Light Geometric Lattice Pattern */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.06]"
        >
          <defs>
            <pattern
              id="motivation_geometric_bg"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M24 0 L48 24 L24 48 L0 24 Z"
                fill="none"
                stroke="#9b7b3e"
                strokeWidth="1"
              />
              <circle
                cx="24"
                cy="24"
                r="8"
                fill="none"
                stroke="#9b7b3e"
                strokeWidth="0.9"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#motivation_geometric_bg)" />
        </svg>

        {/* Top Dynamic Accent Banner with Gold Border Edge & Radiant Trophy */}
        <div className="relative z-10 accent-header-gradient border-b-[3px] border-[#c89e3c] px-5 sm:px-7 py-5 flex items-center justify-between gap-4">
          <div className="text-right space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              اللوحة التحفيزية
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[#f2dfaa]">
              نجتهد في الحفظ ونرتقي بالقرآن
            </p>
          </div>

          {/* Radiant Golden Trophy on the Left */}
          <div className="relative shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-[#f3d375]/25 to-[#c89e3c]/15 border border-[#e6c56d]/55 flex items-center justify-center shadow-[0_0_24px_rgba(232,196,104,0.35)]">
            <span className="absolute inset-1 rounded-xl bg-[#f5d77f]/15 blur-xs pointer-events-none" />
            <Trophy className="relative h-8 w-8 sm:h-9 sm:w-9 text-[#f4cf63] drop-shadow-[0_2px_6px_rgba(244,207,99,0.55)]" />
          </div>
        </div>

        {/* Inner Board Body */}
        <div className="relative z-10 p-4 sm:p-6 space-y-5">
          {/* Horizontal Gold-Framed Total Stars Box + Group Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 rounded-2xl border-2 border-[#c89e3c] bg-gradient-to-r from-[#fffdf7] via-[#fbf6ea] to-[#fffdf7] px-5 py-3.5 flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-[#f7da7c] to-[#c89e3c] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Star className="h-5 w-5 fill-white text-white" />
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[var(--accent-menu)]">
                  مجموع النجوم
                </span>
              </div>

              <span className="text-2xl sm:text-3xl font-extrabold font-mono-num text-[#b8861e] leading-none">
                {totalEarnedStars}
              </span>
            </div>

            <select
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              className="min-h-[52px] px-4 py-2 rounded-2xl border-2 border-[#c89e3c]/70 bg-white text-[var(--accent-menu)] text-xs sm:text-sm font-bold focus:outline-none focus:border-[var(--accent-menu)]"
            >
              <option value="all">جميع الأفواج ({groups.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Accent Strip: "خانات الطلبة (N)" + Row of 10 Golden Stars */}
          <div className="rounded-2xl accent-header-gradient border border-[#c89e3c]/75 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="text-sm sm:text-base font-extrabold text-white">
              خانات الطلبة ({displayedStudents.length})
            </div>

            <div className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-[#f4cf63] text-[#d4af37]"
                />
              ))}
            </div>
          </div>

          {/* Student Motivation Cards */}
          {displayedStudents.length === 0 ? (
            <div className="rounded-2xl border border-[#c89e3c]/40 bg-white/80 p-10 text-center text-sm text-[#4c5c55]">
              لا يوجد طلبة لعرضهم في اللوحة التحفيزية بعد. أضف طلبة من قسم التسجيلات وستظهر خاناتهم هنا تلقائيًا.
            </div>
          ) : (
            <div className="space-y-4">
              {displayedStudents.map((stu, idx) => {
                const stuStars = motivationStars.filter((m) => m.studentId === stu.id);
                const activeStars = stuStars
                  .filter((m) => m.active)
                  .sort((a, b) => a.slotIndex - b.slotIndex);

                const latestStar = activeStars[activeStars.length - 1];
                const latestAchievement = latestStar?.achievementName || '';
                const editingThisRow = activeEdit?.studentId === stu.id ? activeEdit : null;
                const groupName = groupMap.get(stu.groupId) || 'غير محدد';

                return (
                  <div
                    key={stu.id}
                    className="rounded-2xl border border-[#c89e3c]/55 bg-white/95 p-4 sm:p-5 shadow-xs space-y-3.5"
                  >
                    {/* Card Top Row: Gold Number Badge + Name/Group (Right) & Green Counter Badge (Left) */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#f3cf68] to-[#b98824] text-white font-mono-num text-sm font-extrabold flex items-center justify-center shadow-xs">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-base sm:text-lg font-extrabold text-[#12261e] truncate">
                            {stu.fullName}
                          </div>
                          <div className="text-xs font-semibold text-[#556b62] truncate">
                            {groupName}
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Accent Counter Badge with Gold Star */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full accent-header-gradient text-white text-xs sm:text-sm font-extrabold border border-[#c89e3c]/60 shrink-0 shadow-xs">
                        <span className="font-mono-num" dir="ltr">
                          {activeStars.length} / {TOTAL_SLOTS}
                        </span>
                        <Star className="h-4 w-4 fill-[#f4cf63] text-[#f4cf63]" />
                      </div>
                    </div>

                    {/* Row of 10 Interactive Stars */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 py-1">
                      {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => {
                        const starData = stuStars.find((s) => s.slotIndex === slotIndex);
                        const isActive = Boolean(starData?.active);
                        return (
                          <button
                            key={slotIndex}
                            type="button"
                            onClick={() => handleStarClick(stu, slotIndex, starData)}
                            title={
                              isActive
                                ? `${starData?.achievementName || 'نجمة مفعلة'} (اضغط للإلغاء)`
                                : 'اضغط لإضاءة النجمة الذهبية'
                            }
                            className={`h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${
                              isActive
                                ? 'bg-[#fff9e6] border-[#e4be5b] shadow-xs'
                                : 'bg-[#f6f3eb] border-[#e7dfd0] hover:border-[#c89e3c]/50'
                            }`}
                          >
                            <Star
                              className={`h-6 w-6 transition-all duration-200 ${
                                isActive
                                  ? 'fill-[#f4c430] text-[#c89316] scale-105'
                                  : 'fill-[#ddd6c7]/60 text-[#c6beae]'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Latest Achievement Field */}
                    <div className="rounded-xl border border-[#e4dac5] bg-[#faf7ef] px-3.5 py-2.5 text-xs sm:text-sm text-[#1c332a]">
                      <span className="font-bold text-[#064e3b]">الإنجاز الأخير: </span>
                      <span className={latestAchievement ? 'font-semibold' : 'text-[#73807a]'}>
                        {latestAchievement || 'لم يُسجل إنجاز بعد'}
                      </span>
                    </div>

                    {/* Bottom Controls: Star Control (- / +) & Edit Achievement Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                      {/* Star Control Container */}
                      <div className="inline-flex items-center gap-2 rounded-xl border border-[#d9ceb5] bg-[#f8f4ea] px-2.5 py-1.5">
                        <button
                          type="button"
                          onClick={() => handleDecrementStar(stu, activeStars)}
                          disabled={activeStars.length === 0}
                          className="h-8 w-8 rounded-lg border border-[#d6c9ab] bg-white text-[#064e3b] flex items-center justify-center hover:bg-[#f2ebdb] disabled:opacity-40 transition-colors"
                          title="إنقاص نجمة"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-extrabold text-[#1c332a] px-1">
                          تحكم النجوم
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrementStar(stu, stuStars, latestAchievement)}
                          disabled={activeStars.length >= TOTAL_SLOTS}
                          className="h-8 w-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center hover:bg-[#08634a] disabled:opacity-40 transition-colors"
                          title="إضافة نجمة"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Edit Achievement Action */}
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs font-bold text-[#52655d]">تعديل الإنجاز</span>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveEdit({
                              studentId: stu.id,
                              slotIndex: latestStar ? latestStar.slotIndex : 0,
                              text: latestAchievement,
                            })
                          }
                          className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-xl border border-[#c89e3c] bg-[#fffdf7] text-[#064e3b] text-xs font-bold hover:bg-[#fff6dc] transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-[#b8861e]" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Achievement Editor */}
                    {editingThisRow && (
                      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-[#e7decb]">
                        <input
                          type="text"
                          value={editingThisRow.text}
                          onChange={(e) =>
                            setActiveEdit({ ...editingThisRow, text: e.target.value })
                          }
                          placeholder="اكتب وصف الإنجاز الأخير للطالب..."
                          className="flex-1 min-w-[200px] min-h-[40px] px-3 rounded-xl border border-[#c89e3c] bg-white text-xs text-[#12261e] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onToggleStar(
                              stu.id,
                              editingThisRow.slotIndex,
                              editingThisRow.text.trim() || 'إنجاز متميز'
                            );
                            setActiveEdit(null);
                          }}
                          className="min-h-[40px] px-4 rounded-xl bg-[#064e3b] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#08634a]"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>حفظ الإنجاز</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEdit(null)}
                          className="min-h-[40px] px-3 rounded-xl border border-[#d6c9ab] bg-white text-[#1c332a] text-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Dynamic Accent Rounded Footer Strip with Gold Border */}
          <div className="rounded-2xl border-2 border-[#c89e3c] accent-header-gradient px-5 py-3.5 flex items-center justify-center gap-2.5 shadow-xs text-center">
            <Star className="h-4.5 w-4.5 fill-[#f4cf63] text-[#f4cf63] shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white">
              كل نجمة .. خطوة نحو إتقان القرآن الكريم
            </span>
            <Star className="h-4.5 w-4.5 fill-[#f4cf63] text-[#f4cf63] shrink-0" />
          </div>
        </div>
      </section>
    </div>
  );
};
