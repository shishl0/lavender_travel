"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type React from "react";
import { HeroDTO, Locale } from "@/types/cms";
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

      const leftInViewport = clamp(leftInViewportWanted, margin, vw - width - margin);
      const left = Math.round(leftInViewport - r.left);
      setPos({ left, width });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [anchorRef, open, maxWidth, margin, align]);

  return pos;
}


/* ========= ПРАЙС-МАТРИЦА ========= */
/** База (₸/чел.) по стране и опционально — оверрайды по городам */
const PRICE_MATRIX: Record<string, { base: number; cities?: Record<string, number> }> = {
  "Турция": { base: 180_000, cities: { "Анталья": 190_000, "Стамбул": 170_000, "Бодрум": 210_000, "Кемер": 185_000 } },
  "Вьетнам": { base: 220_000, cities: { "Нячанг": 230_000, "Дананг": 240_000, "Фукуок": 245_000 } },
  "Египет": { base: 205_000, cities: { "Хургада": 210_000, "Шарм-эль-Шейх": 215_000 } },
  "Таиланд": { base: 230_000, cities: { "Пхукет": 245_000, "Самуи": 255_000, "Бангкок": 225_000, "Краби": 240_000 } },
  "ОАЭ": { base: 200_000, cities: { "Дубай": 215_000, "Абу-Даби": 210_000, "Рас-эль-Хайма": 205_000 } },
};

/* ========= данные стран/городов ========= */
type Country = { code: string; name: string; flag: string; cities: string[] };
const COUNTRIES: Country[] = [
  { code: "tr", name: "Турция", flag: "🇹🇷", cities: ["Аланья","Анкара","Анталья","Афьон","Белек","Бодрум","Даламан","Каппадокия","Кемер","Мармарис","Олимпос","Сиде","Стамбул","Фетхие","Ялова"] },
  { code: "vn", name: "Вьетнам", flag: "🇻🇳", cities: ["Дананг","Нячанг","Фантьет","Фукуок","Хойан","Хюэ"] },
  { code: "eg", name: "Египет", flag: "🇪🇬", cities: ["Александрия","Каир","Нувейба","Хургада","Шарм-эль-Шейх"] },
  { code: "th", name: "Таиланд", flag: "🇹🇭", cities: ["Бангкок","Као Лак","Ко Чанг","Ко Яо Нои","Ко Яо Яй","Краби","Ланта","Остров Мапрао","Остров Нака","Остров Рача","Паттайя","Пханг-Нга","Пхетчхабури","Пхи-Пхи","Пхукет","Самуи","Хуа Хин"] },
  { code: "ae", name: "ОАЭ", flag: "🇦🇪", cities: ["Абу-Даби","Аджман","Дубай","Рас-эль-Хайма","Умм-Аль-Кувейн","Фуджейра","Шарджа"] },
];

