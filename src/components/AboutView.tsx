import React from 'react';
import {
  Users,
  FileText,
  Star,
  Clock,
  Smartphone,
  Sparkles,
} from 'lucide-react';

const APP_ICON_SRC = `${import.meta.env.BASE_URL}assets/aistudio/1795538688943_0884cac0.jpg`;

export const AboutView: React.FC = () => {
  const sections = [
    {
      icon: Users,
      title: 'إدارة الطلبة والحفظ والمراجعة',
      text: 'يتيح التطبيق إدارة تسجيلات الطلبة والأفواج، وتنظيم قوائم الطلاب، وتسجيل الحضور والغياب، ومتابعة الحفظ والمراجعة مع تحديد السور والآيات وتقييم مستوى الطالب في كل حصة.',
    },
    {
      icon: FileText,
      title: 'البرامج والتقارير وبطاقات QR',
      text: 'كما يوفر إمكانية إعداد البرامج الأسبوعية، ومتابعة الاشتراكات الشهرية، وتسجيل الإنجازات والأهداف، وعرض الإحصائيات، وإنشاء التقارير الدورية بصيغة PDF، إضافة إلى إصدار بطاقات تعريفية للطلاب مزودة برموز QR لتسهيل تسجيل الحضور.',
    },
    {
      icon: Star,
      title: 'اللوحة التحفيزية التفاعلية',
      text: 'ويضم التطبيق لوحة تحفيزية تفاعلية تعرض أسماء الطلاب وإنجازاتهم من خلال نظام النجوم، بما يعزز روح المنافسة الإيجابية ويشجع على الاجتهاد والاستمرار في الحفظ والمراجعة.',
    },
    {
      icon: Clock,
      title: 'مواقيت الصلاة وتخصيص المظهر',
      text: 'كما يوفر قسمًا خاصًا بمواقيت الصلاة يعتمد على الموقع الجغرافي للمسجد، مع إمكانية تخصيص مظهر التطبيق وألوانه وخطوطه بما يتناسب مع تفضيلات المستخدم.',
    },
    {
      icon: Smartphone,
      title: 'العمل دون إنترنت على أجهزة أندرويد',
      text: 'يعمل التطبيق على أجهزة أندرويد، مع إمكانية استخدام وظائفه دون الحاجة إلى الاتصال بالإنترنت، حيث تُحفظ البيانات محليًا على الجهاز.',
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header Banner */}
      <section className="rounded-2xl overflow-hidden border border-[#b8860b]/40 accent-header-gradient text-white shadow-sm">
        <div className="p-6 sm:p-7 flex items-start gap-4">
          <img
            src={APP_ICON_SRC}
            alt="إدارة حلقات تحفيظ القرآن الكريم"
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-2xl object-cover object-center bg-[#063434] border-2 border-[#f0cd67]/65 shadow-md shrink-0"
          />
          <div className="space-y-2 min-w-0">
            <div className="text-xs font-bold text-[#f0cd67]">عن التطبيق</div>
            <h1 className="text-xl sm:text-2xl font-extrabold leading-snug">
              إدارة حلقات تحفيظ القرآن الكريم
            </h1>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              تطبيق متكامل يهدف إلى تسهيل إدارة حلقات تحفيظ القرآن الكريم وتنظيم شؤون الطلبة،
              وتوفير بيئة تعليمية وتربوية تساعد الشيوخ والمعلمين على متابعة مسيرة الطلاب في
              حفظ كتاب الله ومراجعته.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Details Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <section
              key={sec.title}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 flex items-start gap-4"
            >
              <div className="h-11 w-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                  {sec.title}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {sec.text}
                </p>
              </div>
            </section>
          );
        })}
      </div>

      {/* Closing Summary Card */}
      <section className="rounded-2xl border border-[var(--accent-primary)]/25 bg-[var(--accent-soft)] p-5 flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-sm sm:text-base font-semibold leading-relaxed text-[var(--text-primary)]">
          إنه وسيلة رقمية تجمع بين التنظيم الإداري والمتابعة التعليمية والتحفيز التربوي،
          لتيسير عمل الشيوخ والارتقاء بأداء حلقات تحفيظ القرآن الكريم.
        </p>
      </section>
    </div>
  );
};
