"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { track } from "@/lib/track";
import type { SiteSettingsDTO } from "@/types/cms";
import ReviewsCarousel from "@/components/reviews/ReviewsCarousel";
import ReviewPublicForm from "@/components/reviews/ReviewPublicForm";

/* ================================
   Types
================================ */

type Props = {
  settings: SiteSettingsDTO | null;
};

type FormState = {
  name: string;
  phone: string;
  tour: string;
  message: string;
  adults: number;
  childrenCount: number;
  childrenAges: number[];
  checkIn: string;
  checkOut: string;
  departure: string;
  budget: string;
};

type Errors = Partial<{
  name: string;
  phone: string;
  tour: string;
  departure: string;
  dates: string;
  adults: string;
  childrenAges: string;
}>;

type Option = { label: string; value: string | number };

/* ================================
   Utils
================================ */

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const phoneDigits = (masked: string) => masked.replace(/\D/g, "");
const isPhoneValid = (masked: string) => {
  const d = phoneDigits(masked);
  return d.length === 11 && d.startsWith("7");
};
/** Показ в UI: +7 708 008 61 91 */
const formatKzPhone = (raw: string) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  const r = d.slice(1);
  const g1 = r.slice(0, 3),
    g2 = r.slice(3, 6),
    g3 = r.slice(6, 8),
    g4 = r.slice(8, 10);
  return ["+7", g1 && " " + g1, g2 && " " + g2, g3 && " " + g3, g4 && " " + g4]
    .filter(Boolean)
    .join("");
};
/** Для wa.me: только цифры */
const waNumberToDigits = (whats?: string | null): string | null => {
  if (!whats) return null;
  let d = whats.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  return d.length === 11 ? d : null;
};

/* ================================
   Inputs
================================ */

function AgeNumberInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const inc = () => onChange(Math.min(17, (value ?? 0) + 1));
  const dec = () => onChange(Math.max(0, (value ?? 0) - 1));
  return (
    <div className="age-wrap">
      <input
        type="number"
        className="age-input"
        min={0}
        max={17}
        value={value ?? 5}
        onChange={(e) => {
          const v = Math.max(0, Math.min(17, Number(e.target.value)));
          onChange(Number.isNaN(v) ? 0 : v);
        }}
        aria-label="Возраст ребёнка"
      />
      <button type="button" className="age-step age-up press" onClick={inc} aria-label="Увеличить возраст" />
      <button type="button" className="age-step age-down press" onClick={dec} aria-label="Уменьшить возраст" />
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Выберите",
  className = "mt-1",
  widthFull = true,
}: {
  value?: string | number;
  onChange: (v: string | number) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  widthFull?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  });
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setActive(idx);
  }, [value, options]);

  const sel = options.find((o) => o.value === value);

  const choose = (idx: number) => {
    setActive(idx);
    onChange(options[idx].value);
    setOpen(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={`relative ${widthFull ? "w-full" : ""} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="select-trigger btn-press w-full border rounded-xl px-3 py-2 bg-white flex items-center justify-between press"
      >
        <span className={sel ? "text-gray-900" : "text-gray-400"}>
          {sel ? sel.label : placeholder}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" fill="none" stroke="#5B5F71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul role="listbox" className="select-dropdown">
          {options.map((o, i) => {
            const isActive = i === active;
            const isSelected = o.value === value;
            return (
              <li
                key={String(o.value)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={[
                  "cursor-pointer text-sm flex items-center justify-between",
                  "px-3 py-2",
                  isActive ? "bg-gray-50" : "",
                  isSelected ? "font-semibold text-[var(--navy)]" : "text-gray-700",
                ].join(" ")}
              >
                <span>{o.label}</span>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" fill="none" stroke="#7B4DBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ================================
   Component
================================ */

export default function Contact({ settings }: Props) {
  const { t, i18n } = useTranslation();

  const tourSuggestions = t("contact.form.tour.suggestions", { returnObjects: true }) as string[];

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    tour: "",
    message: "",
    adults: 2,
    childrenCount: 0,
    childrenAges: [],
    checkIn: "",
    checkOut: "",
    departure: "Алматы",
    budget: "",
  });

  const [errors, setErrors] = useState<Errors>({});

  // Дефолты для контактов
  const DEFAULT_WA_DIGITS = "77080086191";
  const DEFAULT_WA_DISPLAY = "+7 708 008 6191";
  const DEFAULT_IG = "https://www.instagram.com/lavender_travel_kz";

  // Ссылки/отображение из настроек:
  const waDigits = useMemo(
    () => waNumberToDigits(settings?.whatsappNumber) ?? DEFAULT_WA_DIGITS,
    [settings?.whatsappNumber]
  );
  const waHref = `https://wa.me/${waDigits}`;

  const displayPhone = useMemo(
    () => (settings?.whatsappNumber ? formatKzPhone(settings.whatsappNumber) : DEFAULT_WA_DISPLAY),
    [settings?.whatsappNumber]
  );

  const instagramHref = settings?.instagramUrl || DEFAULT_IG;
  const instagramHandle = useMemo(() => {
    try {
      const u = new URL(instagramHref);
      const h = u.pathname.replace(/\//g, "");
      return h || "lavender_travel_kz";
    } catch {
      return "lavender_travel_kz";
    }
  }, [instagramHref]);

  // Синхронизация массива возрастов
  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      const c = clamp(prev.childrenCount, 0, 6);
      next.childrenCount = c;
      if (next.childrenAges.length < c) {
        next.childrenAges = [
          ...next.childrenAges,
          ...Array.from({ length: c - next.childrenAges.length }, () => 5),
        ];
      } else {
        next.childrenAges = next.childrenAges.slice(0, c);
      }
      return next;
    });
  }, [form.childrenCount]);

  // Кол-во ночей
  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const diff = Math.ceil(
      (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000
    );
    return diff > 0 ? diff : 0;
  }, [form.checkIn, form.checkOut]);

  // Изменения полей
  const change = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      setForm((p) => ({ ...p, phone: formatKzPhone(value) }));
      return;
    }
    if (name === "adults") {
      setForm((p) => ({ ...p, adults: clamp(parseInt(value || "0") || 0, 1, 9) }));
      return;
    }
    if (name === "childrenCount") {
      setForm((p) => ({ ...p, childrenCount: clamp(parseInt(value || "0") || 0, 0, 6) }));
      return;
    }
    if (name.startsWith("childAge-")) {
      const idx = parseInt(name.split("-")[1], 10);
      const age = clamp(parseInt(value || "0") || 0, 0, 17);
      setForm((p) => {
        const ages = [...p.childrenAges];
        ages[idx] = age;
        return { ...p, childrenAges: ages };
      });
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  // Телефон: автоформат
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const onPhoneFocus = () => {
    setForm((p) => ({ ...p, phone: p.phone ? formatKzPhone(p.phone) : "+7 " }));
    requestAnimationFrame(() => {
      const el = phoneRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    });
  };
  const onPhoneKeyUp = () => setForm((p) => ({ ...p, phone: formatKzPhone(p.phone) }));
  const onPhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setForm((p) => ({ ...p, phone: formatKzPhone(e.clipboardData.getData("text")) }));
  };

  // Инкременты состава
  type CountField = "adults" | "childrenCount";
  const updateCount = (field: CountField, delta: 1 | -1) => {
    setForm((p) => {
      const min = field === "adults" ? 1 : 0;
      const max = field === "adults" ? 9 : 6;
      const value = clamp(p[field] + delta, min, max);
      return { ...p, [field]: value };
    });
  };
  const inc = (field: CountField) => updateCount(field, 1);
  const dec = (field: CountField) => updateCount(field, -1);

  // Дата-диапазон
  const [rangeOpen, setRangeOpen] = useState(false);
  const isoToday = useMemo(() => new Date().toISOString().split("T")[0], []);

  const applyPresetNights = (n: number) => {
    if (!form.checkIn) return;
    const d = new Date(form.checkIn);
    d.setDate(d.getDate() + n);
    setForm((p) => ({ ...p, checkOut: d.toISOString().split("T")[0] }));
  };

  // Валидация
  function validate(): Errors {
    const e: Errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = t("contact.errors.name");
    if (!isPhoneValid(form.phone)) e.phone = t("contact.errors.phone");
    if (!form.departure || !String(form.departure).trim()) e.departure = t("contact.errors.departure");
    if (!form.tour.trim() || form.tour.trim().length < 2) e.tour = t("contact.errors.tour");
    if (!form.checkIn || !form.checkOut) {
      e.dates = t("contact.errors.datesRequired");
    } else {
      const inD = new Date(form.checkIn).getTime();
      const outD = new Date(form.checkOut).getTime();
      if (!(outD > inD)) e.dates = t("contact.errors.datesOrder");
    }
    if (form.adults < 1) e.adults = t("contact.errors.adults");
    if (form.childrenCount > 0) {
      const ok =
        form.childrenAges.length === form.childrenCount &&
        form.childrenAges.every((a) => Number.isInteger(a) && a >= 0 && a <= 17);
      if (!ok) e.childrenAges = t("contact.errors.childrenAges");
    }
    return e;
  }

  // Отправка
  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      if (v.dates) setRangeOpen(true);
      return;
    }

    const childrenLine =
      form.childrenCount > 0
        ? ` (${t("contact.wa.childrenAges", { ages: form.childrenAges.join(", ") })})`
        : "";

    const group =
      `${t("contact.wa.adults")}: ${form.adults}\n` +
      `${t("contact.wa.children")}: ${form.childrenCount}${childrenLine}`;

    const dates =
      form.checkIn && form.checkOut
        ? `\n${t("contact.wa.checkIn")}: ${form.checkIn} — ${t("contact.wa.checkOut")}: ${form.checkOut} (${t("contact.wa.nights", { count: nights })})`
        : "";

    const raw =
