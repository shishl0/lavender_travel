"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { track } from "@/lib/track";

/* ========= utils ========= */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const phoneDigits = (masked: string) => masked.replace(/\D/g, "");
const isPhoneValid = (masked: string) => {
  const d = phoneDigits(masked);
  return d.length === 11 && d.startsWith("7");
};
const formatKzPhone = (raw: string) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  const r = d.slice(1);
  const g1 = r.slice(0, 3), g2 = r.slice(3, 6), g3 = r.slice(6, 8), g4 = r.slice(8, 10);
  return ["+7", g1 && " " + g1, g2 && " " + g2, g3 && " " + g3, g4 && " " + g4].filter(Boolean).join("");
};
const waNumberToDigits = (whats?: string | null): string | null => {
  if (!whats) return null;
  let d = whats.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  return d.length === 11 ? d : null;
};
const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

/* ===== Dissolve helper ===== */
function useDissolve(isOpen: boolean, duration = 280) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), duration);
      return () => clearTimeout(t);
    }
  }, [isOpen, duration]);
  return { mounted, visible };
}

function Dissolve({
  open,
  className = "",
  style,
  children,
}: {
  open: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { mounted, visible } = useDissolve(open, 280);
  if (!mounted) return null;

  const stopAll = (e: any) => {
    e.stopPropagation?.();
    e.nativeEvent?.stopImmediatePropagation?.();
  };

  return (
    <div
      className={`${className} dissolve ${visible ? "is-open" : ""}`}
      style={style}
      onMouseDownCapture={stopAll}
      onPointerDownCapture={stopAll}
      onTouchStartCapture={stopAll}
      onClick={stopAll}
      onMouseDown={stopAll}
      onPointerDown={stopAll}
      onTouchStart={stopAll}
    >
      {children}
    </div>
  );
}

/* якорный поповер */
function useAnchoredPopover(
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  { maxWidth = 980, margin = 8, align = "segment" as "segment" | "center" | "right" } = {}
) {
  const [pos, setPos] = useState({ left: 0, width: 320 });

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;

      const vw = window.innerWidth;
      const width = Math.min(vw - margin * 2, maxWidth);

      let leftInViewportWanted: number;
      if (align === "center") {
        leftInViewportWanted = Math.round((vw - width) / 2);
      } else if (align === "right") {
        leftInViewportWanted = r.right - width;
      } else {
        leftInViewportWanted = r.left + r.width / 2 - width / 2;
      }

      const leftInViewport = Math.max(margin, Math.min(vw - width - margin, leftInViewportWanted));
      const left = Math.round(leftInViewport - r.left);
      setPos({ left, width });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [anchorRef, open, maxWidth, margin, align]);

  return pos;
}

/* ========= данные стран/городов ========= */
type Country = { code: string; name: string; flag: string; cities: string[] };
const COUNTRIES: Country[] = [
  { code: "tr", name: "Турция", flag: "🇹🇷", cities: ["Аланья","Анкара","Анталья","Афьон","Белек","Бодрум","Даламан","Каппадокия","Кемер","Мармарис","Олимпос","Сиде","Стамбул","Фетхие","Ялова"] },
  { code: "vn", name: "Вьетнам", flag: "🇻🇳", cities: ["Дананг","Нячанг","Фантьет","Фукуок","Хойан","Хюэ"] },
  { code: "eg", name: "Египет", flag: "🇪🇬", cities: ["Александрия","Каир","Нувейба","Хургада","Шарм-эль-Шейх"] },
  { code: "th", name: "Таиланд", flag: "🇹🇭", cities: ["Бангкок","Као Лак","Ко Чанг","Ко Яо Нои","Ко Яо Яй","Краби","Ланта","Остров Мапрао","Остров Нака","Остров Рача","Паттайя","Пханг-Нга","Пхетчхабури","Пхи-Пхи","Пхукет","Самуи","Хуа Хин"] },
  { code: "ae", name: "ОАЭ", flag: "🇦🇪", cities: ["Абу-Даби","Аджман","Дубай","Рас-эль-Хайма","Умм-Аль-Кувейн","Фуджейра","Шарджа"] },
  { code: "cn", name: "Китай", flag: "🇨🇳", cities: ["Гуанчжоу","о. Хайнань","Пекин","Синьцзян-Уйгурский автономный район","Чжэцзян","Шанхай"] },
  { code: "mv", name: "Мальдивы", flag: "🇲🇻", cities: ["Мальдивы","Северный Ари Атолл"] },
  { code: "ge", name: "Грузия", flag: "🇬🇪", cities: ["Бакуриани","Батуми","Боржоми","Гонио","Гудаури","Казбеги","Кахетия","Кобулети","Кутаиси","Саирме","Самцхе-Джавахети","Сванети","Тбилиси","Уреки","Цалка","Цинандали","Цхалтубо","Шекветили"] },
  { code: "id", name: "Индонезия", flag: "🇮🇩", cities: ["Бали","Западные Малые Зондские острова","Куала-Лумпур"] },
  { code: "gr", name: "Греция", flag: "🇬🇷", cities: ["Афины и Аттика","Корфу","Крит","Миконос"] },
  { code: "it", name: "Италия", flag: "🇮🇹", cities: ["Адриатическая Ривьера","Венецианская Ривьера","Лацио","Лигурия","Ломбардия","Милан","Ривьера-ди-Улиссе","Рим","Сардиния","Сицилия"] },
  { code: "qa", name: "Катар", flag: "🇶🇦", cities: ["Аль-Райян","Аш-Шамаль","Доха","Доха - городские отели","Доха - пляжные отели","Рас Абрук","Эль-Хаур","Эр-Рувайс"] },
];

