"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  id: string;
  brandName: string;
  brandTagline: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
} | null;

export default function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "save" | "upload">(null);

  const [form, setForm] = useState({
    id: initial?.id ?? "",
    brandName: initial?.brandName ?? "",
    brandTagline: initial?.brandTagline ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    ogImageUrl: initial?.ogImageUrl ?? "",
    whatsappNumber: initial?.whatsappNumber ?? "",
    instagramUrl: initial?.instagramUrl ?? "",
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
    });
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
    setBusy("upload");
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
    }
  }

  async function save() {
    if (!form.brandName || !form.metaTitle || !form.metaDescription) {
      alert("brandName, metaTitle, metaDescription — обязательны");
      return;
    }
    setBusy("save");
    try {
      const res = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <label className="text-sm font-medium">Brand</label>
        <input
          className="border rounded-lg px-3 py-2"
          value={form.brandName}
          onChange={onChange("brandName")}
          placeholder="Lavender Travel KZ"
          required
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Tagline</label>
        <input
          className="border rounded-lg px-3 py-2"
          value={form.brandTagline || ""}
          onChange={onChange("brandTagline")}
          placeholder="Almaty & Astana"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Meta title</label>
        <input
          className="border rounded-lg px-3 py-2"
          value={form.metaTitle}
          onChange={onChange("metaTitle")}
          placeholder="Lavender Travel KZ — туры из Алматы и Астаны"
          required
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Meta description</label>
        <textarea
          className="border rounded-lg px-3 py-2 h-24"
          value={form.metaDescription}
          onChange={onChange("metaDescription")}
          placeholder="Авторские туры, забота 24/7, маршруты под ваш стиль отдыха."
          required
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">OG image</label>
        <div className="flex items-center gap-2">
          <input
            className="border rounded-lg px-3 py-2 flex-1"
            value={form.ogImageUrl || ""}
            onChange={onChange("ogImageUrl")}
            placeholder="/uploads/og-*.png"
          />
          <label className="btn-ghost press cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={uploadOg} />
            {busy === "upload" ? "Загрузка…" : "Загрузить"}
          </label>
        </div>
        {form.ogImageUrl ? (
          <img src={form.ogImageUrl} alt="OG preview" className="mt-2 max-h-40 rounded-lg border" />
        ) : null}
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">WhatsApp number</label>
        <input
          className="border rounded-lg px-3 py-2"
          value={form.whatsappNumber || ""}
          onChange={onChange("whatsappNumber")}
          placeholder="77080086191"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Instagram URL</label>
        <input
          className="border rounded-lg px-3 py-2"
          value={form.instagramUrl || ""}
          onChange={onChange("instagramUrl")}
          placeholder="https://www.instagram.com/lavender_travel_kz"
        />
      </div>

      <div className="pt-2">
        <button
          className="w-50 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded press"
          onClick={save}
          disabled={busy === "save" || busy === "upload"}
        >
          {busy === "save" ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}