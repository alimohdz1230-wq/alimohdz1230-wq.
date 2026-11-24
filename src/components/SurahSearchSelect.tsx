import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, BookOpen } from 'lucide-react';
import { getSurahByNumber, searchSurahs, SurahInfo } from '../data/surahs';

interface SurahSearchSelectProps {
  value: number;
  onChange: (surah: SurahInfo) => void;
  label?: string;
}

export const SurahSearchSelect: React.FC<SurahSearchSelectProps> = ({
  value,
  onChange,
  label = 'السورة القرآنية',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => getSurahByNumber(value), [value]);
  const results = useMemo(() => searchSurahs(query), [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-between gap-2 text-right hover:border-[var(--accent-primary)] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
          <span className="font-semibold truncate">
            {selected.number}. سورة {selected.name}
          </span>
          <span className="text-xs text-[var(--text-secondary)] shrink-0 tabular-nums">
            ({selected.ayahCount} آية)
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-secondary)] shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-40 mt-1.5 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]/60">
            <div className="relative flex items-center">
              <Search className="h-4 w-4 text-[var(--text-secondary)] absolute right-3 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث باسم السورة أو رقمها (مثال: الجمعة، 62)..."
                className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border-hairline)]">
            {results.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
                لا توجد سورة مطابقة للبحث
              </div>
            ) : (
              results.map((surah) => {
                const isSelected = surah.number === value;
                return (
                  <button
                    key={surah.number}
                    type="button"
                    onClick={() => {
                      onChange(surah);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between text-sm transition-colors text-right min-h-[42px] ${
                      isSelected
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] font-bold'
                        : 'hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="tabular-nums">
                      {surah.number}. سورة {surah.name}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                      {surah.ayahCount} آية
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