/* ========= Календарь (2 месяца, выбор диапазона) ========= */
function RangeCalendar({
  start,
  end,
  onChange,
  minDate,
  country,
  city,
}: {
  start?: string;
  end?: string;
  onChange: (v: { start: string; end: string }) => void;
  minDate?: string;
  country?: string;
  city?: string;
}) {
  const { t, i18n } = useTranslation();

  const [cursor, setCursor] = useState<Date>(() => (start ? new Date(start) : new Date()));
  const [p1, p2] = useMemo(() => {
    const m1 = startOfMonth(cursor);
    const m2 = startOfMonth(addDays(m1, 40));
    return [m1, m2];
  }, [cursor]);

  const parse = (s?: string) => (s ? new Date(`${s}T00:00:00`) : null);
  const s = parse(start);
  const e = parse(end);
  const min = parse(minDate || fmt(new Date()));
  const ms = 86400000;
  const nightsNow = s && e ? Math.max(1, Math.ceil((+e - +s) / ms)) : 1;

  // будни из i18n
  const weekdays: string[] = t("cal.weekdaysShort", { returnObjects: true }) as any;

  const weeksFor = (m: Date) => {
    const first = startOfMonth(m);
    const startIdx = (first.getDay() + 6) % 7; // Пн..Вс
    const days: (Date | null)[] = Array.from({ length: startIdx }, () => null);
    const total = endOfMonth(m).getDate();
    for (let d = 1; d <= total; d++) days.push(new Date(m.getFullYear(), m.getMonth(), d));
    while (days.length % 7) days.push(null);
    return Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  };

  const isSame = (a?: Date | null, b?: Date | null) => !!a && !!b && a.toDateString() === b.toDateString();
  const isBetween = (d?: Date | null, a?: Date | null, b?: Date | null) => !!d && !!a && !!b && d > a && d < b;

  const clickDay = (d: Date) => {
    if (min && d < min) return;

    if (!s || (s && e)) {
      setCursor(d);
      onChange({ start: fmt(d), end: "" as unknown as string });
      return;
    }
    if (s && !e) {
      if (+d < +s) {
        setCursor(d);
        onChange({ start: fmt(d), end: "" as unknown as string });
      } else if (d.toDateString() === s.toDateString()) {
        onChange({ start: fmt(s), end: fmt(s) });
      } else {
        onChange({ start: fmt(s), end: fmt(d) });
      }
    }
  };

  const Month = ({ m }: { m: Date }) => (
    <div className="cal cal--compact">
      <div className="cal-head">{m.toLocaleString(i18n.language || "ru-RU", { month: "long", year: "numeric" })}</div>
      <div className="cal-grid">
        {weekdays.map((d) => (
          <div key={d} className="cal-wd">{d}</div>
        ))}
        {weeksFor(m).flat().map((d, i) => {
          const disabled: boolean = !d || (!!min && !!d && d < min);
          const selStart = !!d && !!s && isSame(d, s);
          const selEnd = !!d && !!e && isSame(d, e);
          const inrange = !!d && !!s && !!e && isBetween(d, s, e);
          const cls = [
            "cal-day",
            disabled ? "is-disabled" : "",
            selStart || selEnd ? "is-selected" : "",
            inrange ? "is-inrange" : "",
            d && isSame(d, new Date()) ? "is-today" : "",
          ].join(" ");
          return (
            <button
              key={i}
              className={cls}
              type="button"
              disabled={disabled}
              onClick={() => d && clickDay(d)}
            >
              {d && <span className="cal-num">{d.getDate()}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div className="cal-row">
        <div className="cal-nav">
          <button type="button" className="btn btn-surface btn-sm" onClick={() => setCursor(addDays(startOfMonth(cursor), -1))}>
            {t("cal.prev")}
          </button>
          <button type="button" className="btn btn-surface btn-sm" onClick={() => setCursor(addDays(startOfMonth(cursor), 40))}>
            {t("cal.next")}
          </button>
        </div>
        <div className="cal-months">
          <Month m={p1} />
          <Month m={p2} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-gray-600">{t("cal.nightsLabel")}</span>
        <button
          type="button"
          className="btn btn-surface btn-sm press"
          onClick={() => {
            const n = Math.max(1, nightsNow - 1);
            const from = s ?? new Date(fmt(new Date()));
            onChange({ start: fmt(from), end: fmt(addDays(from, n)) });
          }}
        >−</button>
        <div className="w-10 text-center font-semibold">{nightsNow}</div>
        <button
          type="button"
          className="btn btn-surface btn-sm press"
          onClick={() => {
            const n = Math.max(1, nightsNow + 1);
            const from = s ?? new Date(fmt(new Date()));
            onChange({ start: fmt(from), end: fmt(addDays(from, n)) });
          }}
        >+</button>
      </div>
    </div>
  );
}

/* ========= SelectTour ========= */
export default function SelectTour({
  align = "left",
  label,
  waDigits = "77080086191",
}: {
  align?: "left" | "center" | "right";
  label?: string; // если не передать — возьмём t("hero.ctaPrimary")
  waDigits?: string;
}) {
  const { t, i18n } = useTranslation();
  const bcp47 = useMemo(() => {
    const l = (i18n.language || "ru").slice(0,2);
    return l === "kk" ? "kk-KZ" : l === "en" ? "en-US" : "ru-RU";
  }, [i18n.language]);

  // Country labels by locale (via Intl.DisplayNames, fallback to RU name)
  const regionCode: Record<string,string> = { tr: "TR", vn: "VN", eg: "EG", th: "TH", ae: "AE", cn: "CN", mv: "MV", ge: "GE", id: "ID", gr: "GR", it: "IT", qa: "QA" };
  const countryLabel = (code: string) => {
    const lang2 = (i18n.language || "ru").slice(0, 2) as "ru" | "kk" | "en";
    // Overrides for ambiguous DisplayNames (e.g., Mainland China)
    const overrides: Record<string, Partial<Record<typeof lang2, string>>> = {
      cn: { ru: "Китай", kk: "Қытай", en: "China" },
      ae: { ru: "ОАЭ", kk: "БАӘ", en: "UAE" },
    };
    const ov = (overrides[code] || {})[lang2];
    if (ov && ov.trim()) return ov;

    try {
      const tag = bcp47;
      // Some iOS/old Safari may lack kk; fallback handled by try/catch
      const dn = new (Intl as any).DisplayNames([tag], { type: "region" });
      const name = dn.of(regionCode[code] || code.toUpperCase());
      if (typeof name === "string" && name.trim()) return name;
    } catch {}
    return COUNTRIES.find((c) => c.code === code)?.name || code.toUpperCase();
  };
  const countryCodeFromLabel = (label?: string | null): string | null => {
    if (!label) return null;
    for (const c of COUNTRIES) {
      if (c.name === label) return c.code;
      try {
        const dn = new (Intl as any).DisplayNames([bcp47], { type: "region" });
        const loc = dn.of(regionCode[c.code] || c.code.toUpperCase());
        if (loc === label) return c.code;
        // Check override mapping as well
        const lang2 = (i18n.language || "ru").slice(0, 2) as "ru" | "kk" | "en";
        const overrides: Record<string, Partial<Record<typeof lang2, string>>> = {
          cn: { ru: "Китай", kk: "Қытай", en: "China" },
          ae: { ru: "ОАЭ", kk: "БАӘ", en: "UAE" },
        };
        const ov = (overrides[c.code] || {})[lang2];
        if (ov && ov === label) return c.code;
      } catch {}
    }
    return null;
  };

  // Departure labels by locale
  const depMap = {
    ru: { ala: "Алматы", nqz: "Астана" },
    kk: { ala: "Алматы", nqz: "Астана" },
    en: { ala: "Almaty", nqz: "Astana" },
  } as const;
  const depLabel = (code: "ala" | "nqz") => {
    const l = (i18n.language || "ru").slice(0,2) as "ru"|"kk"|"en";
    return (depMap[l] ?? depMap.ru)[code];
  };
  const detectDepCode = (label: string): ("ala"|"nqz") | null => {
    const vals = [depMap.ru, depMap.kk, depMap.en];
    for (const set of vals) {
      if (set.ala === label) return "ala";
      if (set.nqz === label) return "nqz";
    }
    return null;
  };
  const btnText = label ?? t("hero.ctaPrimary");

  /* кнопка → форма */
  const [editing, setEditing] = useState(false);

  /* state формы */
  const [departure, setDeparture] = useState<string>(depLabel("ala"));
  const [country, setCountry] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const tourText = country ? (city ? `${country}, ${city}` : country) : "";

  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const ms = 86400000;
    const a = new Date(`${checkIn}T00:00:00`);
    const b = new Date(`${checkOut}T00:00:00`);
    return Math.max(0, Math.ceil((+b - +a) / ms));
  }, [checkIn, checkOut]);

  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  /* локальное сохранение */
  const LS_KEY = "hero_form_v2";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const v = JSON.parse(raw);
      setDeparture(v.departure ?? depLabel("ala"));
      setCountry(v.country ?? "");
      setCity(v.city ?? "");
      setCheckIn(v.checkIn ?? "");
      setCheckOut(v.checkOut ?? "");
      setAdults(v.adults ?? 2);
      setChildrenCount(v.childrenCount ?? 0);
      setChildrenAges(v.childrenAges ?? []);
      setName(v.name ?? "");
      setPhone(v.phone ?? "");
      setMessage(v.message ?? "");
    } catch {}
  }, []);
  useEffect(() => {
    const v = { departure, country, city, checkIn, checkOut, adults, childrenCount, childrenAges, name, phone, message };
    try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
  }, [departure, country, city, checkIn, checkOut, adults, childrenCount, childrenAges, name, phone, message]);

  // Релокализуем выбранные значения при смене языка
  useEffect(() => {
    // departure
    if (departure) {
      const code = detectDepCode(departure);
      if (code) {
        const next = depLabel(code);
        if (next !== departure) setDeparture(next);
      }
    }
    // country
    if (country) {
      const code = countryCodeFromLabel(country);
      if (code) {
        const next = countryLabel(code);
        if (next !== country) setCountry(next);
      }
    }
  }, [bcp47]);

  /* раскрытые поповеры */
  const [openSeg, setOpenSeg] = useState<null | string>(null);

  useEffect(() => {
    const isInsideSeg = (ev: MouseEvent | PointerEvent) => {
      const path = (ev as any).composedPath?.() ?? [];
      if (Array.isArray(path) && path.some((n: any) =>
        n instanceof Element && (n.classList?.contains("seg-pop") || n.classList?.contains("search-seg"))
      )) return true;
      const el = (ev.target as Element | null)?.closest?.(".seg-pop, .search-seg");
      return !!el;
    };

    const onOutside = (e: MouseEvent) => { if (openSeg && !isInsideSeg(e)) setOpenSeg(null); };
    const onPointerOutside = (e: PointerEvent) => { if (openSeg && !isInsideSeg(e)) setOpenSeg(null); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenSeg(null); };

    document.addEventListener("click", onOutside);
    document.addEventListener("pointerdown", onPointerOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onOutside);
      document.removeEventListener("pointerdown", onPointerOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openSeg]);

  /* дети: синхрон возрастов */
  useEffect(() => {
    setChildrenAges((prev) => {
      const c = clamp(childrenCount, 0, 6);
      if (prev.length < c) return [...prev, ...Array.from({ length: c - prev.length }, () => 5)];
      return prev.slice(0, c);
    });
  }, [childrenCount]);

  /* телефон автоформат */
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const onPhoneFocus = () => {
    setPhone((p) => (p ? formatKzPhone(p) : "+7 "));
    requestAnimationFrame(() => {
      const el = phoneRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    });
  };
  const onPhoneKeyUp = () => setPhone((p) => formatKzPhone(p));
  const onPhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setPhone(formatKzPhone(e.clipboardData.getData("text")));
  };

  /* helpers */
  const isoToday = useMemo(() => fmt(new Date()), []);
  const waDigitsNorm = waNumberToDigits(waDigits) ?? "77080086191";

  /* ====== mobile detector ====== */
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const upd = () => setIsPhone(window.innerWidth < 640);
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  /* submit */
  const submit = () => {
    const errs: string[] = [];
    if (!country) errs.push("dest");
    if (!checkIn || !checkOut || !(new Date(checkOut) > new Date(checkIn))) errs.push("dates");
    if (adults < 1) errs.push("pax");
    if (!name.trim() || name.trim().length < 2) errs.push("contacts");
    if (!isPhoneValid(phone)) errs.push("contacts");

    if (errs.length) {
      setOpenSeg(errs[0]);
      return;
    }

    const childrenLine = childrenCount > 0 ? ` (${t("wa.childrenAges")}: ${childrenAges.join(", ")})` : "";
    const raw =
`${t("wa.title")}
${t("wa.name")}: ${name}
${t("wa.phone")}: ${phone}
${t("wa.destination")}: ${tourText}
${t("wa.partyAdults")}: ${adults}, ${t("wa.partyChildren")}: ${childrenCount}${childrenLine}
${t("wa.checkin")}: ${checkIn} — ${t("wa.checkout")}: ${checkOut} (${nights} ${t("wa.nights")})
${t("wa.departureFrom")}: ${departure}${message ? `\n${t("wa.comment")}: ${message}` : ""}`;

    track("submit_form_hero_inline", {
      locale: i18n.language, adults, childrenCount, nights, departure, destinationFilled: !!country,
    });

    window.open(`https://wa.me/${waDigitsNorm}?text=${encodeURIComponent(raw)}`, "_blank", "noopener,noreferrer");
  };

  /* ========= POPUP CONTENT ========= */
  // Активные направления из CMS (для фильтрации стран)
  const [activeNames, setActiveNames] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    fetch('/api/destinations/public/list')
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        const s = new Set<string>();
        const items = Array.isArray(j?.items) ? j.items : [];
        for (const it of items) {
          if (!it?.isActive) continue;
          const t: any = it?.title || {};
          for (const v of [t.ru, t.en, t.kk]) {
            if (typeof v === 'string' && v.trim()) s.add(v.trim().toLowerCase());
          }
        }
        setActiveNames(s);
      })
      .catch(() => setActiveNames(new Set()));
    return () => { alive = false; };
  }, []);

  const visibleCountries = useMemo(() => {
    if (!activeNames.size) return COUNTRIES; // данных нет — показываем все
    let dnRU: any, dnEN: any, dnKK: any;
    try { dnRU = new (Intl as any).DisplayNames(['ru-RU'], { type: 'region' }); } catch {}
    try { dnEN = new (Intl as any).DisplayNames(['en-US'], { type: 'region' }); } catch {}
    try { dnKK = new (Intl as any).DisplayNames(['kk-KZ'], { type: 'region' }); } catch {}
    const isVisible = (c: Country) => {
      const labels = [c.name];
      const rc = regionCode[c.code] || c.code.toUpperCase();
      try { const v = dnRU?.of?.(rc); if (v) labels.push(String(v)); } catch {}
      try { const v = dnEN?.of?.(rc); if (v) labels.push(String(v)); } catch {}
      try { const v = dnKK?.of?.(rc); if (v) labels.push(String(v)); } catch {}
      return labels.some((n) => activeNames.has(n.toLowerCase()));
    };
    return COUNTRIES.filter(isVisible);
  }, [activeNames]);

  const CountryPickerContent = () => {
    const [activeCode, setActiveCode] = useState<string>(() => {
      if (country) {
        const found = COUNTRIES.find((c) => c.name === country || countryLabel(c.code) === country)?.code;
        return found || COUNTRIES[0].code;
      }
      return COUNTRIES[0].code;
    });
    const active = COUNTRIES.find((c) => c.code === activeCode)!;
    const activeLabel = countryLabel(active.code);

    // City localized labels (EN mapping only; RU/KK show original)
    const CITY_EN: Record<string, Record<string, string>> = {
      tr: { "Аланья":"Alanya","Анкара":"Ankara","Анталья":"Antalya","Афьон":"Afyon","Белек":"Belek","Бодрум":"Bodrum","Даламан":"Dalaman","Каппадокия":"Cappadocia","Кемер":"Kemer","Мармарис":"Marmaris","Олимпос":"Olympos","Сиде":"Side","Стамбул":"Istanbul","Фетхие":"Fethiye","Ялова":"Yalova" },
      vn: { "Дананг":"Da Nang","Нячанг":"Nha Trang","Фантьет":"Phan Thiet","Фукуок":"Phu Quoc","Хойан":"Hoi An","Хюэ":"Hue" },
      eg: { "Александрия":"Alexandria","Каир":"Cairo","Нувейба":"Nuweiba","Хургада":"Hurghada","Шарм-эль-Шейх":"Sharm El Sheikh" },
      th: { "Бангкок":"Bangkok","Као Лак":"Khao Lak","Ко Чанг":"Ko Chang","Ко Яо Нои":"Ko Yao Noi","Ко Яо Яй":"Ko Yao Yai","Краби":"Krabi","Ланта":"Lanta","Остров Мапрао":"Maprao Island","Остров Нака":"Naka Island","Остров Рача":"Racha Island","Паттайя":"Pattaya","Пханг-Нга":"Phang Nga","Пхетчхабури":"Phetchaburi","Пхи-Пхи":"Phi Phi","Пхукет":"Phuket","Самуи":"Samui","Хуа Хин":"Hua Hin" },
      ae: { "Абу-Даби":"Abu Dhabi","Аджман":"Ajman","Дубай":"Dubai","Рас-эль-Хайма":"Ras Al Khaimah","Умм-Аль-Кувейн":"Umm Al Quwain","Фуджейра":"Fujairah","Шарджа":"Sharjah" },
      cn: { "Гуанчжоу":"Guangzhou","о. Хайнань":"Hainan Island","Пекин":"Beijing","Синьцзян-Уйгурский автономный район":"Xinjiang Uygur Autonomous Region","Чжэцзян":"Zhejiang","Шанхай":"Shanghai" },
      mv: { "Мальдивы":"Maldives","Северный Ари Атолл":"North Ari Atoll" },
      ge: { "Бакуриани":"Bakuriani","Батуми":"Batumi","Боржоми":"Borjomi","Гонио":"Gonio","Гудаури":"Gudauri","Казбеги":"Kazbegi","Кахетия":"Kakheti","Кобулети":"Kobuleti","Кутаиси":"Kutaisi","Саирме":"Sairme","Самцхе-Джавахети":"Samtskhe–Javakheti","Сванети":"Svaneti","Тбилиси":"Tbilisi","Уреки":"Ureki","Цалка":"Tsalka","Цинандали":"Tsinandali","Цхалтубо":"Tskhaltubo","Шекветили":"Shekvetili" },
      id: { "Бали":"Bali","Западные Малые Зондские острова":"West Lesser Sunda Islands","Куала-Лумпур":"Kuala Lumpur" },
      gr: { "Афины и Аттика":"Athens & Attica","Корфу":"Corfu","Крит":"Crete","Миконос":"Mykonos" },
      it: { "Адриатическая Ривьера":"Adriatic Riviera","Венецианская Ривьера":"Venetian Riviera","Лацио":"Lazio","Лигурия":"Liguria","Ломбардия":"Lombardy","Милан":"Milan","Ривьера-ди-Улиссе":"Riviera di Ulisse","Рим":"Rome","Сардиния":"Sardinia","Сицилия":"Sicily" },
      qa: { "Аль-Райян":"Al Rayyan","Аш-Шамаль":"Ash Shamal","Доха":"Doha","Доха - городские отели":"Doha - City Hotels","Доха - пляжные отели":"Doha - Beach Hotels","Рас Абрук":"Ras Abrouq","Эль-Хаур":"Al Khor","Эр-Рувайс":"Ar Ru'ays" },
    };
    const cityLabel = (ct: string): string => {
      const l = (i18n.language || "ru").slice(0,2);
      if (l === "en") return CITY_EN[active.code]?.[ct] ?? ct;
      return ct;
    };

    return (
      <div className="country-pop">
        <div className="country-list">
          {visibleCountries.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`country-li ${c.code === activeCode ? "is-active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setActiveCode(c.code); }}
            >
              <span className="mr-2">{c.flag}</span>{countryLabel(c.code)}
            </button>
          ))}
        </div>

        <div className="city-list">
          <button
            type="button"
            className="city-head btn"
            onClick={(e) => { e.stopPropagation(); setCountry(activeLabel); setCity(""); setOpenSeg(null); }}
            title={t("st.chooseCountry")}
          >
            <span>{active.flag}</span>
            <b>{activeLabel}</b>
          </button>

          <div className="city-grid">
            {active.cities.map((ct) => (
              <button
                key={ct}
                type="button"
                className="city-li"
                onClick={(e) => { e.stopPropagation(); setCountry(activeLabel); setCity(cityLabel(ct)); setOpenSeg(null); }}
              >
                {cityLabel(ct)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const DatesContent = () => (
    <div>
      <RangeCalendar
        start={checkIn}
        end={checkOut}
        minDate={isoToday}
        country={country}
        city={city}
        onChange={({ start, end }) => { setCheckIn(start); setCheckOut(end); }}
      />
      <div className="pop-actions">
        <button
          className="btn btn-surface press"
          type="button"
          onClick={() => setOpenSeg(null)}
          disabled={!checkIn || !checkOut}
        >
          {t("st.apply")}
        </button>
      </div>
    </div>
  );

  /* ===== позиции поповеров ===== */
  const datesSegRef = useRef<HTMLDivElement | null>(null);
  const datesOpen = openSeg === "dates";
  const { left: datesLeft, width: datesWidth } =
    useAnchoredPopover(datesSegRef, datesOpen, { maxWidth: 1140, margin: 8, align: "center" });

  const destSegRef = useRef<HTMLDivElement | null>(null);
  const destOpen = openSeg === "dest";
  const { left: destLeft, width: destWidth } =
    useAnchoredPopover(destSegRef, destOpen, { maxWidth: 760, margin: 8, align: isPhone ? "center" : "segment" });

  const paxSegRef = useRef<HTMLDivElement | null>(null);
  const paxOpen = openSeg === "pax";
  const { left: paxLeft, width: paxWidth } =
    useAnchoredPopover(paxSegRef, paxOpen, { maxWidth: 560, margin: 8, align: isPhone ? "center" : "segment" });

  /* ===== align кнопки ===== */
  const wrapAlign = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

  /* ===== RENDER ===== */
  return (
    <div className={`mt-8 swap-wrap ${wrapAlign}`} data-editing={editing ? 1 : 0}>
      {/* Кнопка «Выбрать тур» */}
      <div className="swap-el" data-open={editing ? 0 : 1}>
        <button
          className="btn btn-primary press"
          onClick={() => { setEditing(true); track("hero_open_inline_form", { locale: i18n.language }); }}
        >
          {btnText}
        </button>
      </div>

      {/* Горизонтальная форма */}
      <div className="swap-el" data-open={editing ? 1 : 0}>
        <div className="searchbar fade-in">
          {/* верхняя панель управления */}
          <div className="searchbar-top">
            <div className="text-xs text-gray-600">{t("st.fillHint")}</div>
            <div className="ml-auto flex gap-2">
              <button type="button" className="btn btn-surface btn-sm press" onClick={() => setEditing(false)}>
                {t("st.collapse")}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm press"
                onClick={() => {
                  setCountry(""); setCity(""); setCheckIn(""); setCheckOut("");
                  setAdults(2); setChildrenCount(0); setChildrenAges([]);
                  setMessage("");
                  setName("");
                  setPhone("");
                  setOpenSeg(null);
                }}
              >
                {t("st.clear")}
              </button>
            </div>
          </div>

          <div className="search-grid">
            {/* откуда */}
            <div
              className="search-seg"
              data-open={openSeg === "from" ? 1 : 0}
              role="button"
              tabIndex={0}
              aria-expanded={openSeg === "from"}
              onClick={() => setOpenSeg("from")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenSeg("from"); } }}
            >
              <div className="seg-label">{t("st.from")}</div>
              <div className="seg-value">{departure}</div>

              <Dissolve open={openSeg === "from"} className="seg-pop seg-pop--auto">
                <div className="grid grid-cols-2 gap-2">
                  {[depLabel("ala"), depLabel("nqz")].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`btn btn-surface press ${departure === opt ? "ring-1 ring-[rgba(123,77,187,.25)]" : ""}`}
                      onClick={(e) => { e.stopPropagation(); setDeparture(opt); setOpenSeg(null); }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </Dissolve>
            </div>

            {/* страна/город */}
            <div
              className="search-seg"
              ref={destSegRef}
              data-open={destOpen ? 1 : 0}
              role="button"
              tabIndex={0}
              aria-expanded={destOpen}
              onClick={() => setOpenSeg("dest")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenSeg("dest"); } }}
            >
              <div className="seg-label">{t("st.dest")}</div>
              <div className="seg-value">{tourText || t("st.destPlaceholder")}</div>

              <Dissolve
                open={destOpen}
                className="seg-pop seg-pop--auto"
                style={isPhone ? { left: destLeft, right: "auto", width: destWidth } : undefined}
              >
                <CountryPickerContent />
              </Dissolve>
            </div>

            {/* даты проживания */}
            <div
              className="search-seg"
              ref={datesSegRef}
              data-open={datesOpen ? 1 : 0}
              role="button"
              tabIndex={0}
              aria-expanded={datesOpen}
              onClick={() => setOpenSeg("dates")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenSeg("dates"); } }}
            >
              <div className="seg-label">{t("st.dates")}</div>
              <div className="seg-value">
                {checkIn && checkOut
                  ? (checkIn === checkOut
                      ? `${checkIn}`
                      : `${checkIn} — ${checkOut} · ${nights} ${t("st.nightsShort")}`
                    )
                  : t("st.datesPlaceholder")}
              </div>

              <Dissolve
                open={datesOpen}
                className="seg-pop seg-pop--dates"
                style={{
                  left: datesLeft,
                  right: "auto",
                  width: datesWidth,
                  maxHeight: "78vh",
                  overflow: "auto",
                  overflowX: "hidden",
                  zIndex: 70,
                }}
              >
                <DatesContent />
              </Dissolve>
            </div>

            {/* туристы */}
            <div
              className="search-seg"
              ref={paxSegRef}
              data-open={paxOpen ? 1 : 0}
              role="button"
              tabIndex={0}
              aria-expanded={paxOpen}
              onClick={() => setOpenSeg("pax")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenSeg("pax"); } }}
            >
              <div className="seg-label">{t("st.pax")}</div>
              <div className="seg-value">
                {adults} {t("st.adultsShort")}{childrenCount > 0 ? `, ${childrenCount} ${t("st.childrenShort")}` : ""}
              </div>

              <Dissolve
                open={paxOpen}
                className="seg-pop seg-pop--auto seg-pop--pax"
                style={isPhone ? { left: paxLeft, right: "auto", width: paxWidth } : undefined}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="pop-row">
                    <div className="pop-num">
                      <span className="text-sm text-gray-600">{t("st.adults")}</span>
                      <button
                        type="button"
                        className="btn btn-surface press"
                        onClick={(e) => { e.stopPropagation(); setAdults(clamp(adults - 1, 1, 9)); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >−</button>
                      <div className="w-10 text-center">{adults}</div>
                      <button
                        type="button"
                        className="btn btn-surface press"
                        onClick={(e) => { e.stopPropagation(); setAdults(clamp(adults + 1, 1, 9)); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >+</button>
                    </div>

                    <div className="pop-num">
                      <span className="text-sm text-gray-600">{t("st.children")}</span>
                      <button
                        type="button"
                        className="btn btn-surface press"
                        onClick={(e) => { e.stopPropagation(); setChildrenCount(clamp(childrenCount - 1, 0, 6)); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >−</button>
                      <div className="w-10 text-center">{childrenCount}</div>
                      <button
                        type="button"
                        className="btn btn-surface press"
                        onClick={(e) => { e.stopPropagation(); setChildrenCount(clamp(childrenCount + 1, 0, 6)); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >+</button>
                    </div>
                  </div>

                  {childrenCount > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Array.from({ length: childrenCount }).map((_, i) => (
                        <div key={i}>
                          <label className="text-xs text-gray-600">
                            {t("st.childAgeLabel", { index: i + 1 })}
                          </label>
                          <input
                            type="number" min={0} max={17}
                            className="mt-1 w-full border rounded-xl px-3 py-2"
                            value={childrenAges[i] ?? 5}
                            onChange={(e) => {
                              const v = clamp(parseInt(e.target.value || "0") || 0, 0, 17);
                              setChildrenAges((prev) => { const next = [...prev]; next[i] = v; return next; });
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pop-actions">
                    <button
                      className="btn btn-surface press"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setOpenSeg(null); }}
                    >
                      {t("st.done")}
                    </button>
                  </div>
                </div>
              </Dissolve>
            </div>

            {/* контакты */}
            <div
              className="search-seg"
              data-open={openSeg === "contacts" ? 1 : 0}
              role="button"
              tabIndex={0}
              aria-expanded={openSeg === "contacts"}
              onClick={() => setOpenSeg("contacts")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenSeg("contacts"); } }}
            >
              <div className="seg-label">{t("st.contacts")}</div>
              <div className="seg-value seg-value--multiline">
                <span className="row">{name || t("st.namePlaceholder")}</span>
                <span className="row whitespace-nowrap">{phone || t("st.phonePlaceholder")}</span>
              </div>

              <Dissolve open={openSeg === "contacts"} className="seg-pop seg-pop--auto">
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="pop-row">
                    <div>
                      <span className="text-xs text-gray-600">{t("st.name")}</span>
                      <input
                        className="mt-1 w-full border rounded-xl px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={t("st.namePlaceholder") || ""}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">{t("st.phone")}</span>
                      <input
                        ref={phoneRef}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onFocus={onPhoneFocus}
                        onKeyUp={onPhoneKeyUp}
                        onPaste={onPhonePaste}
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        inputMode="tel"
                        className="mt-1 w-full border rounded-xl px-3 py-2"
                        placeholder={t("st.phonePlaceholder") || ""}
                      />
                    </div>
                  </div>
                  <div className="pop-actions">
                    <button
                      className="btn btn-surface press"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setOpenSeg(null); }}
                    >
                      {t("st.done")}
                    </button>
                  </div>
                </div>
              </Dissolve>
            </div>

            {/* комментарий */}
            <div
              className="search-seg"
              data-open={openSeg === "comment" ? 1 : 0}
              role="button"
              tabIndex={0}
              aria-expanded={openSeg === "comment"}
              onClick={() => setOpenSeg("comment")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenSeg("comment"); } }}
            >
              <div className="seg-label">{t("st.comment")}</div>
              <div className="seg-value truncate">{message || t("st.commentPlaceholder")}</div>

              <Dissolve open={openSeg === "comment"} className="seg-pop seg-pop--auto">
                <div>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2 h-24"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={t("st.commentPlaceholder") || ""}
                  />
                  <div className="pop-actions">
                    <button className="btn btn-surface press" type="button" onClick={() => setOpenSeg(null)}>
                      {t("st.done")}
                    </button>
                  </div>
                </div>
              </Dissolve>
            </div>

            {/* ОТПРАВИТЬ */}
            <button
              type="button"
              className="search-submit search-submit--accent press"
              onClick={submit}
            >
              <span className="btn-label">{t("st.send")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
