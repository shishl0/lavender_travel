"use client";
import { useTranslation } from "react-i18next";

const langs = [
  { code: "ru", label: "RU" },
  { code: "kk", label: "KK" },
  { code: "en", label: "EN" }
] as const;

export default function LanguageSwitcher(){
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-1 rounded-xl border px-2 py-1">
      {langs.map(l => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={`px-2 py-1 rounded-lg press ${i18n.language?.startsWith(l.code) ? "bg-[var(--tint)] font-semibold" : "opacity-80 hover:opacity-100"}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}