"use client";

import { useRef, useState } from "react";

type Props = {
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  disabled?: boolean;
};

export default function ImagesUploader({ images, onChange, max = 5, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, max - images.length);

  async function handleFiles(files: FileList | null) {
    if (!files || disabled) return;
    setError(null);

    const arr = Array.from(files).slice(0, remaining);
    if (arr.length === 0) return;

    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const f of arr) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 501) {
            throw new Error("Загрузка отключена на Vercel (локальная запись недоступна).");
          }
          throw new Error(j?.error || "upload failed");
        }
        uploaded.push(j.url as string);
      }
      onChange([...(images || []), ...uploaded].slice(0, max));
    } catch (e) {
      setError((e as Error).message || "Ошибка загрузки");
      console.error(e);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeOne(url: string) {
    if (!disabled) {
      try {
        const res = await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok && res.status !== 501) {
          const j = await res.json().catch(() => ({}));
          console.warn("delete server file failed:", j?.error || res.statusText);
        }
      } catch (e) {
        console.warn("delete server file error:", e);
      }
    }
    onChange((images || []).filter((x) => x !== url));
  }

  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">
        Фото (до {max}). Допустимые: PNG, JPG, WebP, GIF. Максимум 5MB/файл.
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {(images || []).map((url) => (
          <div key={url} className="relative rounded-lg overflow-hidden border bg-white">
            {/* превью */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-28 object-cover" />
            {/* удалить */}
            <button
              type="button"
              className="absolute top-1 right-1 bg-white/90 hover:bg-white text-rose-600 border rounded-full px-2 py-1 text-xs shadow press"
              onClick={() => removeOne(url)}
              disabled={disabled || busy}
              title="Удалить изображение"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Кнопка-добавлялка */}
        {remaining > 0 && (
          <label
            className={[
              "rounded-lg border border-dashed grid place-items-center h-28 cursor-pointer",
              disabled || busy ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50",
            ].join(" ")}
          >
            <div className="text-center text-xs">
              <div className="text-2xl leading-none mb-1">＋</div>
              <div>Добавить</div>
              <div className="text-gray-400">{remaining} ост.</div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={disabled || busy}
            />
          </label>
        )}
      </div>

      {busy && <div className="text-xs text-gray-500 mt-2">Загружаем…</div>}
      {error && <div className="text-xs text-rose-600 mt-2">{error}</div>}
    </div>
  );
}
