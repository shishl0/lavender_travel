"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ActivateButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function activate() {
    try {
      const res = await fetch("/api/settings/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "activate failed");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      alert("Ошибка активации");
      console.error(e);
    }
  }

  return (
    <button
      onClick={activate}
      disabled={pending}
      className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 press disabled:opacity-60"
    >
      {pending ? "Активируем…" : "Сделать активным"}
    </button>
  );
}