`${t("contact.wa.title")}
${t("contact.wa.name")}: ${form.name}
${t("contact.wa.phone")}: ${form.phone}
${t("contact.wa.tour")}: ${form.tour}
${group}${dates}
${t("contact.wa.departure")}: ${form.departure}${form.budget ? `\n${t("contact.wa.budget")}: ${form.budget}` : ""}${form.message ? `\n${t("contact.wa.message")}: ${form.message}` : ""}`;

    // Событие заявки — отправляем ДО перехода в WhatsApp
    track("submit_form", {
      locale: i18n.language,
      adults: form.adults,
      childrenCount: form.childrenCount,
      nights,
      departure: form.departure,
      destinationFilled: !!form.tour?.trim(),
    });

    window.open(`${waHref}?text=${encodeURIComponent(raw)}`, "_blank");
  };

  /* ================================
     Render
  ================================ */

  return (
    <section id="contact" className="section">
      <div className="container grid md:grid-cols-2 gap-10 items-start">
        <form onSubmit={submit} className="card p-6 fade-in">
          {/* Имя */}
          <label className="text-sm font-medium">{t("contact.form.name.label")}</label>
          <input
            name="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={`mt-1 mb-1 w-full border rounded-xl px-3 py-2 ${errors.name ? "border-red-400 ring-1 ring-red-200" : ""}`}
            placeholder={t("contact.form.name.placeholder")}
            required
          />
          {errors.name && <p className="mb-3 text-xs text-red-600">{errors.name}</p>}

          {/* Телефон */}
          <label className="text-sm font-medium">{t("contact.form.phone.label")}</label>
          <input
            ref={phoneRef}
            name="phone"
            value={form.phone}
            onChange={change}
            onFocus={onPhoneFocus}
            onKeyUp={onPhoneKeyUp}
            onPaste={onPhonePaste}
            inputMode="tel"
            className={`mt-1 mb-1 w-full border rounded-xl px-3 py-2 ${errors.phone ? "border-red-400 ring-1 ring-red-200" : ""}`}
            placeholder={t("contact.form.phone.placeholder")}
            required
          />
          {errors.phone && <p className="mb-3 text-xs text-red-600">{errors.phone}</p>}

          {/* Куда */}
          <label className="text-sm font-medium">{t("contact.form.tour.label")}</label>
          <input
            name="tour"
            value={form.tour}
            onChange={(e) => {
              change(e);
              if (errors.tour) setErrors((p) => ({ ...p, tour: "" }));
            }}
            className={`mt-1 mb-1 w-full border rounded-xl px-3 py-2 ${errors.tour ? "ring-1 ring-red-200 border-red-400" : ""}`}
            placeholder={t("contact.form.tour.placeholder")}
            list="tour-suggestions"
            aria-invalid={!!errors.tour}
          />
          <datalist id="tour-suggestions">
            {tourSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {errors.tour && <p className="mb-3 text-xs text-red-600">{errors.tour}</p>}

          {/* Вылет / Бюджет */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">{t("contact.form.departure.label")}</label>
              <CustomSelect
                className={`mt-1 ${errors.departure ? "ring-1 ring-red-200" : ""}`}
                value={form.departure}
                onChange={(v) => setForm((p) => ({ ...p, departure: String(v) }))}
                options={[
                  { label: t("contact.form.departure.options.almaty"), value: "Алматы" },
                  { label: t("contact.form.departure.options.astana"), value: "Астана" },
                  { label: t("contact.form.departure.options.other"), value: "Другой" },
                ]}
                placeholder={t("contact.form.departure.placeholder")}
              />
              {errors.departure && <p className="mt-1 text-xs text-red-600">{errors.departure}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t("contact.form.budget.label")}</label>
              <input
                name="budget"
                value={form.budget}
                onChange={change}
                className="mt-1 mb-3 w-full border rounded-xl px-3 py-2"
                placeholder={t("contact.form.budget.placeholder")}
              />
            </div>
          </div>

          {/* Состав */}
          <div className={`mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 ${errors.adults ? "ring-1 ring-red-200 rounded-xl p-2" : ""}`}>
            <div>
              <label className="text-sm font-medium">{t("contact.form.adults.label")}</label>
              <div className="mt-1 flex items-center gap-2">
                <button type="button" onClick={() => dec("adults")} className="w-9 h-9 rounded-lg border flex items-center justify-center select-none press" aria-label="−">−</button>
                <input name="adults" value={form.adults} onChange={change} inputMode="numeric" className="w-16 text-center border rounded-lg py-2" />
                <button type="button" onClick={() => inc("adults")} className="w-9 h-9 rounded-lg border flex items-center justify-center select-none press" aria-label="+">+</button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t("contact.form.children.label")}</label>
              <div className="mt-1 flex items-center gap-2">
                <button type="button" onClick={() => dec("childrenCount")} className="w-9 h-9 rounded-lg border flex items-center justify-center select-none press" aria-label="−">−</button>
                <input name="childrenCount" value={form.childrenCount} onChange={change} inputMode="numeric" className="w-16 text-center border rounded-lg py-2" />
                <button type="button" onClick={() => inc("childrenCount")} className="w-9 h-9 rounded-lg border flex items-center justify-center select-none press" aria-label="+">+</button>
              </div>
            </div>
          </div>
          {errors.adults && <p className="mt-1 text-xs text-red-600">{errors.adults}</p>}

          {/* Возраст детей */}
          {form.childrenCount > 0 && (
            <div className="mt-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: form.childrenCount }).map((_, idx) => (
                  <div key={idx}>
                    <label className="text-xs text-gray-600">{t("contact.form.childAge.label", { index: idx + 1 })}</label>
                    <AgeNumberInput
                      value={form.childrenAges[idx] ?? 5}
                      onChange={(val) =>
                        setForm((p) => {
                          const ages = [...p.childrenAges];
                          ages[idx] = val;
                          return { ...p, childrenAges: ages };
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              {errors.childrenAges && <p className="mt-2 text-xs text-red-600">{errors.childrenAges}</p>}
            </div>
          )}

          {/* Даты проживания */}
          <div className="mt-4">
            <label className="text-sm font-medium">{t("contact.form.dates.label")}</label>
            <button
              type="button"
              onClick={() => setRangeOpen((v) => !v)}
              className={`mt-1 w-full border rounded-xl px-3 py-2 text-left hover:shadow-sm transition press ${errors.dates ? "border-red-400 ring-1 ring-red-200" : ""}`}
            >
              {form.checkIn && form.checkOut
                ? `${form.checkIn} — ${form.checkOut} · ${t("contact.form.dates.nights", { count: nights })}`
                : t("contact.form.dates.empty")}
            </button>
            {errors.dates && <p className="mt-1 text-xs text-red-600">{errors.dates}</p>}

            {rangeOpen && (
              <div className="mt-2 p-3 rounded-xl ring-1 ring-gray-200 bg-white fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-500">{t("contact.form.dates.checkIn")}</span>
                    <input type="date" name="checkIn" min={isoToday} value={form.checkIn} onChange={change} className="mt-1 w-full border rounded-xl px-3 py-2 bg-white" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t("contact.form.dates.checkOut")}</span>
                    <input type="date" name="checkOut" min={form.checkIn || isoToday} value={form.checkOut} onChange={change} className="mt-1 w-full border rounded-xl px-3 py-2 bg-white" />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {[7, 10, 14].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => applyPresetNights(n)}
                      className="px-3 py-2 rounded-lg border hover:bg-gray-50 press"
                      disabled={!form.checkIn}
                      title={
                        form.checkIn
                          ? `${t("contact.form.dates.checkOut")} = ${t("contact.form.dates.checkIn")} + ${t("contact.form.dates.nights", { count: n })}`
                          : t("contact.form.dates.needCheckIn")
                      }
                    >
                      {t("contact.form.dates.preset", { n })}
                    </button>
                  ))}
                  <div className="ml-auto">
                    <button type="button" onClick={() => setRangeOpen(false)} className="px-3 py-2 rounded-lg border press" disabled={!form.checkIn || !form.checkOut}>
                      {t("contact.form.dates.apply")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Комментарий */}
          <label className="mt-4 text-sm font-medium">{t("contact.form.message.label")}</label>
          <textarea
            name="message"
            value={form.message}
            onChange={change}
            className="mt-1 w-full border rounded-xl px-3 py-2 h-28"
            placeholder={t("contact.form.message.placeholder")}
          />

          <div className="mt-4 flex gap-3">
            <button type="submit" className="btn-primary press">{t("contact.form.submit")}</button>
            <a
              href={waHref}
              target="_blank"
              className="btn-ghost press"
              rel="noreferrer"
              onClick={() => track("click_whatsapp", { place: "contact_button" })}
            >
              {t("contact.form.whatsapp")}
            </a>
          </div>

          <p className="mt-3 text-xs text-gray-500">{t("contact.form.note")}</p>
        </form>
      </div>
    </section>
  );
}