"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SiteSettingsDTO } from "@/types/cms";

export default function TermsContent({ settings }: { settings: SiteSettingsDTO | null }) {
  const { i18n, t } = useTranslation();
  const lang = (i18n.language || "ru").slice(0, 2) as "ru" | "kk" | "en";

  const { html, docxUrl } = useMemo(() => {
    const html = (settings?.termsOfService as any)?.[lang] as string | null | undefined;
    const docx = (settings?.termsOfServiceDocUrls as any)?.[lang] as string | null | undefined;
    return { html: html || null, docxUrl: docx || null };
  }, [settings, lang]);

  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!docxUrl || html) {
      setDocxHtml(null);
      setLoading(false);
      setErr(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setErr(null);
    fetch("/api/render-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: docxUrl }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j?.ok && j?.html) {
          setDocxHtml(j.html as string);
          setErr(null);
        } else {
          setDocxHtml(null);
          setErr(j?.error || "convert_failed");
        }
      })
      .catch(() => { if (!alive) return; setDocxHtml(null); setErr("fetch_failed"); })
      .finally(() => { if (!alive) return; setLoading(false); });
    return () => { alive = false; };
  }, [docxUrl, html]);

  if (html) return <article className="legal-doc" dangerouslySetInnerHTML={{ __html: html }} />;
  if (docxUrl) {
    if (loading) return (
      <div className="legal-doc">
        <div className="skeleton dark skel-line xl" style={{ width: "60%" }} />
        <div className="skel-gap" />
        <div className="skeleton dark skel-line xl" style={{ width: "100%" }} />
        <div className="skel-gap" />
        <div className="skeleton dark skel-line xl" style={{ width: "93%" }} />
        <div className="skel-gap" />
        <div className="skeleton dark skel-line xl" style={{ width: "87%" }} />
        <div className="skel-gap" />
        <div className="skeleton dark skel-line xl" style={{ width: "76%" }} />
      </div>
    );
    if (docxHtml) return <article className="legal-doc" dangerouslySetInnerHTML={{ __html: docxHtml }} />;
    if (err === "mammoth_not_installed") {
      return (
        <div className="legal-doc">
          <p className="text-rose-600">{t("common.error", "Не удалось отобразить документ: компонент конвертации не установлен.")}</p>
          <p className="mt-2 text-sm text-slate-500"><a className="link" href={docxUrl} target="_blank" rel="noopener noreferrer">{t("about.docs.openFile", "Открыть файл")}</a></p>
        </div>
      );
    }
    return (
      <div className="legal-doc">
        <p className="text-rose-600">{t("common.error", "Не удалось отобразить документ.")}</p>
        <p className="mt-2 text-sm text-slate-500"><a className="link" href={docxUrl} target="_blank" rel="noopener noreferrer">{t("about.docs.openFile", "Открыть файл")}</a></p>
      </div>
    );
  }

  return (
    <div className="legal-doc">
      <p className="text-slate-600">
        {t("about.docs.certificatePlaceholder", "Контент появится после загрузки в CMS")}
      </p>
    </div>
  );
}
