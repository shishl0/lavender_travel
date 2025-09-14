"use client";
import { useRef, useState } from "react";

export default function DestinationImageUploader({
  value,
  onChange,
  disabled,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || !files[0] || disabled) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.url) throw new Error(j?.error || "upload failed");
      onChange(String(j.url));
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    try {
      if (value) {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
      }
    } catch {}
    onChange(null);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <label
          className={[
            "rounded-xl border px-3 py-2 text-sm cursor-pointer",
            disabled || busy ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50",
          ].join(" ")}
        >
          Загрузить
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled || busy}
            onChange={(e) => upload(e.target.files)}
          />
        </label>

        {value && (
          <button
            type="button"
            className="text-rose-600 text-sm hover:underline"
            onClick={remove}
            disabled={disabled || busy}
          >
            Удалить
          </button>
        )}

        {busy && <span className="text-xs text-slate-500">Загрузка…</span>}
      </div>

      {value && (
        <div className="rounded-xl border overflow-hidden max-w-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-48 object-cover" />
        </div>
      )}

      {error && <div className="text-xs text-rose-600">{error}</div>}
    </div>
  );
}
