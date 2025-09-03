"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Localized = { ru: string; kk?: string; en?: string };
type Initial = {
  id: string;
  brandName: string;
  brandTagline: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;

  // расширенные (опционально; если нет — просто игнорим на save)
  statsMode?: "hidden" | "shown";           // упрощённо: только показывать/скрыть
  statsClients?: number | null;
  statsRating?: number | null;              // 1..5
  inTourismSinceISO?: string | null;        // ISO дата для фронта
  address?: Localized | null;               // ru/kk/en
  certificateUrl?: string | null;           // PDF
} | null;

export default function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "save" | "uploadOg" | "uploadCert">(null);

  // --- state как строки (без TS-споров), преобразуем при сохранении
  const [form, setForm] = useState({
    id: initial?.id ?? "",
    brandName: initial?.brandName ?? "",
    brandTagline: initial?.brandTagline ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    ogImageUrl: initial?.ogImageUrl ?? "",
    whatsappNumber: initial?.whatsappNumber ?? "",
    instagramUrl: initial?.instagramUrl ?? "",

    statsMode: (initial?.statsMode ?? "hidden") as "hidden" | "shown",
    statsClients: (initial?.statsClients ?? "")?.toString(),
    statsRating: (initial?.statsRating ?? "")?.toString(),
    inTourismSince: initial?.inTourismSinceISO
      ? new Date(initial.inTourismSinceISO).toISOString().slice(0, 10)
      : "",

    addrRu: initial?.address?.ru ?? "",
    addrKk: (initial?.address as any)?.kk ?? "",
    addrEn: (initial?.address as any)?.en ?? "",

    certificateUrl: initial?.certificateUrl ?? "",
  });

  useEffect(() => {
    setForm({
      id: initial?.id ?? "",
      brandName: initial?.brandName ?? "",
      brandTagline: initial?.brandTagline ?? "",
      metaTitle: initial?.metaTitle ?? "",
      metaDescription: initial?.metaDescription ?? "",
      ogImageUrl: initial?.ogImageUrl ?? "",
      whatsappNumber: initial?.whatsappNumber ?? "",
      instagramUrl: initial?.instagramUrl ?? "",

      statsMode: (initial?.statsMode ?? "hidden") as "hidden" | "shown",
      statsClients: (initial?.statsClients ?? "")?.toString(),
      statsRating: (initial?.statsRating ?? "")?.toString(),
      inTourismSince: initial?.inTourismSinceISO
        ? new Date(initial.inTourismSinceISO).toISOString().slice(0, 10)
        : "",

      addrRu: initial?.address?.ru ?? "",
      addrKk: (initial?.address as any)?.kk ?? "",
      addrEn: (initial?.address as any)?.en ?? "",

      certificateUrl: initial?.certificateUrl ?? "",
    });
    setBusy(null);
  }, [initial?.id]);

  const onChange =
    (name: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [name]: e.target.value }));
    };

  // -------- uploads
  async function uploadOg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("uploadOg");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "upload failed");
      setForm((p) => ({ ...p, ogImageUrl: json.url as string }));
    } catch (err) {
      alert("Ошибка загрузки файла");
      console.error(err);
    } finally {
      setBusy(null);
      e.currentTarget.value = ""; // сбрасываем input
    }
  }

  async function uploadCert(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("uploadCert");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "upload failed");
      setForm((p) => ({ ...p, certificateUrl: json.url as string }));
    } catch (err) {
      alert("Ошибка загрузки PDF");
      console.error(err);
    } finally {
      setBusy(null);
      e.currentTarget.value = "";
    }
  }

  // -------- save
  async function save() {
    if (!form.brandName || !form.metaTitle || !form.metaDescription) {
      alert("brandName, metaTitle, metaDescription — обязательны");
      return;
    }
    setBusy("save");
    try {
      const payload = {
        id: form.id || undefined,
        brandName: form.brandName,
        brandTagline: form.brandTagline || null,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        ogImageUrl: form.ogImageUrl || null,
        whatsappNumber: form.whatsappNumber || null,
        instagramUrl: form.instagramUrl || null,

        // stats (простой понятный режим)
        statsMode: form.statsMode, // "hidden" | "shown"
        statsClients: form.statsClients ? Number(form.statsClients) : null,
        statsRating: form.statsRating ? Number(form.statsRating) : null,
        inTourismSinceISO: form.inTourismSince ? new Date(form.inTourismSince).toISOString() : null,

        address: {
          ru: form.addrRu || null,
          kk: form.addrKk || null,
          en: form.addrEn || null,
        },

        certificateUrl: form.certificateUrl || null,
      };

      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "save failed");
      router.refresh();
    } catch (err) {
      alert("Ошибка сохранения");
      console.error(err);
    } finally {
      setBusy(null);
    }
  }

  const statChip = (val: "hidden" | "shown", label: string) => (
    <button
      type="button"
      onClick={() => setForm((p) => ({ ...p, statsMode: val }))}
      className={[
        "px-3 h-9 rounded-xl border text-sm press",
        form.statsMode === val
          ? "border-[rgba(123,77,187,.35)] bg-[rgba(123,77,187,.06)] text-[#7B4DBB]"
          : "border-[#e5e7eb] bg-white text-[#1B1F3B]",
      ].join(" ")}
      aria-pressed={form.statsMode === val}
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-6">
      {/* BRAND + SEO */}
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4 md:p-5 shadow-sm">
        <h4 className="text-[14.5px] font-semibold text-[#1B1F3B] mb-3">Бренд & SEO</h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Brand</label>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.brandName}
              onChange={onChange("brandName")}
              placeholder="Lavender Travel KZ"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Tagline</label>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.brandTagline || ""}
              onChange={onChange("brandTagline")}
              placeholder="Вылеты из Алматы и Астаны"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">SEO title</label>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.metaTitle}
              onChange={onChange("metaTitle")}
              placeholder="Lavender Travel KZ — туры из Алматы и Астаны"
              required
            />
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-sm text-[#374151]">SEO description</label>
            <textarea
              className="border rounded-xl px-3 py-2 h-24"
              value={form.metaDescription}
              onChange={onChange("metaDescription")}
              placeholder="Авторские туры, забота 24/7, маршруты под ваш стиль отдыха."
              required
            />
          </div>
        </div>
      </section>

      {/* MEDIA & CONTACTS */}
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4 md:p-5 shadow-sm">
        <h4 className="text-[14.5px] font-semibold text-[#1B1F3B] mb-3">Медиа & Контакты</h4>

        <div className="grid md:grid-cols-2 gap-4">
          {/* OG */}
          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">OG image</label>
            <div className="flex items-center gap-2">
              <input
                className="border rounded-xl px-3 py-2 flex-1"
                value={form.ogImageUrl || ""}
                onChange={onChange("ogImageUrl")}
                placeholder="/uploads/og-*.png"
              />
              <label className="btn btn-ghost btn-sm press cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={uploadOg} />
                {busy === "uploadOg" ? "Загрузка…" : "Загрузить"}
              </label>
            </div>
            {form.ogImageUrl ? (
              <img
                src={form.ogImageUrl}
                alt="OG preview"
                className="mt-2 max-h-40 rounded-lg border"
              />
            ) : null}
          </div>

          {/* CERT */}
          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Certificate (PDF)</label>
            <div className="flex items-center gap-2">
              <input
                className="border rounded-xl px-3 py-2 flex-1"
                value={form.certificateUrl || ""}
                onChange={onChange("certificateUrl")}
                placeholder="/uploads/cert-*.pdf"
              />
              <label className="btn btn-ghost btn-sm press cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={uploadCert}
                />
                {busy === "uploadCert" ? "Загрузка…" : "Загрузить PDF"}
              </label>
            </div>
            {form.certificateUrl ? (
              <a
                className="text-[13px] text-[#7B4DBB] underline mt-1"
                href={form.certificateUrl}
                target="_blank"
              >
                Открыть сертификат
              </a>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">WhatsApp number</label>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.whatsappNumber || ""}
              onChange={onChange("whatsappNumber")}
              placeholder="77080086191"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Instagram URL</label>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.instagramUrl || ""}
              onChange={onChange("instagramUrl")}
              placeholder="https://www.instagram.com/lavender_travel_kz"
            />
          </div>
        </div>
      </section>

      {/* STATS (простая логика) */}
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4 md:p-5 shadow-sm">
        <h4 className="text-[14.5px] font-semibold text-[#1B1F3B] mb-3">Статистика / опыт</h4>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Клиентов (шт.)</label>
            <input
              type="number"
              className="border rounded-xl px-3 py-2"
              value={form.statsClients}
              onChange={onChange("statsClients")}
              placeholder="500"
              min={0}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Средняя оценка (1–5)</label>
            <input
              type="number"
              step="0.1"
              className="border rounded-xl px-3 py-2"
              value={form.statsRating}
              onChange={onChange("statsRating")}
              placeholder="4.9"
              min={1}
              max={5}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">В туризме с</label>
            <input
              type="date"
              className="border rounded-xl px-3 py-2"
              value={form.inTourismSince}
              onChange={onChange("inTourismSince")}
            />
            <p className="text-[12px] text-[#9AA3AF]">
              Укажи дату начала — на сайте посчитаем опыт в годах/месяцах.
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm text-[#374151] mb-2">Режим блока</div>
          <div className="flex items-center gap-2">
            {statChip("shown", "Показывать")}
            {statChip("hidden", "Скрыть")}
          </div>
        </div>
      </section>

      {/* ADDRESS (локализуемый) */}
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4 md:p-5 shadow-sm">
        <h4 className="text-[14.5px] font-semibold text-[#1B1F3B] mb-3">Адрес (локализация)</h4>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Адрес (ru)</label>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.addrRu}
              onChange={onChange("addrRu")}
              placeholder="Казахстан, Алматы…"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Адрес (kk)</label>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.addrKk}
              onChange={onChange("addrKk")}
              placeholder="Қазақста́н, Алма́ты…"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm text-[#374151]">Адрес (en)</label>
            <input
              className="border rounded-xl px-3 py-2"
              value={form.addrEn}
              onChange={onChange("addrEn")}
              placeholder="Kazakhstan, Almaty…"
            />
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="pt-1">
        <button
          className="btn btn-primary press"
          onClick={save}
          disabled={busy === "save" || busy === "uploadOg" || busy === "uploadCert"}
        >
          {busy === "save" ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}