/* ========= Календарь (2 месяца, выбор диапазона) ========= */
function RangeCalendar({
  start,
  end,
  onChange,
  minDate,
  country,
  city,
  showMinPrice = true,
}: {
  start?: string;
  end?: string;
  onChange: (v: { start: string; end: string }) => void;
  minDate?: string;
  country?: string;
  city?: string;
  showMinPrice?: boolean;
}) {
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
  const fmtTenge = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

  /* === База по стране/городу === */
  const baseForDestination = () => {
    const byCountry = country ? PRICE_MATRIX[country] : undefined;
    if (!byCountry) return 180_000; // дефолт, если страна не выбрана
    const byCity = city && byCountry.cities?.[city];
    return byCity ?? byCountry.base;
  };

  /* === Сезонность/дни недели — мягкие коэффициенты === */
  const seasonalK = (d: Date) => {
    const m = d.getMonth(); // 0..11
    const high = [5, 6, 7, 8, 9]; // июн–сен (лето/бархат)
    const ny = [0, 11]; // янв/дек
    if (high.includes(m)) return 1.12;
    if (ny.includes(m)) return 1.18;
    return 1.0;
  };
  const weekdayK = (d: Date) => {
    const wd = d.getDay(); // 0=Вс
    return wd === 5 || wd === 6 ? 1.04 : 1.0; // пт/сб слегка дороже
  };

  /** Итоговая ориентировочная цена для дня с учётом направления */
  const priceForDate = (d: Date) => {
    const base = baseForDestination();
    const p = Math.round(base * seasonalK(d) * weekdayK(d));
    return p;
  };

  /** Уточнение кол-ва ночей «- / +» */
  const adjustNights = (delta: number) => {
    const n = Math.max(1, nightsNow + delta);
    const from = s ?? new Date(fmt(new Date()));
    onChange({ start: fmt(from), end: fmt(addDays(from, n)) });
  };

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

  /* === Минимальная цена: если дата не выбрана — берём минимум по двум видимым месяцам (и только если включён флаг) === */
  const visibleDays = useMemo(() => {
    if (!showMinPrice) return [];
    const days = [...weeksFor(p1).flat(), ...weeksFor(p2).flat()]
      .filter((d): d is Date => !!d && (!min || d >= min));
    return days;
  }, [p1, p2, min, showMinPrice]);

  const minVisiblePrice = useMemo(() => {
    if (!showMinPrice || !visibleDays.length) return null;
    let minP = Infinity;
    for (const d of visibleDays) {
      const p = priceForDate(d);
      if (p < minP) minP = p;
    }
    return Number.isFinite(minP) ? minP : null;
  }, [visibleDays, country, city, showMinPrice]);

  const Month = ({ m }: { m: Date }) => (
    <div className={`cal ${showMinPrice ? "cal--prices" : "cal--compact"}`}>
      <div className="cal-head">{m.toLocaleString("ru-RU", { month: "long", year: "numeric" })}</div>
      <div className="cal-grid">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
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
              {showMinPrice && d && !disabled && (
                <span className="cal-price">~{fmtTenge(priceForDate(d))} ₸</span>
              )}
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
          <button type="button" className="btn btn-surface btn-sm" onClick={() => setCursor(addDays(startOfMonth(cursor), -1))}>←</button>
          <button type="button" className="btn btn-surface btn-sm" onClick={() => setCursor(addDays(startOfMonth(cursor), 40))}>→</button>
        </div>
        <div className="cal-months">
          <Month m={p1} />
          <Month m={p2} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-gray-600">Ночей</span>
        <button type="button" className="btn btn-surface btn-sm press" onClick={() => adjustNights(-1)}>−</button>
        <div className="w-10 text-center font-semibold">{nightsNow}</div>
        <button type="button" className="btn btn-surface btn-sm press" onClick={() => adjustNights(1)}>+</button>

        {/* правый блок — показываем только если флаг включён */}
        {showMinPrice && (
          <div className="ml-auto text-gray-600">
            минимальная цена:{" "}
            <b data-role="min-price">
              {s
                ? new Intl.NumberFormat("ru-RU").format(priceForDate(s))
                : (minVisiblePrice ? new Intl.NumberFormat("ru-RU").format(minVisiblePrice) : "—")}
            </b>{" "}
            ₸/чел.
          </div>
        )}
      </div>
    </div>
  );
}

/* ========= Hero ========= */
type Props = { cms: HeroDTO | null; waDigits?: string; showMinPrice?: boolean };

