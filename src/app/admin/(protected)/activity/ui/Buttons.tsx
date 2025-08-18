"use client";

import { useState } from "react";

/** Удалить записи аудита старше 180 дней */
export function CleanupButton() {
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (!confirm("Удалить события старше 180 дней?")) return;
    try {
      setPending(true);
      const res = await fetch("/api/activity/cleanup", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Ошибка: ${j?.error || res.status}`);
      } else {
        location.reload();
      }
    } catch (e: any) {
      alert(`Ошибка: ${e?.message || e}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="btn-ghost press px-3 py-2 rounded-lg border"
      title="Удалить события старше 180 дней"
    >
      {pending ? "Чищу…" : "Очистить >180 дней"}
    </button>
  );
}

/** Полностью стереть журнал действий (проверка прав — на сервере) */
export function WipeAllButton() {
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (!confirm("⚠ Полностью очистить журнал действий?\nЭто действие нельзя отменить.")) return;
    try {
      setPending(true);
      const res = await fetch("/api/activity/reset", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Ошибка: ${j?.error || res.status}`);
      } else {
        location.reload();
      }
    } catch (e: any) {
      alert(`Ошибка: ${e?.message || e}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="btn-ghost press px-3 py-2 rounded-lg border text-red-700 border-red-300"
      title="Полностью очистить таблицу действий (только ADMIN)"
    >
      {pending ? "Очищаю…" : "Очистить всё"}
    </button>
  );
}