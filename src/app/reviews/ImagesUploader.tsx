"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  /** имя скрытого поля формы, куда положим итоговый список (по строкам) */
  name?: string;
  /** максимум изображений */
  max?: number;
  /** отключить */
  disabled?: boolean;
};

export default function ImagesUploader({ name = "images", max = 5, disabled = false }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [list, setList] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const remaining = Math.max(0, max - list.length);

  async function filesToDataUrls(files: FileList): Promise<string[]> {
    const arr = Array.from(files).slice(0, remaining);
    const out: string[] = [];
    for (const f of arr) {
      if (f.size > 5 * 1024 * 1024) continue; // 5MB soft-limit
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result ?? ""));
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      out.push(dataUrl);
    }
    return out;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || disabled || remaining <= 0) return;
    setBusy(true);
    try {
      const urls = await filesToDataUrls(files);
      if (urls.length) setList((prev) => [...prev, ...urls].slice(0, max));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx: number) {
    setList((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="grid gap-2">
      {/* превью — как в модалке */}
      {!!list.length && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {list.map((src, i) => (
            <div key={src + i} className="group relative overflow-hidden rounded-lg border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-28 w-full object-cover" loading="lazy" decoding="async" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  aria-label={t("uploader.remove", "Удалить")}
                  title={t("uploader.remove", "Удалить")}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* кнопка выбора файлов */}
      {!disabled && remaining > 0 && (
        <label
          className="grid h-28 cursor-pointer place-items-center rounded-xl border border-dashed hover:bg-slate-50"
          title={t("uploader.addTitle", "Добавить фото")}
        >
          <div className="text-center text-xs">
            <div className="mb-1 text-2xl leading-none">＋</div>
            <div>{t("uploader.add", "Добавить")}</div>
            <div className="text-gray-400">
              {t("uploader.left", { n: remaining, defaultValue: "{{n}} ост." })}
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={busy}
          />
        </label>
      )}

      {busy && <div className="text-xs text-gray-500">{t("uploader.loading", "Загружаем…")}</div>}

      {/* скрытое поле для формы — одна ссылка/строка (data URL) */}
      <textarea name={name} className="hidden" readOnly value={list.join("\n")} />
    </div>
  );
}