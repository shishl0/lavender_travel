"use client";
import { useState } from "react";
import { track } from "@/lib/track";

export default function ContactMiniForm({ onDone, waDigits }: { onDone?: () => void; waDigits: string }) {
  const [dir, setDir] = useState("");
  const [dates, setDates] = useState("");
  const [budget, setBudget] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Здравствуйте! Хочу подобрать тур.\nНаправление: ${dir}\nДаты: ${dates}\nБюджет: ${budget}`;
    const url = `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`;
    track("send_lead", { place: "hero_modal" });
    window.open(url, "_blank", "noopener,noreferrer");
    onDone?.();
  };

  return (
    <form className="admin-ui space-y-3" onSubmit={submit}>
      <div>
        <label className="text-xs text-gray-600">Направление</label>
        <input value={dir} onChange={(e) => setDir(e.target.value)} placeholder="ОАЭ, Турция…" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">Даты</label>
          <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="май–июнь / 10–15 ночей" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Бюджет</label>
          <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="до 800 000 ₸" />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary" type="submit">Отправить в WhatsApp</button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>Отмена</button>
      </div>
    </form>
  );
}