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

  phoneNumber: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;

  statsMode?: "hidden" | "shown";
  statsClients?: number | null;
  statsRating?: number | null;
  inTourismSinceISO?: string | null;

  address?: Localized | null;
  certificateUrl?: string | null;
  mapEmbedUrl?: string | null;

  privacyPolicyDocUrls?: Partial<Record<"ru" | "kk" | "en", string>> | null;
  termsOfServiceDocUrls?: Partial<Record<"ru" | "kk" | "en", string>> | null;
} | null;

export default function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const inputBase =
    "h-[40px] w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] leading-[1.2] outline-none focus:ring-2 focus:ring-violet-200";

  const isPdf = (u?: string | null) => !!u && /\.pdf($|\?)/i.test(u);
  const [busy, setBusy] = useState<null | "save" | "uploadOg" | "uploadCert">(null);

  const [form, setForm] = useState({
    id: initial?.id ?? "",
    brandName: initial?.brandName ?? "",
    brandTagline: initial?.brandTagline ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    ogImageUrl: initial?.ogImageUrl ?? "",

    phoneNumber: initial?.phoneNumber ?? "",
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
    mapEmbedUrl: initial?.mapEmbedUrl ?? "",

    // DOCX ссылки по языкам
    ppRu: initial?.privacyPolicyDocUrls?.ru ?? "",
    ppKk: initial?.privacyPolicyDocUrls?.kk ?? "",
    ppEn: initial?.privacyPolicyDocUrls?.en ?? "",
    tosRu: initial?.termsOfServiceDocUrls?.ru ?? "",
    tosKk: initial?.termsOfServiceDocUrls?.kk ?? "",
    tosEn: initial?.termsOfServiceDocUrls?.en ?? "",
  });

  // нормализация телефонов
  const waDigits = useMemo(() => {
    let d = (form.whatsappNumber || "").replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7") && d) d = "7" + d;
    return d;
  }, [form.whatsappNumber]);

  const phoneTelHref = useMemo(() => {
    let d = (form.phoneNumber || "").replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7") && d) d = "7" + d;
    if (!d) return "";
    return `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
  }, [form.phoneNumber]);

  useEffect(() => {
    setForm((p) => ({
      ...p,
      id: initial?.id ?? "",
      brandName: initial?.brandName ?? "",
      brandTagline: initial?.brandTagline ?? "",
      metaTitle: initial?.metaTitle ?? "",
      metaDescription: initial?.metaDescription ?? "",
      ogImageUrl: initial?.ogImageUrl ?? "",

      phoneNumber: initial?.phoneNumber ?? "",
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
      mapEmbedUrl: initial?.mapEmbedUrl ?? "",

      ppRu: initial?.privacyPolicyDocUrls?.ru ?? "",
      ppKk: initial?.privacyPolicyDocUrls?.kk ?? "",
      ppEn: initial?.privacyPolicyDocUrls?.en ?? "",
      tosRu: initial?.termsOfServiceDocUrls?.ru ?? "",
      tosKk: initial?.termsOfServiceDocUrls?.kk ?? "",
      tosEn: initial?.termsOfServiceDocUrls?.en ?? "",
    }));
    setBusy(null);
  }, [initial?.id]);

  const onChange =
    (name: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [name]: e.target.value }));
    };

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
      e.currentTarget.value = "";
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
      alert("Ошибка загрузки PDF/изображения");
      console.error(err);
    } finally {
      setBusy(null);
      e.currentTarget.value = "";
    }
  }

  function validUrl(u?: string) {
    if (!u) return true;
    try {
      if (u.startsWith("/")) return true;
      new URL(u);
      return true;
    } catch {
      return false;
    }
  }

  // ===== upload/delete/view helpers for doc fields =====
  async function uploadDocFile(file: File, setUrl: (u: string) => void, setSpin: (v: boolean) => void) {
    setSpin(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json?.url) throw new Error(json?.error || "upload failed");
      setUrl(json.url as string);
    } catch (e) {
      alert("Не удалось загрузить файл");
      console.error(e);
    } finally {
      setSpin(false);
    }
  }
  async function deleteUploaded(url: string, setUrl: (u: string) => void, setSpin: (v: boolean) => void) {
    if (!url) return;
    if (!url.startsWith("/uploads/")) {
      if (!confirm("Это внешний URL. Очистить поле?")) return;
      setUrl("");
      return;
    }
    if (!confirm("Удалить файл с сервера?")) return;
    setSpin(true);
    try {
      const res = await fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "delete failed");
      setUrl("");
    } catch (e) {
      alert("Не удалось удалить файл");
      console.error(e);
    } finally {
      setSpin(false);
    }
  }
  function openInNewTab(u?: string) {
    if (!u) return;
    try {
      const href = u.startsWith("/") ? u : new URL(u).toString();
      window.open(href, "_blank", "noopener,noreferrer");
    } catch {
      window.open(u, "_blank", "noopener,noreferrer");
    }
  }

  function DocField({
    label,
    value,
    placeholder,
    onChange,
  }: {
    label: string;
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
  }) {
    const [spin, setSpin] = useState(false);
    const fileId = useMemo(() => "up_" + Math.random().toString(36).slice(2), []);

    return (
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-700">{label}</div>
          <div className="flex items-center gap-1.5">
            {/* upload */}
            <label
              htmlFor={fileId}
              className={[
                "inline-flex h-8 items-center rounded-lg border-2 px-2 text-sm press",
                "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100",
                spin ? "opacity-60 pointer-events-none" : "",
              ].join(" ")}
              title="Загрузить"
            >
              ⬆︎
              <input
                id={fileId}
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  uploadDocFile(f, onChange, setSpin);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            {/* view */}
            <button
              type="button"
              onClick={() => openInNewTab(value)}
              disabled={!value || spin}
              className={[
                "inline-flex h-8 items-center rounded-lg border-2 px-2 text-sm press",
                value
                  ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  : "border-slate-200 bg-white text-slate-400 opacity-60",
              ].join(" ")}
              title="Посмотреть"
            >
              📂
            </button>

            {/* delete — красный крестик */}
            <button
              type="button"
              onClick={() => deleteUploaded(value, onChange, setSpin)}
              disabled={!value || spin}
              className={[
                "inline-flex h-8 items-center rounded-lg border-2 px-2 text-sm press",
                value
                  ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "border-rose-200 bg-rose-50 text-rose-300 opacity-60",
              ].join(" ")}
              title="Удалить"
            >
              ✖︎
            </button>
          </div>
        </div>
      </div>
    );
  }

  // строка из трёх DocField (RU/KK/EN)
  const DocxTriplet = ({
    label,
    ru,
    kk,
    en,
    onRu,
    onKk,
    onEn,
  }: {
    label: string;
    ru: string; kk: string; en: string;
    onRu: (v: string) => void;
    onKk: (v: string) => void;
    onEn: (v: string) => void;
  }) => (
    <div className="grid gap-2">
      <div className="text-sm font-medium text-slate-800">{label}</div>
      <div className="grid gap-4 md:grid-cols-3">
        <DocField label="RU" value={ru} placeholder="Напр.: /uploads/privacy-ru.docx" onChange={onRu} />
        <DocField label="KK" value={kk} placeholder="Напр.: /uploads/privacy-kk.docx" onChange={onKk} />
        <DocField label="EN" value={en} placeholder="Напр.: /uploads/privacy-en.docx" onChange={onEn} />
      </div>
    </div>
  );

  async function save() {
    if (!form.brandName || !form.metaTitle || !form.metaDescription) {
      alert("brandName, metaTitle, metaDescription — обязательны");
      return;
    }
    if (form.instagramUrl && !validUrl(form.instagramUrl)) {
      alert("Instagram URL выглядит некорректно");
      return;
    }
    if (form.mapEmbedUrl && !validUrl(form.mapEmbedUrl)) {
      alert("Map embed URL выглядит некорректно");
      return;
    }

    setBusy("save");
    try {
      const payload = {
        id: form.id || undefined,

        // бренд/seo
        brandName: form.brandName,
        brandTagline: form.brandTagline || null,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        ogImageUrl: form.ogImageUrl || null,

        // контакты
        phoneNumber: form.phoneNumber || null,
        whatsappNumber: waDigits || null,
        instagramUrl: form.instagramUrl || null,

        // статы
        statsMode: form.statsMode,
        statsClients: form.statsClients ? Number(form.statsClients) : null,
        statsRating: form.statsRating ? Number(form.statsRating) : null,
        inTourismSince: form.inTourismSince ? new Date(form.inTourismSince) : null,

        // адрес/доки
        address: {
          ru: form.addrRu || null,
          kk: form.addrKk || null,
          en: form.addrEn || null,
        },
        certificateUrl: form.certificateUrl || null,
        mapEmbedUrl: form.mapEmbedUrl || null,

        // docx
        privacyPolicyDocUrls: {
          ru: form.ppRu || undefined,
          kk: form.ppKk || undefined,
          en: form.ppEn || undefined,
        },
        termsOfServiceDocUrls: {
          ru: form.tosRu || undefined,
          kk: form.tosKk || undefined,
          en: form.tosEn || undefined,
        },
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
          ? "border-violet-300 bg-violet-50 text-violet-700"
          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
      ].join(" ")}
      aria-pressed={form.statsMode === val}
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-6">
      {/* BRAND + SEO */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <h4 className="mb-3 text-[14.5px] font-semibold text-slate-900">Бренд & SEO</h4>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Brand</label>
            <input
              className={inputBase}
              value={form.brandName}
              onChange={onChange("brandName")}
              placeholder="Lavender Travel KZ"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Tagline</label>
            <input
              className={inputBase}
              value={form.brandTagline || ""}
              onChange={onChange("brandTagline")}
              placeholder="Вылеты из Алматы и Астаны"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">SEO title</label>
            <input
              className={inputBase}
              value={form.metaTitle}
              onChange={onChange("metaTitle")}
              placeholder="Lavender Travel KZ — туры из Алматы и Астаны"
              required
            />
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-sm text-slate-700">SEO description</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 h-24 outline-none focus:ring-2 focus:ring-violet-200"
              value={form.metaDescription}
              onChange={onChange("metaDescription")}
              placeholder="Авторские туры, забота 24/7, маршруты под ваш стиль отдыха."
              required
            />
          </div>
        </div>
      </section>

      {/* MEDIA & CONTACTS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <h4 className="mb-3 text-[14.5px] font-semibold text-slate-900">Медиа & Контакты</h4>

        <div className="grid gap-4 md:grid-cols-2">
          {/* OG image */}
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">OG image</label>
            <div className="flex items-center gap-2">
              <label className="btn btn-ghost btn-sm press cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={uploadOg} />
                {busy === "uploadOg" ? "Загрузка…" : "Загрузить"}
              </label>
            </div>
            {form.ogImageUrl ? (
              <img
                src={form.ogImageUrl}
                alt="OG preview"
                className="mt-2 max-h-48 rounded-lg border border-slate-200"
              />
            ) : null}
          </div>

          {/* Сертификат */}
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Certificate (PDF/JPG)</label>
            <div className="flex items-center gap-2">
              <label className="btn btn-ghost btn-sm press cursor-pointer">
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={uploadCert} />
                {busy === "uploadCert" ? "Загрузка…" : "Загрузить"}
              </label>
            </div>
            {form.certificateUrl ? (
              isPdf(form.certificateUrl) ? (
                <a
                  href={form.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block relative rounded-lg border border-slate-200 overflow-hidden hover:shadow-sm transition"
                  title="Открыть сертификат PDF"
                >
                  <iframe
                    src={form.certificateUrl}
                    className="h-48 w-full pointer-events-none"
                    aria-hidden
                  />
                </a>
              ) : (
                <a href={form.certificateUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                  <img
                    src={form.certificateUrl}
                    alt="Certificate preview"
                    className="max-h-40 rounded-lg border border-slate-200 hover:shadow-sm transition"
                  />
                </a>
              )
            ) : null}
          </div>

          {/* Телефон и WhatsApp */}
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Phone (для звонков)</label>
            <input
              className={inputBase}
              value={form.phoneNumber || ""}
              onChange={onChange("phoneNumber")}
              placeholder="+7 708 000 00 00"
            />
            {phoneTelHref && (
              <div className="text-[12px] text-slate-500">Отформатировано: {phoneTelHref}</div>
            )}
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">WhatsApp (только цифры)</label>
            <input
              className={inputBase}
              value={form.whatsappNumber || ""}
              onChange={onChange("whatsappNumber")}
              placeholder="77080086191"
            />
            {waDigits && (
              <div className="text-[12px] text-slate-500">wa.me/{waDigits}</div>
            )}
          </div>

          {/* Instagram */}
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-sm text-slate-700">Instagram URL</label>
            <input
              className={inputBase}
              value={form.instagramUrl || ""}
              onChange={onChange("instagramUrl")}
              placeholder="https://www.instagram.com/your_brand"
            />
            <div className="text-[12px] text-slate-500">Полный URL предпочтительнее, но сработают и относительные.</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <h4 className="mb-3 text-[14.5px] font-semibold text-slate-900">Статистика / опыт</h4>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Клиентов (шт.)</label>
            <input
              type="number"
              className={inputBase}
              value={form.statsClients}
              onChange={onChange("statsClients")}
              placeholder="500"
              min={0}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Средняя оценка (1–5)</label>
            <input
              type="number"
              step="0.1"
              className={inputBase}
              value={form.statsRating}
              onChange={onChange("statsRating")}
              placeholder="4.9"
              min={1}
              max={5}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">В туризме с</label>
            <input
              type="date"
              className={inputBase}
              value={form.inTourismSince}
              onChange={onChange("inTourismSince")}
            />
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-2 text-sm text-slate-700">Режим блока</div>
          <div className="flex items-center gap-2">
            {statChip("shown", "Показывать")}
            {statChip("hidden", "Скрыть")}
          </div>
        </div>
      </section>

      {/* ADDRESS & MAP */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <h4 className="mb-3 text-[14.5px] font-semibold text-slate-900">Адрес и карта</h4>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Адрес (ru)</label>
            <input
              className={inputBase}
              value={form.addrRu}
              onChange={onChange("addrRu")}
              placeholder="Казахстан, Алматы…"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Адрес (kk)</label>
            <input
              className={inputBase}
              value={form.addrKk}
              onChange={onChange("addrKk")}
              placeholder="Қазақста́н, Алма́ты…"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm text-slate-700">Адрес (en)</label>
            <input
              className={inputBase}
              value={form.addrEn}
              onChange={onChange("addrEn")}
              placeholder="Kazakhstan, Almaty…"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-1.5">
          <label className="text-sm text-slate-700">Map embed URL</label>
          <input
            className={inputBase}
            value={form.mapEmbedUrl}
            onChange={onChange("mapEmbedUrl")}
            placeholder="https://maps.google.com/maps?q=almaty&...&output=embed"
          />
          {form.mapEmbedUrl && validUrl(form.mapEmbedUrl) && (
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
              <iframe
                src={form.mapEmbedUrl}
                className="w-full h-[260px]"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </section>

      {/* DOCS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <h4 className="mb-3 text-[14.5px] font-semibold text-slate-900">Документы</h4>

        <div className="grid gap-6">
          <DocxTriplet
            label="Политика конфиденциальности"
            ru={form.ppRu}
            kk={form.ppKk}
            en={form.ppEn}
            onRu={(v) => setForm((p) => ({ ...p, ppRu: v }))}
            onKk={(v) => setForm((p) => ({ ...p, ppKk: v }))}
            onEn={(v) => setForm((p) => ({ ...p, ppEn: v }))}
          />

          <DocxTriplet
            label="Условия обслуживания"
            ru={form.tosRu}
            kk={form.tosKk}
            en={form.tosEn}
            onRu={(v) => setForm((p) => ({ ...p, tosRu: v }))}
            onKk={(v) => setForm((p) => ({ ...p, tosKk: v }))}
            onEn={(v) => setForm((p) => ({ ...p, tosEn: v }))}
          />
        </div>
      </section>

      {/* ACTIONS */}
      <div className="pt-1 flex items-center gap-3">
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