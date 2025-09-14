"use client";

import { useState } from "react";

export default function ActionsBar() {
  const [busy, setBusy] = useState<null | "revalidate" | "snapshot">(null);

  async function doRevalidate() {
    try {
      setBusy("revalidate");
      const r = await fetch("/api/admin/revalidate", { method: "POST" });
      if (!r.ok) throw new Error("Revalidate failed");
      alert("Кеш CMS инвалидирован.");
    } catch (e) {
      console.error(e);
      alert("Ошибка при инвалидации кеша");
    } finally {
      setBusy(null);
    }
  }

  async function doSnapshot() {
    try {
      setBusy("snapshot");
      const r = await fetch("/api/admin/snapshot", { method: "POST" });
      if (!r.ok) throw new Error("Snapshot failed");
      alert("Снапшот сохранён в public/cms-snapshot.json");
    } catch (e) {
      console.error(e);
      alert("Ошибка при сохранении снапшота");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button className="btn-ghost press" onClick={doRevalidate} disabled={busy !== null}>
        {busy === "revalidate" ? "…" : "Инвалидировать кеш"}
      </button>
      <button className="btn-ghost press" onClick={doSnapshot} disabled={busy !== null}>
        {busy === "snapshot" ? "…" : "Сохранить снапшот"}
      </button>
    </div>
  );
}