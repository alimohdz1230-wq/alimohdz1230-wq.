import React from 'react';
import { Sun, Moon, Monitor, Palette, Type, Sparkles, BookOpen } from 'lucide-react';
import {
  AccentTheme,
  AppSettings,
  BackgroundShade,
  DisplayMode,
  FontChoice,
} from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Display Mode */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3">
        <h3 className="text-base font-bold">1. نمط العرض</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(
            [
              {
                id: 'auto',
                label: 'تلقائي',
                desc: 'يتبع مظهر الجهاز تلقائيًا',
                swatch: 'linear-gradient(135deg, #f8faf9 50%, #0b1612 50%)',
                icon: Monitor,
              },
              {
                id: 'light',
                label: 'فاتح نهاري',
                desc: 'إضاءة نهارية واضحة ومريحة',
                swatch: '#ffffff',
                icon: Sun,
              },
              {
                id: 'warm-sepia',
                label: 'ورقي دافئ',
                desc: 'ألوان ورق المصحف الهادئة للعين',
                swatch: '#f4ebd8',
                icon: BookOpen,
              },
              {
                id: 'dark',
                label: 'ليلي داكن',
                desc: 'مريح للقراءة والعمل الليلي',
                swatch: '#0b1612',
                icon: Moon,
              },
              {
                id: 'emerald-night',
                label: 'ليلي زمردي عميق',
                desc: 'خلفية زمردية ليلية أنيقة',
                swatch: '#062119',
                icon: Sparkles,
              },
            ] as {
              id: DisplayMode;
              label: string;
              desc: string;
              swatch: string;
              icon: React.ComponentType<{ className?: string }>;
            }[]
          ).map((mode) => {
            const Icon = mode.icon;
            const active = settings.displayMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => update('displayMode', mode.id)}
                className={`p-3.5 rounded-xl border text-right transition-colors space-y-1.5 ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Icon className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span>{mode.label}</span>
                  </div>
                  <span
                    className="h-5 w-5 rounded-full border border-black/15 shrink-0"
                    style={{ background: mode.swatch }}
                  />
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Accent Color */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Palette className="h-4 w-4 text-[var(--accent-primary)]" />
          <span>2. اللون المميز</span>
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          يُطبق على الأزرار الرئيسية والبطاقات التفاعلية والتمييز في جميع أقسام التطبيق.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { id: 'emerald-teal', label: 'زمردي ملكي', swatch: '#066a5c' },
              { id: 'olive-leaf', label: 'أخضر زيتوني', swatch: '#556b2f' },
              { id: 'warm-gold', label: 'ذهبي دافئ', swatch: '#b47b14' },
              { id: 'classic-brown', label: 'بني تراثي', swatch: '#7c4a26' },
              { id: 'royal-navy', label: 'أزرق نيلي', swatch: '#1e4e79' },
              { id: 'deep-plum', label: 'عنابي أندلسي', swatch: '#7b2d43' },
              { id: 'sage-mint', label: 'أخضر ناعم', swatch: '#2e7d5b' },
              { id: 'slate-indigo', label: 'رمادي مزرق', swatch: '#3f556b' },
            ] as { id: AccentTheme; label: string; swatch: string }[]
          ).map((item) => {
            const active = settings.accentColor === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => update('accentColor', item.id)}
                className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] font-bold'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <span
                  className="h-6 w-6 rounded-full shrink-0 border border-black/15 shadow-2xs"
                  style={{ backgroundColor: item.swatch }}
                />
                <span className="text-xs sm:text-sm truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. App Background Shade (for cards and surfaces; main menu stays fixed light gray) */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3">
        <h3 className="text-base font-bold">3. لون خلفية البطاقات والنوافذ</h3>
        <p className="text-xs text-[var(--text-secondary)]">
          تبقى القائمة الرئيسية والشاشة الرئيسية باللون الرمادي الفاتح الثابت لوضوح القراءة.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { id: 'ivory', label: 'عاجي دافئ', color: '#faf5e8' },
              { id: 'pearl', label: 'لؤلؤي زمردي', color: '#eef6f2' },
              { id: 'sand', label: 'رملي هادئ', color: '#f2e8d5' },
              { id: 'pure', label: 'فاتح نقي', color: '#f6f8fa' },
              { id: 'olive-mist', label: 'نسيم زيتوني', color: '#eff3ea' },
              { id: 'sky-silk', label: 'سماوي هادئ', color: '#eef4fa' },
              { id: 'rose-cream', label: 'وردي حريري', color: '#f9eff2' },
              { id: 'warm-stone', label: 'حجري دافئ', color: '#f0eee9' },
            ] as { id: BackgroundShade; label: string; color: string }[]
          ).map((bg) => {
            const active = settings.backgroundShade === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => update('backgroundShade', bg.id)}
                className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)]'
                }`}
              >
                <span
                  className="h-5 w-5 rounded-md border border-black/15 shrink-0"
                  style={{ backgroundColor: bg.color }}
                />
                <span className="truncate">{bg.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Font Size */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Type className="h-4 w-4 text-[var(--accent-primary)]" />
            <span>4. حجم الخط الأساسي</span>
          </h3>
          <span className="text-sm font-bold text-[var(--accent-primary)]">
            {settings.fontSize}px
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => update('fontSize', Math.max(13, settings.fontSize - 1))}
            className="min-h-[42px] px-4 rounded-xl border border-[var(--border-hairline)] text-sm font-bold hover:bg-[var(--bg-subtle)]"
          >
            تصغير -
          </button>
          <input
            type="range"
            min={13}
            max={20}
            step={1}
            value={settings.fontSize}
            onChange={(e) => update('fontSize', Number(e.target.value))}
            className="flex-1 accent-[var(--accent-primary)]"
          />
          <button
            type="button"
            onClick={() => update('fontSize', Math.min(20, settings.fontSize + 1))}
            className="min-h-[42px] px-4 rounded-xl border border-[var(--border-hairline)] text-sm font-bold hover:bg-[var(--bg-subtle)]"
          >
            تكبير +
          </button>
        </div>
      </section>

      {/* 5. Unified App Font Family */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3">
        <h3 className="text-base font-bold">5. نوع الخط الموحد لكامل التطبيق</h3>
        <p className="text-xs text-[var(--text-secondary)]">
          يُطبق الخط المختار على جميع النصوص والأرقام والعناوين والقائمة الرئيسية في كامل التطبيق.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              {
                id: 'arfonts-cairo-medium',
                label: 'arfonts-cairo-medium',
                sample: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
                previewFont: '"Cairo", sans-serif',
              },
              {
                id: 'arfonts-al-jazeera-arabic',
                label: 'arfonts-al-jazeera-arabic',
                sample: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
                previewFont: '"Tajawal", sans-serif',
              },
              {
                id: 'arfonts-sultan-medium',
                label: 'arfonts-sultan-medium',
                sample: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
                previewFont: '"Readex Pro", sans-serif',
              },
            ] as { id: FontChoice; label: string; sample: string; previewFont: string }[]
          ).map((f) => {
            const active = settings.fontFamily === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => update('fontFamily', f.id)}
                className={`p-4 rounded-xl border text-right space-y-1.5 transition-colors ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <div className="text-xs font-bold text-[var(--accent-primary)]">{f.label}</div>
                <div className="text-sm font-semibold" style={{ fontFamily: f.previewFont }}>
                  {f.sample}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
