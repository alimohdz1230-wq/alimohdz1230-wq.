import { PrayerCalcMethod } from '../types';

export interface CityPreset {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CountryPreset {
  name: string;
  defaultMethod: PrayerCalcMethod;
  cities: CityPreset[];
}

export const COUNTRIES_DATA: CountryPreset[] = [
  {
    name: 'الجزائر',
    defaultMethod: 'MuslimWorldLeague',
    cities: [
      { name: 'الجزائر العاصمة', latitude: 36.7538, longitude: 3.0588 },
      { name: 'وهران', latitude: 35.6971, longitude: -0.6308 },
      { name: 'قسنطينة', latitude: 36.365, longitude: 6.6147 },
      { name: 'عنابة', latitude: 36.9, longitude: 7.7667 },
      { name: 'سطيف', latitude: 36.1911, longitude: 5.4137 },
      { name: 'باتنة', latitude: 35.5559, longitude: 6.1741 },
      { name: 'تلمسان', latitude: 34.8783, longitude: -1.315 },
      { name: 'بجاية', latitude: 36.7509, longitude: 5.0567 },
      { name: 'بسكرة', latitude: 34.8504, longitude: 5.7281 },
      { name: 'غرداية', latitude: 32.4909, longitude: 3.6735 },
      { name: 'ورقلة', latitude: 31.9493, longitude: 5.325 },
      { name: 'أدرار', latitude: 27.8743, longitude: -0.2939 },
      { name: 'تمنراست', latitude: 22.785, longitude: 5.5228 },
    ],
  },
  {
    name: 'المملكة العربية السعودية',
    defaultMethod: 'UmmAlQura',
    cities: [
      { name: 'مكة المكرمة', latitude: 21.3891, longitude: 39.8579 },
      { name: 'المدينة المنورة', latitude: 24.5247, longitude: 39.5692 },
      { name: 'الرياض', latitude: 24.7136, longitude: 46.6753 },
      { name: 'جدة', latitude: 21.4858, longitude: 39.1925 },
      { name: 'الدمام', latitude: 26.4207, longitude: 50.0888 },
      { name: 'الطائف', latitude: 21.2703, longitude: 40.4158 },
      { name: 'أبها', latitude: 18.2164, longitude: 42.5053 },
      { name: 'بريدة', latitude: 26.326, longitude: 43.975 },
    ],
  },
  {
    name: 'مصر',
    defaultMethod: 'Egyptian',
    cities: [
      { name: 'القاهرة', latitude: 30.0444, longitude: 31.2357 },
      { name: 'الإسكندرية', latitude: 31.2001, longitude: 29.9187 },
      { name: 'الجيزة', latitude: 30.0131, longitude: 31.2089 },
      { name: 'المنصورة', latitude: 31.0409, longitude: 31.3785 },
      { name: 'طنطا', latitude: 30.7865, longitude: 31.0004 },
      { name: 'أسيوط', latitude: 27.1783, longitude: 31.1859 },
      { name: 'أسوان', latitude: 24.0889, longitude: 32.8998 },
    ],
  },
  {
    name: 'المغرب',
    defaultMethod: 'MuslimWorldLeague',
    cities: [
      { name: 'الرباط', latitude: 34.0209, longitude: -6.8416 },
      { name: 'الدار البيضاء', latitude: 33.5731, longitude: -7.5898 },
      { name: 'فاس', latitude: 34.0181, longitude: -5.0078 },
      { name: 'مراكش', latitude: 31.6295, longitude: -7.9811 },
      { name: 'طنجة', latitude: 35.7595, longitude: -5.834 },
      { name: 'أكادير', latitude: 30.4278, longitude: -9.5981 },
    ],
  },
  {
    name: 'تونس',
    defaultMethod: 'MuslimWorldLeague',
    cities: [
      { name: 'تونس العاصمة', latitude: 36.8065, longitude: 10.1815 },
      { name: 'صفاقس', latitude: 34.7406, longitude: 10.7603 },
      { name: 'سوسة', latitude: 35.8256, longitude: 10.6369 },
      { name: 'القيروان', latitude: 35.6781, longitude: 10.0963 },
    ],
  },
  {
    name: 'ليبيا',
    defaultMethod: 'Egyptian',
    cities: [
      { name: 'طرابلس', latitude: 32.8872, longitude: 13.1913 },
      { name: 'بنغازي', latitude: 32.1167, longitude: 20.0667 },
      { name: 'مصراتة', latitude: 32.3754, longitude: 15.0925 },
    ],
  },
  {
    name: 'الإمارات العربية المتحدة',
    defaultMethod: 'Dubai',
    cities: [
      { name: 'أبوظبي', latitude: 24.4539, longitude: 54.3773 },
      { name: 'دبي', latitude: 25.2048, longitude: 55.2708 },
      { name: 'الشارقة', latitude: 25.3463, longitude: 55.4209 },
      { name: 'العين', latitude: 24.2075, longitude: 55.7447 },
    ],
  },
  {
    name: 'الأردن',
    defaultMethod: 'MuslimWorldLeague',
    cities: [
      { name: 'عمّان', latitude: 31.9454, longitude: 35.9284 },
      { name: 'إربد', latitude: 32.5568, longitude: 35.8469 },
      { name: 'الزرقاء', latitude: 32.0728, longitude: 36.088 },
    ],
  },
  {
    name: 'فلسطين',
    defaultMethod: 'MuslimWorldLeague',
    cities: [
      { name: 'القدس', latitude: 31.7683, longitude: 35.2137 },
      { name: 'غزة', latitude: 31.5017, longitude: 34.4668 },
      { name: 'الخليل', latitude: 31.5326, longitude: 35.0998 },
      { name: 'نابلس', latitude: 32.2211, longitude: 35.2544 },
    ],
  },
  {
    name: 'قطر',
    defaultMethod: 'Qatar',
    cities: [
      { name: 'الدوحة', latitude: 25.2854, longitude: 51.531 },
      { name: 'الوكرة', latitude: 25.1715, longitude: 51.6034 },
    ],
  },
  {
    name: 'الكويت',
    defaultMethod: 'Kuwait',
    cities: [
      { name: 'مدينة الكويت', latitude: 29.3759, longitude: 47.9774 },
      { name: 'حولي', latitude: 29.3328, longitude: 48.0286 },
    ],
  },
  {
    name: 'العراق',
    defaultMethod: 'MuslimWorldLeague',
    cities: [
      { name: 'بغداد', latitude: 33.3152, longitude: 44.3661 },
      { name: 'البصرة', latitude: 30.5085, longitude: 47.7804 },
      { name: 'الموصل', latitude: 36.335, longitude: 43.1189 },
    ],
  },
  {
    name: 'موريتانيا',
    defaultMethod: 'MuslimWorldLeague',
    cities: [
      { name: 'نواكشوط', latitude: 18.0735, longitude: -15.9582 },
      { name: 'نواذيبو', latitude: 20.9333, longitude: -17.0333 },
    ],
  },
  {
    name: 'السودان',
    defaultMethod: 'Egyptian',
    cities: [
      { name: 'الخرطوم', latitude: 15.5007, longitude: 32.5599 },
      { name: 'أم درمان', latitude: 15.6445, longitude: 32.4777 },
    ],
  },
  {
    name: 'تركيا',
    defaultMethod: 'MuslimWorldLeague',
    cities: [
      { name: 'إسطنبول', latitude: 41.0082, longitude: 28.9784 },
      { name: 'أنقرة', latitude: 39.9334, longitude: 32.8597 },
    ],
  },
];
