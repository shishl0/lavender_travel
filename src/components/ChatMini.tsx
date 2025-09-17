"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Author = "user" | "agent";

type Message = {
  id: number;
  author: Author;
  text: string;
  at: number;
};

function formatTime(ts: number) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(ts);
  } catch {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }
}

export default function ChatMini() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 1,
      author: "agent",
      text: "Здравствуйте! Напишите нам, и менеджер свяжется через WhatsApp.",
      at: Date.now(),
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const nextId = useMemo(() => messages.length + 1, [messages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => {
        draftRef.current?.focus();
      }, 120);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [isOpen]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: nextId, author: "user", text, at: Date.now() }]);
    setDraft("");
  };

  if (!isOpen) {
    return (
      <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto inline-flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-white shadow-xl shadow-violet-500/30 transition-transform hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/60"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-lg">💬</span>
          <span className="pr-1 text-base font-semibold">Есть вопросы?</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex flex-col items-end gap-3">
      <div className="pointer-events-auto flex w-[360px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900/85 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.9)] backdrop-blur">
        <header className="flex items-start justify-between gap-3 px-5 py-4">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-violet-300/90">Lavender</div>
            <div className="text-lg font-semibold">Чат с менеджером</div>
            <div className="text-xs text-slate-400">Оставьте сообщение, и мы ответим в WhatsApp</div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Свернуть чат"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
          >
            ×
          </button>
        </header>

        <div ref={listRef} className="flex max-h-[360px] flex-col gap-3 overflow-y-auto px-5 pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.author === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "max-w-[80%] rounded-2xl px-4 py-2 text-[15px] leading-5",
                  msg.author === "user"
                    ? "bg-violet-500/90 text-white shadow-[0_8px_24px_rgba(99,102,241,0.35)]"
                    : "bg-white/10 text-slate-100 backdrop-blur",
                ].join(" ")}
              >
                <div>{msg.text}</div>
                <div className="mt-1 text-right text-[11px] uppercase tracking-[0.2em] text-white/60">
                  {formatTime(msg.at)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form
          className="border-t border-white/10 bg-slate-900/60 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <label className="flex items-end gap-3">
            <span className="sr-only">Сообщение</span>
            <textarea
              ref={draftRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={1}
              placeholder="Напишите ваш запрос..."
              className="min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[15px] text-white shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300/70"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="submit"
              className="grid h-11 w-11 place-items-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30 transition-transform hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/80 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!draft.trim()}
              aria-label="Отправить"
            >
              ➤
            </button>
          </label>
        </form>
      </div>
    </div>
  );
}
