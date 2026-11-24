import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  ClipboardCheck,
  Users,
  BookOpen,
  CalendarDays,
  Wallet,
  TrendingUp,
  FileText,
  QrCode,
  Star,
  Trophy,
  Clock,
  DatabaseBackup,
  Settings,
  Menu,
  X,
  Download,
  WifiOff,
  Calendar,
  Edit3,
  Check,
  Info,
} from 'lucide-react';
import { SectionId } from '../types';
import {
  formatArabicWeekday,
  formatGregorianDate,
  formatHijriDate,
  getTodayISO,
} from '../utils/date';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const APP_ICON_SRC = `${import.meta.env.BASE_URL}assets/aistudio/1795538688943_0884cac0.jpg`;

export interface NavItem {
  id: SectionId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'إدارة الطلبة والحلقات',
    items: [
      {
        id: 'registrations',
        label: 'التسجيلات',
        subtitle: 'إضافة الطلبة وإدارة بياناتهم',
        icon: UserPlus,
      },
      {
        id: 'attendance',
        label: 'الحضور والغياب',
        subtitle: 'رصد الحضور والانصراف اليومي',
        icon: ClipboardCheck,
      },
      {
        id: 'groups',
        label: 'الأفواج وقوائم الطلاب',
        subtitle: 'تنظيم الأفواج والترتيب والنقل',
        icon: Users,
      },
    ],
  },
  {
    title: 'التعليم والمتابعة',
    items: [
      {
        id: 'hifz',
        label: 'متابعة الحفظ والمراجعة',
        subtitle: 'توثيق السور والآيات والتقييم',
        icon: BookOpen,
      },
      {
        id: 'schedule',
        label: 'البرنامج الأسبوعي',
        subtitle: 'تنظيم مواعيد الحلقات الأسبوعية',
        icon: CalendarDays,
      },
      {
        id: 'subscriptions',
        label: 'اشتراكات الطلبة',
        subtitle: 'متابعة الرسوم والمدفوعات الشهرية',
        icon: Wallet,
      },
    ],
  },
  {
    title: 'التقارير والتحفيز',
    items: [
      {
        id: 'analytics',
        label: 'الإنجازات والأهداف والإحصائيات',
        subtitle: 'مؤشرات الأداء والأهداف الفردية',
        icon: TrendingUp,
      },
      {
        id: 'reports',
        label: 'التقارير',
        subtitle: 'تقارير الأداء والطباعة والتصدير',
        icon: FileText,
      },
      {
        id: 'qr-cards',
        label: 'بطاقات الطلبة ورموز QR',
        subtitle: 'إصدار البطاقات ومسح الحضور',
        icon: QrCode,
      },
      {
        id: 'motivation',
        label: 'اللوحة التحفيزية',
        subtitle: 'نجوم التميز وتكريم الحفاظ',
        icon: Star,
      },
      {
        id: 'competitions',
        label: 'المسابقات القرآنية',
        subtitle: 'تنظيم المنافسات ومتابعة الجوائز',
        icon: Trophy,
      },
    ],
  },
  {
    title: 'الخدمات والإعدادات',
    items: [
      {
        id: 'prayer-times',
        label: 'مواقيت الآذان',
        subtitle: 'المواقيت المحلية واتجاه القبلة',
        icon: Clock,
      },
      {
        id: 'backup',
        label: 'النسخ الاحتياطي والاستعادة',
        subtitle: 'حفظ البيانات واسترجاعها محليًا',
        icon: DatabaseBackup,
      },
      {
        id: 'about',
        label: 'عن التطبيق',
        subtitle: 'التعريف بالتطبيق ومزاياه',
        icon: Info,
      },
      {
        id: 'settings',
        label: 'الشكل والإعدادات',
        subtitle: 'المظهر والألوان ونوع الخط',
        icon: Settings,
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

interface LayoutProps {
  activeSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  mosqueName: string;
  onChangeMosqueName: (name: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeSection,
  onSelectSection,
  mosqueName,
  onChangeMosqueName,
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [editingSchool, setEditingSchool] = useState(!mosqueName.trim());
  const [schoolDraft, setSchoolDraft] = useState(mosqueName);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setSchoolDraft(mosqueName);
    if (!mosqueName.trim()) {
      setEditingSchool(true);
    }
  }, [mosqueName]);

  const today = getTodayISO();
  const weekdayToday = formatArabicWeekday(today);
  const hijriToday = formatHijriDate(today);
  const gregToday = formatGregorianDate(today);

  const currentNav = NAV_ITEMS.find((i) => i.id === activeSection) ?? NAV_ITEMS[0];

  const handleNavigate = (id: SectionId) => {
    onSelectSection(id);
    setDrawerOpen(false);
  };

  const commitSchoolName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = schoolDraft.trim();
    onChangeMosqueName(cleaned);
    if (cleaned) {
      setEditingSchool(false);
    }
  };

  const renderSidebarContent = () => (
    <div
      className="flex h-full flex-col bg-[#f1f3f5] text-slate-800 border-l border-slate-200"
      style={{ fontFamily: 'var(--app-font)' }}
    >
      {/* App Icon & School Name at top of main menu */}
      <div className="flex items-center justify-between gap-2.5 px-4 py-3.5 min-h-[68px] border-b border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src={APP_ICON_SRC}
            alt="إدارة حلقات تحفيظ القرآن الكريم"
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-xl object-cover object-center bg-[#063434] border border-[#c89e3c]/50 shadow-2xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold truncate text-[var(--accent-menu)]">
              {mosqueName.trim() || 'إدارة حلقات تحفيظ القرآن الكريم'}
            </div>
            {mosqueName.trim() && (
              <div className="text-[11px] font-medium truncate text-slate-500">
                إدارة حلقات تحفيظ القرآن الكريم
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200/70"
          aria-label="إغلاق القائمة"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Grouped Navigation List with Horizontal Dividers, Subheadings & Two-Line Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="القائمة الرئيسية">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div
            key={group.title}
            className={
              groupIdx > 0
                ? 'mt-3 pt-3 border-t border-slate-200/90 space-y-1'
                : 'space-y-1'
            }
          >
            <div className="px-2.5 pb-1.5 text-[11px] font-bold text-slate-500 tracking-wide">
              {group.title}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeSection;
              const isRegistrations = item.id === 'registrations';
              const isSettings = item.id === 'settings';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-right transition-colors ${
                    active
                      ? 'bg-[var(--accent-menu-soft)] text-[var(--accent-menu)] border border-[var(--accent-menu)]/25'
                      : isSettings
                        ? 'text-slate-800 bg-white/75 hover:bg-slate-200/65 border border-slate-300/80 shadow-2xs'
                        : 'text-slate-800 hover:bg-slate-200/65 border border-transparent'
                  }`}
                >
                  <span
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isRegistrations
                        ? active
                          ? 'bg-[var(--accent-menu)] text-white shadow-2xs'
                          : 'bg-[var(--accent-menu-soft)] text-[var(--accent-menu)] border border-[var(--accent-menu)]/25'
                        : active
                          ? 'bg-[var(--accent-menu-soft)] text-[var(--accent-menu)]'
                          : 'bg-white/90 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm leading-snug truncate ${
                        active
                          ? 'font-extrabold text-[var(--accent-menu)]'
                          : 'font-bold text-slate-800'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] leading-tight truncate mt-0.5 ${
                        active ? 'text-[var(--accent-menu)] opacity-85' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Bottom Install Action (only when installable) */}
      {((!isInstalled && isInstallable) || (!isInstalled && !isInstallable && isIOS)) && (
        <div className="p-2.5 border-t border-slate-200 bg-[#e9ecef]/80">
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-menu)] text-white px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity min-h-[40px]"
            >
              <Download className="h-4 w-4" />
              <span>تثبيت التطبيق على الجهاز</span>
            </button>
          )}

          {!isInstalled && !isInstallable && isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors min-h-[40px]"
            >
              <Download className="h-4 w-4" />
              <span>تثبيت على الشاشة الرئيسية</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-[#f1f3f5] dark:bg-[#0d1512] text-[var(--text-primary)] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Independent Dark-Green Phone Status Bar Safe Area Backing */}
      <div
        aria-hidden="true"
        className="fixed top-0 inset-x-0 h-[env(safe-area-inset-top,0px)] bg-[#065f46] z-[70] pointer-events-none no-print"
      />
      {/* Independent Phone Bottom Navigation Bar Safe Area Separator */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 inset-x-0 h-[env(safe-area-inset-bottom,0px)] bg-[#f1f3f5] dark:bg-[#0d1512] border-t border-slate-200/70 z-[70] pointer-events-none no-print"
      />

      {/* Desktop Right-side Persistent Sidebar */}
      <aside className="hidden lg:block lg:w-72 lg:shrink-0 lg:sticky lg:top-[env(safe-area-inset-top,0px)] lg:h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] z-30 no-print">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Slide-over Drawer flush to RIGHT edge (85% width, leaving ~15% light-gray page visible on left) */}
      {drawerOpen && (
        <div className="fixed safe-modal-overlay z-50 lg:hidden no-print">
          <div
            className="fixed safe-modal-overlay bg-slate-900/18 backdrop-blur-[1px] transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed top-[env(safe-area-inset-top,0px)] bottom-[env(safe-area-inset-bottom,0px)] right-0 w-[85%] max-w-[85vw] z-50 shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#f1f3f5] dark:bg-[#0d1512]">
        {/* Top Header Bar reacting dynamically to selected Accent Color */}
        <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 px-4 lg:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 accent-header-gradient text-white shadow-sm border-b border-white/15 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-white hover:bg-white/15"
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="h-5 w-5" />
            </button>
            <img
              src={APP_ICON_SRC}
              alt="شعار التطبيق"
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-lg object-cover object-center bg-[#063434] border border-[#f0cd67]/60 shrink-0 shadow-2xs"
            />
            <h2 className="text-sm sm:text-base font-extrabold truncate text-white">
              {currentNav.label}
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-1 sm:justify-end">
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 text-amber-200 text-xs font-medium whitespace-nowrap">
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">دون إنترنت</span>
              </span>
            )}

            {editingSchool || !mosqueName.trim() ? (
              <form
                onSubmit={commitSchoolName}
                className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[280px] max-w-md"
              >
                <input
                  type="text"
                  value={schoolDraft}
                  onChange={(e) => setSchoolDraft(e.target.value)}
                  placeholder="اكتب اسم المدرسة القرآنية..."
                  aria-label="اسم المدرسة القرآنية"
                  className="flex-1 min-h-[40px] px-3.5 py-1.5 rounded-xl border border-white/25 bg-white/95 text-sm font-bold text-slate-900 placeholder:text-slate-500 placeholder:font-normal focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-[40px] px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/25 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>اعتماد</span>
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold font-quran tracking-wide text-white truncate">
                  {mosqueName}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditingSchool(true)}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white shrink-0 transition-colors"
                  title="تعديل اسم المدرسة القرآنية"
                  aria-label="تعديل اسم المدرسة القرآنية"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Bottom Date Bar (Static Footer with Day, Gregorian & Corresponding Hijri Date) */}
        <footer className="mt-auto border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]/80 px-4 lg:px-6 py-3.5 no-print">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[var(--text-secondary)]">
            <div className="flex flex-wrap items-center gap-2 font-semibold text-[var(--text-primary)]">
              <Calendar className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
              <span>اليوم: {weekdayToday}</span>
              <span aria-hidden="true">·</span>
              <span>{gregToday} م</span>
              <span aria-hidden="true">·</span>
              <span className="text-[var(--accent-primary)]">الموافق لـ {hijriToday}</span>
            </div>
            {mosqueName.trim() && (
              <div className="text-xs font-bold text-[var(--text-secondary)] truncate">
                {mosqueName}
              </div>
            )}
          </div>
        </footer>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed safe-modal-overlay z-50 flex items-center justify-center bg-black/50 p-4 no-print">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              تثبيت التطبيق على الجهاز
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              1. اضغط على زر <strong>المشاركة</strong> في شريط المتصفح.
              <br />
              2. اختر <strong>إضافة إلى الشاشة الرئيسية</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] py-2.5 text-sm font-semibold min-h-[44px]"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
