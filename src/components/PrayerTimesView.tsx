import React, { useEffect, useMemo, useState } from 'react';
import {
  CalculationMethod,
  Coordinates,
  Prayer,
  PrayerTimes,
  Qibla,
  SunnahTimes,
} from 'adhan';
import {
  Bell,
  BellOff,
  ChevronDown,
  Compass,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react';
import { PrayerCalcMethod, PrayerSettings } from '../types';
import { COUNTRIES_DATA } from '../data/cities';
import {
  formatArabicWeekday,
  formatGregorianDate,
  formatHijriDate,
  getTodayISO,
} from '../utils/date';

interface PrayerTimesViewProps {
  prayerSettings: PrayerSettings;
  onUpdatePrayerSettings: (next: PrayerSettings) => void;
}

type PrayerTab = 'times' | 'info' | 'calendar' | 'location';

const DEFAULT_IQAMA: Record<string, number> = {
  fajr: 20,
  dhuhr: 13,
  asr: 13,
  maghrib: 7,
  isha: 13,
};

const METHOD_LABELS: { id: PrayerCalcMethod; label: string }[] = [
  { id: 'MuslimWorldLeague', label: 'رابطة العالم الإسلامي' },
  { id: 'UmmAlQura', label: 'أم القرى (مكة المكرمة)' },
  { id: 'Egyptian', label: 'الهيئة المصرية العامة للمساحة' },
  { id: 'Dubai', label: 'دائرة الشؤون الإسلامية بدبي' },
  { id: 'Qatar', label: 'تقويم قطر' },
  { id: 'Kuwait', label: 'وزارة الأوقاف الكويتية' },
  { id: 'Karachi', label: 'جامعة العلوم الإسلامية بكراتشي' },
];

function getAdhanParams(method: PrayerCalcMethod) {
  switch (method) {
    case 'UmmAlQura':
      return CalculationMethod.UmmAlQura();
    case 'Egyptian':
      return CalculationMethod.Egyptian();
    case 'Dubai':
      return CalculationMethod.Dubai();
    case 'Qatar':
      return CalculationMethod.Qatar();
    case 'Kuwait':
      return CalculationMethod.Kuwait();
    case 'Karachi':
      return CalculationMethod.Karachi();
    case 'MoonsightingCommittee':
      return CalculationMethod.MoonsightingCommittee();
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

function formatHHMM(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function formatCountdownHHMM(diffMs: number): string {
  const totalMinutes = Math.max(0, Math.ceil(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  prayerSettings,
  onUpdatePrayerSettings,
}) => {
  const [activeTab, setActiveTab] = useState<PrayerTab>('times');
  const [now, setNow] = useState<Date>(() => new Date());
  const [locating, setLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Keep live countdown ticking
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const selectedCountry =
    COUNTRIES_DATA.find((c) => c.name === prayerSettings.country) || COUNTRIES_DATA[0];

  const today = getTodayISO();
  const iqamaMap = prayerSettings.iqamaOffsets || DEFAULT_IQAMA;
  const mutedMap = prayerSettings.mutedPrayers || {};

  const calculated = useMemo(() => {
    const coords = new Coordinates(prayerSettings.latitude, prayerSettings.longitude);
    const params = getAdhanParams(prayerSettings.method);
    const pt = new PrayerTimes(coords, now, params);
    const sunnah = new SunnahTimes(pt);
    const qiblaDeg = Math.round(Qibla(coords));

    let nextPrayer = pt.nextPrayer(now);
    let nextTime = pt.timeForPrayer(nextPrayer);

    // If after Isha (Prayer.None), compute tomorrow's Fajr for countdown
    if (nextPrayer === Prayer.None || !nextTime) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowPt = new PrayerTimes(coords, tomorrow, params);
      nextPrayer = Prayer.Fajr;
      nextTime = tomorrowPt.fajr;
    }

    const nextNameMap: Record<string, string> = {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    };

    const countdown = formatCountdownHHMM(nextTime.getTime() - now.getTime());

    const cards = [
      {
        key: 'fajr',
        name: 'الفجر',
        time: formatHHMM(pt.fajr),
        offset: iqamaMap.fajr ?? 20,
        isNext: nextPrayer === Prayer.Fajr,
      },
      {
        key: 'sunrise',
        name: 'الشروق',
        time: formatHHMM(pt.sunrise),
        offset: null as number | null,
        isNext: nextPrayer === Prayer.Sunrise,
      },
      {
        key: 'dhuhr',
        name: 'الظهر',
        time: formatHHMM(pt.dhuhr),
        offset: iqamaMap.dhuhr ?? 13,
        isNext: nextPrayer === Prayer.Dhuhr,
      },
      {
        key: 'asr',
        name: 'العصر',
        time: formatHHMM(pt.asr),
        offset: iqamaMap.asr ?? 13,
        isNext: nextPrayer === Prayer.Asr,
      },
      {
        key: 'maghrib',
        name: 'المغرب',
        time: formatHHMM(pt.maghrib),
        offset: iqamaMap.maghrib ?? 7,
        isNext: nextPrayer === Prayer.Maghrib,
      },
      {
        key: 'isha',
        name: 'العشاء',
        time: formatHHMM(pt.isha),
        offset: iqamaMap.isha ?? 13,
        isNext: nextPrayer === Prayer.Isha,
      },
    ];

    const extras = [
      { key: 'jumuah', name: 'الجمعة', time: formatHHMM(pt.dhuhr) },
      { key: 'midnight', name: 'نصف الليل', time: formatHHMM(sunnah.middleOfTheNight) },
      { key: 'lastthird', name: 'الثلث الأخير', time: formatHHMM(sunnah.lastThirdOfTheNight) },
    ];

    return {
      cards,
      extras,
      nextName: nextNameMap[nextPrayer] || 'الفجر',
      countdown,
      qiblaDeg,
      params,
    };
  }, [prayerSettings, now, iqamaMap]);

  // Monthly Calendar for the Calendar tab
  const monthlyRows = useMemo(() => {
    if (activeTab !== 'calendar') return [];
    const coords = new Coordinates(prayerSettings.latitude, prayerSettings.longitude);
    const params = getAdhanParams(prayerSettings.method);
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d, 12, 0, 0);
      const pt = new PrayerTimes(coords, dt, params);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      rows.push({
        iso,
        day: d,
        isToday: iso === today,
        fajr: formatHHMM(pt.fajr),
        sunrise: formatHHMM(pt.sunrise),
        dhuhr: formatHHMM(pt.dhuhr),
        asr: formatHHMM(pt.asr),
        maghrib: formatHHMM(pt.maghrib),
        isha: formatHHMM(pt.isha),
      });
    }
    return rows;
  }, [activeTab, prayerSettings, now, today]);

  const allMuted = calculated.cards.every((c) => Boolean(mutedMap[c.key]));

  const toggleAllMute = () => {
    const nextVal = !allMuted;
    const nextMuted: Record<string, boolean> = {};
    calculated.cards.forEach((c) => {
      nextMuted[c.key] = nextVal;
    });
    onUpdatePrayerSettings({
      ...prayerSettings,
      mutedPrayers: nextMuted,
    });
  };

  const toggleSingleMute = (key: string) => {
    onUpdatePrayerSettings({
      ...prayerSettings,
      mutedPrayers: {
        ...mutedMap,
        [key]: !mutedMap[key],
      },
    });
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('خاصية GPS غير متوفرة في هذا المتصفح.');
      return;
    }
    setLocating(true);
    setGpsStatus('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onUpdatePrayerSettings({
          ...prayerSettings,
          mode: 'gps',
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        });
        setLocating(false);
        setGpsStatus('تم تحديد إحداثيات المسجد وحساب المواقيت بدقة.');
      },
      () => {
        setLocating(false);
        setGpsStatus('تعذر الحصول على الموقع تلقائيًا، يرجى تفعيل GPS أو اختيار المدينة يدويًا.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const schoolTitle = prayerSettings.mosqueName.trim() || 'المدرسة القرآنية';
  const locationDisplay =
    prayerSettings.mode === 'gps'
      ? `${schoolTitle} - موقع GPS (${prayerSettings.latitude}, ${prayerSettings.longitude})`
      : `${schoolTitle} - ${prayerSettings.country} (${prayerSettings.city})`;

  const searchedCities = useMemo(() => {
    const q = citySearch.trim();
    if (!q) return [];
    const matches: { country: string; city: string; latitude: number; longitude: number; method: PrayerCalcMethod }[] = [];
    COUNTRIES_DATA.forEach((c) => {
      c.cities.forEach((ct) => {
        if (ct.name.includes(q) || c.name.includes(q)) {
          matches.push({
            country: c.name,
            city: ct.name,
            latitude: ct.latitude,
            longitude: ct.longitude,
            method: c.defaultMethod,
          });
        }
      });
    });
    return matches;
  }, [citySearch]);

  return (
    <div className="max-w-xl mx-auto">
      {/* Main Container Adapting Dynamically to App Theme & Colors */}
      <div className="relative overflow-hidden rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-sm">
        {/* Soft Dynamic Curved Ribbon Backdrop at Top */}
        <div className="relative px-5 pt-6 pb-5 overflow-hidden bg-[var(--bg-canvas)]/70">
          <svg
            aria-hidden="true"
            viewBox="0 0 400 180"
            className="pointer-events-none absolute inset-0 w-full h-full opacity-25 text-[var(--accent-primary)]"
            preserveAspectRatio="none"
          >
            <path
              d="M-30,170 C90,145 145,45 110,-20"
              fill="none"
              stroke="currentColor"
              strokeWidth="22"
              strokeOpacity="0.22"
            />
            <path
              d="M275,-20 C340,35 385,110 420,165"
              fill="none"
              stroke="currentColor"
              strokeWidth="26"
              strokeOpacity="0.18"
            />
          </svg>

          {/* 1. Top Header: Next Prayer Countdown (Right) & Action Circles (Left) */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)] whitespace-nowrap">
                {calculated.nextName} بعد
              </span>
              <span className="text-4xl sm:text-[42px] leading-none font-extrabold font-mono-num text-[var(--accent-primary)] tracking-tight">
                {calculated.countdown}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleAllMute}
                className="h-11 w-11 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-hairline)] shadow-xs flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                title={allMuted ? 'تفعيل تنبيهات الآذان' : 'كتم جميع تنبيهات الآذان'}
                aria-label="تبديل تنبيهات الآذان"
              >
                {allMuted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('location')}
                className="h-11 w-11 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-hairline)] shadow-xs flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                title="البحث عن مدينة أو تحديد الموقع"
                aria-label="البحث عن الموقع"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 2. Location Selector Pill Bar */}
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className="relative z-10 mt-4 w-full rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-2.5 py-2 flex items-center justify-between gap-3 shadow-xs hover:border-[var(--accent-primary)] transition-colors text-right"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-9 w-9 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                {locationDisplay}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--text-secondary)] ml-2 shrink-0" />
          </button>

          {/* 3. Dual Date Line */}
          <div className="relative z-10 mt-4 text-center text-xs text-[var(--text-secondary)] flex flex-wrap items-center justify-center gap-2">
            <span>
              {formatArabicWeekday(today)}، {formatHijriDate(today)}
            </span>
            <span aria-hidden="true">|</span>
            <span>
              {formatArabicWeekday(today)}، {formatGregorianDate(today)}
            </span>
          </div>

          {/* 4. 4-Tab Bar */}
          <div className="relative z-10 mt-5 flex items-center justify-between gap-1">
            {(
              [
                { id: 'times', label: 'أوقات الصلاة' },
                { id: 'info', label: 'المعلومات' },
                { id: 'calendar', label: 'التقويم' },
                { id: 'location', label: 'الموقع' },
              ] as { id: PrayerTab; label: string }[]
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 space-y-3 bg-[var(--bg-surface)]">
          {activeTab === 'times' && (
            <>
              {/* 6 Main Prayer Cards (3 columns x 2 rows) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                {calculated.cards.map((card) => {
                  const isMuted = Boolean(mutedMap[card.key]);
                  return (
                    <div
                      key={card.key}
                      className={`rounded-2xl px-2.5 py-4 sm:p-4 flex flex-col items-center justify-between gap-2.5 min-h-[164px] transition-colors ${
                        card.isNext
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
                          : 'bg-[var(--bg-subtle)]/75 dark:bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-primary)]'
                      }`}
                    >
                      <div
                        className={`text-xs sm:text-sm font-semibold ${
                          card.isNext ? 'opacity-95' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {card.name}
                      </div>

                      <div className="text-2xl sm:text-[28px] leading-none font-extrabold font-mono-num tracking-tight">
                        {card.time}
                      </div>

                      <div
                        className={`text-xs font-bold font-mono-num h-4 ${
                          card.isNext ? 'opacity-95' : 'text-[var(--accent-primary)]'
                        }`}
                      >
                        {card.offset !== null ? `+${card.offset}` : ''}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSingleMute(card.key)}
                        className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                          card.isNext
                            ? 'bg-black/15 border border-white/25 text-[var(--accent-contrast)] hover:bg-black/25'
                            : 'bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                        }`}
                        aria-label={`تنبيه ${card.name}`}
                      >
                        {isMuted ? (
                          <BellOff className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom 3 Compact Cards: الجمعة · نصف الليل · الثلث الأخير */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
                {calculated.extras.map((ex) => (
                  <div
                    key={ex.key}
                    className="rounded-2xl bg-[var(--bg-subtle)]/75 dark:bg-[var(--bg-canvas)] border border-[var(--border-hairline)] px-2 py-4 text-center space-y-1.5"
                  >
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">
                      {ex.name}
                    </div>
                    <div className="text-xl sm:text-2xl leading-none font-extrabold font-mono-num text-[var(--text-primary)]">
                      {ex.time}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-hairline)]">
                  <div className="text-[var(--text-secondary)]">اتجاه القبلة</div>
                  <div className="text-lg font-bold font-mono-num text-[var(--accent-primary)] mt-1">
                    {calculated.qiblaDeg}°
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-hairline)]">
                  <div className="text-[var(--text-secondary)]">زوايا الفجر / العشاء</div>
                  <div className="text-lg font-bold font-mono-num mt-1">
                    {calculated.params.fajrAngle}° / {calculated.params.ishaAngle}°
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-3">
                <div className="text-sm font-bold">دقائق الإقامة بعد الآذان (+)</div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: 'fajr', label: 'الفجر' },
                    { key: 'dhuhr', label: 'الظهر' },
                    { key: 'asr', label: 'العصر' },
                    { key: 'maghrib', label: 'المغرب' },
                    { key: 'isha', label: 'العشاء' },
                  ].map((item) => (
                    <div key={item.key} className="text-center space-y-1">
                      <label className="block text-[11px] text-[var(--text-secondary)]">
                        {item.label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={iqamaMap[item.key] ?? 10}
                        onChange={(e) =>
                          onUpdatePrayerSettings({
                            ...prayerSettings,
                            iqamaOffsets: {
                              ...iqamaMap,
                              [item.key]: Math.max(0, Number(e.target.value) || 0),
                            },
                          })
                        }
                        className="w-full min-h-[38px] text-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-mono-num font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-2xl border border-[var(--border-hairline)]">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="sticky top-0 bg-[var(--accent-primary)] text-[var(--accent-contrast)]">
                  <tr>
                    <th className="py-2.5 px-2">اليوم</th>
                    <th className="py-2.5 px-1.5">الفجر</th>
                    <th className="py-2.5 px-1.5">الشروق</th>
                    <th className="py-2.5 px-1.5">الظهر</th>
                    <th className="py-2.5 px-1.5">العصر</th>
                    <th className="py-2.5 px-1.5">المغرب</th>
                    <th className="py-2.5 px-1.5">العشاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)] font-mono-num">
                  {monthlyRows.map((row) => (
                    <tr
                      key={row.iso}
                      className={
                        row.isToday
                          ? 'bg-[var(--accent-soft)] font-bold text-[var(--accent-primary)]'
                          : 'hover:bg-[var(--bg-subtle)]/40'
                      }
                    >
                      <td className="py-2 px-2">{row.day}</td>
                      <td className="py-2 px-1.5">{row.fajr}</td>
                      <td className="py-2 px-1.5">{row.sunrise}</td>
                      <td className="py-2 px-1.5">{row.dhuhr}</td>
                      <td className="py-2 px-1.5">{row.asr}</td>
                      <td className="py-2 px-1.5">{row.maghrib}</td>
                      <td className="py-2 px-1.5">{row.isha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-4">
              {/* Quick City Search */}
              <div className="relative">
                <Search className="h-4 w-4 text-[var(--text-secondary)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="ابحث عن المدينة أو البلد..."
                  className="w-full min-h-[42px] pr-9 pl-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm"
                />
              </div>

              {searchedCities.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)]">
                  {searchedCities.map((item) => (
                    <button
                      key={`${item.country}_${item.city}`}
                      type="button"
                      onClick={() => {
                        onUpdatePrayerSettings({
                          ...prayerSettings,
                          mode: 'manual',
                          country: item.country,
                          city: item.city,
                          latitude: item.latitude,
                          longitude: item.longitude,
                          method: item.method,
                        });
                        setCitySearch('');
                        setActiveTab('times');
                      }}
                      className="w-full px-3.5 py-2 text-right text-xs hover:bg-[var(--bg-subtle)] flex items-center justify-between"
                    >
                      <span className="font-bold">{item.city}</span>
                      <span className="text-[var(--text-secondary)]">{item.country}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Method 1: GPS */}
              <div className="p-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] space-y-2.5">
                <div className="text-xs font-bold flex items-center gap-1.5 text-[var(--accent-primary)]">
                  <Navigation className="h-4 w-4" />
                  <span>تحديد الموقع عبر GPS</span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] font-mono-num">
                  {prayerSettings.latitude}, {prayerSettings.longitude}
                </div>
                <button
                  type="button"
                  disabled={locating}
                  onClick={handleGPS}
                  className="w-full min-h-[42px] rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                  <MapPin className="h-4 w-4" />
                  <span>{locating ? 'جارٍ التحديد...' : 'تحديد موقع المسجد تلقائيًا'}</span>
                </button>
                {gpsStatus && <div className="text-xs text-[var(--accent-primary)]">{gpsStatus}</div>}
              </div>

              {/* Method 2: Manual Country & City */}
              <div className="p-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] space-y-3">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-[var(--accent-primary)]" />
                  <span>الاختيار اليدوي للبلد والمدينة</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={selectedCountry.name}
                    onChange={(e) => {
                      const c =
                        COUNTRIES_DATA.find((x) => x.name === e.target.value) || COUNTRIES_DATA[0];
                      const firstCity = c.cities[0];
                      onUpdatePrayerSettings({
                        ...prayerSettings,
                        mode: 'manual',
                        country: c.name,
                        city: firstCity.name,
                        latitude: firstCity.latitude,
                        longitude: firstCity.longitude,
                        method: c.defaultMethod,
                      });
                    }}
                    className="min-h-[40px] px-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs"
                  >
                    {COUNTRIES_DATA.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={prayerSettings.city}
                    onChange={(e) => {
                      const ct =
                        selectedCountry.cities.find((x) => x.name === e.target.value) ||
                        selectedCountry.cities[0];
                      onUpdatePrayerSettings({
                        ...prayerSettings,
                        mode: 'manual',
                        city: ct.name,
                        latitude: ct.latitude,
                        longitude: ct.longitude,
                      });
                    }}
                    className="min-h-[40px] px-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs"
                  >
                    {selectedCountry.cities.map((ct) => (
                      <option key={ct.name} value={ct.name}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={prayerSettings.method}
                  onChange={(e) =>
                    onUpdatePrayerSettings({
                      ...prayerSettings,
                      method: e.target.value as PrayerCalcMethod,
                    })
                  }
                  className="w-full min-h-[40px] px-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs"
                >
                  {METHOD_LABELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