// стало
export default function Hero({ cms, waDigits = "77080086191", showMinPrice = false }: Props) {
  const { t, i18n } = useTranslation();
  const L = (i18n.language?.slice(0, 2) as Locale) || "ru";
  const pick = (obj: any, fb: string) => obj?.[L] ?? t(fb);
  const minPriceEnabled = !!showMinPrice;

  /* кнопка → форма */
  const [editing, setEditing] = useState(false);

  /* state формы */
  const [departure, setDeparture] = useState<"Алматы" | "Астана">("Алматы");

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
      setDeparture(v.departure ?? "Алматы");
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

    const onOutside = (e: MouseEvent) => {
      if (!openSeg) return;
      if (isInsideSeg(e)) return;
      setOpenSeg(null);
    };
    const onPointerOutside = (e: PointerEvent) => {
      if (!openSeg) return;
      if (isInsideSeg(e)) return;
      setOpenSeg(null);
    };
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

    const childrenLine = childrenCount > 0 ? ` (возраст: ${childrenAges.join(", ")})` : "";
    const raw =
`Заявка на подбор тура
Имя: ${name}
Телефон: ${phone}
Направление: ${tourText}
Состав: взрослые — ${adults}, дети — ${childrenCount}${childrenLine}
Заезд: ${checkIn} — Выезд: ${checkOut} (${nights} ночей)
Вылет из: ${departure}${message ? `\nКомментарий: ${message}` : ""}`;

    track("submit_form_hero_inline", {
      locale: i18n.language, adults, childrenCount, nights, departure, destinationFilled: !!country,
    });

    window.open(`https://wa.me/${waDigitsNorm}?text=${encodeURIComponent(raw)}`, "_blank", "noopener,noreferrer");
  };

  /* ========= POPUP CONTENT ========= */
  const CountryPickerContent = () => {
    const [activeCode, setActiveCode] = useState<string>(() => {
      if (country) {
        const found = COUNTRIES.find((c) => c.name === country)?.code;
        return found || COUNTRIES[0].code;
      }
      return COUNTRIES[0].code;
    });
    const active = COUNTRIES.find((c) => c.code === activeCode)!;

    return (
      <div className="country-pop">
        <div className="country-list">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`country-li ${c.code === activeCode ? "is-active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setActiveCode(c.code); }}
            >
              <span className="mr-2">{c.flag}</span>{c.name}
            </button>
          ))}
        </div>

        <div className="city-list">
          <button
            type="button"
            className="city-head btn"
            onClick={(e) => { e.stopPropagation(); setCountry(active.name); setCity(""); setOpenSeg(null); }}
            title="Выбрать страну"
          >
            <span>{active.flag}</span>
            <b>{active.name}</b>
          </button>

          <div className="city-grid">
            {active.cities.map((ct) => (
              <button
                key={ct}
                type="button"
                className="city-li"
                onClick={(e) => { e.stopPropagation(); setCountry(active.name); setCity(ct); setOpenSeg(null); }}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ContactsContent = () => (
    <div>
      <div className="pop-row">
        <div>
          <span className="text-xs text-gray-600">Имя</span>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Как к вам обращаться?"
          />
        </div>
        <div>
          <span className="text-xs text-gray-600">Телефон</span>
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
            placeholder="+7 708 …"
          />
        </div>
      </div>
      <div className="pop-actions">
        <button className="btn btn-surface press" type="button" onClick={() => setOpenSeg(null)}>Готово</button>
      </div>
    </div>
  );

  const PaxContent = () => (
    <div>
      <div className="pop-row">
        <div className="pop-num">
          <span className="text-sm text-gray-600">Взрослые</span>
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
          <span className="text-sm text-gray-600">Дети</span>
          <button type="button" className="btn btn-surface press" onClick={() => setChildrenCount(clamp(childrenCount - 1, 0, 6))}>−</button>
          <div className="w-10 text-center">{childrenCount}</div>
          <button type="button" className="btn btn-surface press" onClick={() => setChildrenCount(clamp(childrenCount + 1, 0, 6))}>+</button>
        </div>
      </div>
      {childrenCount > 0 && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {Array.from({ length: childrenCount }).map((_, i) => (
            <div key={i}>
              <label className="text-xs text-gray-600">Возраст ребёнка {i + 1}</label>
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
        <button className="btn btn-surface press" type="button" onClick={() => setOpenSeg(null)}>Готово</button>
      </div>
    </div>
  );

  const DatesContent = () => (
    <div>
      <RangeCalendar
        start={checkIn}
        end={checkOut}
        minDate={isoToday}
        country={country}
        city={city}
        showMinPrice={minPriceEnabled} // ← флажок: сейчас скрываем блок «минимальная цена»
        onChange={({ start, end }) => { setCheckIn(start); setCheckOut(end); }}
      />
      <div className="pop-actions">
        <button
          className="btn btn-surface press"
          type="button"
          onClick={() => setOpenSeg(null)}
          disabled={!checkIn || !checkOut}
        >
          Применить
        </button>
      </div>
    </div>
  );

  /* ===== позиции поповеров ===== */
  // ДАТЫ
  const datesSegRef = useRef<HTMLDivElement | null>(null);
  const datesOpen = openSeg === "dates";
  const { left: datesLeft, width: datesWidth } =
    useAnchoredPopover(datesSegRef, datesOpen, { maxWidth: 1140, margin: 8, align: "center" });

  // СТРАНА/ГОРОД
  const destSegRef = useRef<HTMLDivElement | null>(null);
  const destOpen = openSeg === "dest";
  const { left: destLeft, width: destWidth } =
    useAnchoredPopover(destSegRef, destOpen, { maxWidth: 760, margin: 8, align: isPhone ? "center" : "segment" });

  // ТУРИСТЫ 
  const paxSegRef = useRef<HTMLDivElement | null>(null);
  const paxOpen = openSeg === "pax";
  const { left: paxLeft, width: paxWidth } =
    useAnchoredPopover(paxSegRef, paxOpen, { maxWidth: 560, margin: 8, align: isPhone ? "center" : "segment" });

  /* ===== RENDER ===== */
  return (
    <section className="hero hero--full">
      <div className="hero-bg">
        <Image
          src={cms?.imageUrl || "/images/hero.jpg"}
          alt={pick(cms?.imageAlt, "hero.imageAlt")}
          fill priority sizes="100vw"
        />
      </div>
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="container">
          <div className="kicker">{pick(cms?.kicker, "hero.kicker")}</div>
          <h1 className="hero-title hero-title--onimg mt-3 text-4xl md:text-5xl font-extrabold leading-tight">
            {pick(cms?.titleTop, "hero.titleTop")} <br /> {pick(cms?.titleBottom, "hero.titleBottom")}
          </h1>
          <p className="mt-5 text-[17px] text-white/90 max-w-xl">{pick(cms?.subtitle, "hero.subtitle")}</p>

          <div className="mt-8 swap-wrap" data-editing={editing ? 1 : 0}>
            {/* Кнопка «Выбрать тур» */}
            <div className="swap-el" data-open={editing ? 0 : 1}>
              <button
                className="btn btn-primary press"
                onClick={() => { setEditing(true); track("hero_open_inline_form", { locale: i18n.language }); }}
              >
                {t("hero.ctaPrimary")}
              </button>
            </div>

            {/* Горизонтальная форма */}
            <div className="swap-el" data-open={editing ? 1 : 0}>
              <div className="searchbar fade-in">
                {/* верхняя панель управления */}
                <div className="searchbar-top">
                  <div className="text-xs text-gray-600">Заполните и отправьте в WhatsApp</div>
                  <div className="ml-auto flex gap-2">
                    <button type="button" className="btn btn-surface btn-sm press" onClick={() => setEditing(false)}>Свернуть</button>
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
                      Очистить
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
                    <div className="seg-label">откуда:</div>
                    <div className="seg-value">{departure}</div>

                    <Dissolve open={openSeg === "from"} className="seg-pop seg-pop--auto">
                      <div className="grid grid-cols-2 gap-2">
                        {(["Алматы", "Астана"] as const).map((opt) => (
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
                    <div className="seg-label">страна/город:</div>
                    <div className="seg-value">{tourText || "Выберите страну или город"}</div>

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
                    <div className="seg-label">даты:</div>
                    <div className="seg-value">
                      {checkIn && checkOut
                        ? (checkIn === checkOut
                            ? `${checkIn}`
                            : `${checkIn} — ${checkOut} · ${nights} ночей`
                          )
                        : "Выберите диапазон"}
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
                    <div className="seg-label">туристов:</div>
                    <div className="seg-value">
                      {adults} взр{childrenCount > 0 ? `, ${childrenCount} дет` : ""}
                    </div>

                    <Dissolve
                      open={paxOpen}
                      className="seg-pop seg-pop--auto seg-pop--pax"
                      style={isPhone ? { left: paxLeft, right: "auto", width: paxWidth } : undefined}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <div className="pop-row">
                          <div className="pop-num">
                            <span className="text-sm text-gray-600">Взрослые</span>
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
                            <span className="text-sm text-gray-600">Дети</span>
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
                                <label className="text-xs text-gray-600">Возраст ребёнка {i + 1}</label>
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
                            Готово
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
                    <div className="seg-label">контакты:</div>
                    <div className="seg-value seg-value--multiline">
                      <span className="row">{name || "Имя"}</span>
                      <span className="row whitespace-nowrap">{phone || "+7 777 …"}</span>
                    </div>

                    <Dissolve open={openSeg === "contacts"} className="seg-pop seg-pop--auto">
                      <div onClick={(e) => e.stopPropagation()}>
                        <div className="pop-row">
                          <div>
                            <span className="text-xs text-gray-600">Имя</span>
                            <input
                              className="mt-1 w-full border rounded-xl px-3 py-2"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Как к вам обращаться?"
                            />
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">Телефон</span>
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
                              placeholder="+7 708 …"
                            />
                          </div>
                        </div>
                        <div className="pop-actions">
                          <button
                            className="btn btn-surface press"
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setOpenSeg(null); }}
                          >
                            Готово
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
                    <div className="seg-label">комментарии:</div>
                    <div className="seg-value truncate">{message || "Пожелания, спец.условия…"}</div>

                    <Dissolve open={openSeg === "comment"} className="seg-pop seg-pop--auto">
                      <div>
                        <textarea
                          className="w-full border rounded-xl px-3 py-2 h-24"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Пожелания, спец.условия…"
                        />
                        <div className="pop-actions">
                          <button className="btn btn-surface press" type="button" onClick={() => setOpenSeg(null)}>Готово</button>
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
                    <span className="btn-label">Отправить</span>
                  </button>
                </div>

                <div className="mt-2 text-xs text-gray-600">
                  Мы ответим в WhatsApp как можно скорее.
                </div>
              </div>
            </div>
          </div>
          {/* /swap */}
        </div>
      </div>
    </section>
  );
}