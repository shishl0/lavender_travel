"use client";

import { useState } from "react";

export default function ResetButton() {
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (!confirm("Сбросить историю аналитики? Это удалит события и агрегаты.")) return;
    try {
      setPending(true);
      const res = await fetch("/api/analytics/reset", { method: "POST" });
      if (!res.ok) throw new Error("reset failed");
      location.reload();
    } catch {
      alert("Ошибка сброса аналитики");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 press"
      disabled={pending}
    >
      {pending ? "Сбрасываю…" : "Сбросить аналитику"}
    </button>
  );
}