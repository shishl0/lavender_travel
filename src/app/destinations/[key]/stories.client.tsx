"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Poi = { title: any; imageUrl?: string | null; blurb?: any };

export default function Stories({ items }: { items: Poi[] }) {
  const [open, setOpen] = useState(false);
  const [startAt, setStartAt] = useState(0);

  const data = useMemo(
    () =>
      items.map((it, idx) => ({
        idx,
        title: it.title?.ru || it.title?.kk || it.title?.en || `#${idx + 1}`,
        blurb: it.blurb?.ru || it.blurb?.kk || it.blurb?.en || "",
        image: it.imageUrl || "",
      })),
    [items]
  );

  return (
    <>
      {/* превью без видимого горизонтального скроллбара */}
      <div className="no-scrollbar flex gap-5 overflow-x-auto pb-1 pt-1">
        {data.map((it) => (
          <button
            key={it.idx}
            type="button"
            onClick={() => { setStartAt(it.idx); setOpen(true); }}
            className="group w-72 shrink-0 text-left"
          >
            <div className="relative h-[420px] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.image ? (
                <img
                  src={it.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-slate-400">no image</div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3">
                <div className="line-clamp-2 text-[15px] font-semibold leading-5 text-white drop-shadow">
                  {it.title}
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-blue-500/0 transition-[ring,box-shadow] duration-300 group-hover:ring-1 group-hover:ring-blue-500/20" />
            </div>
          </button>
        ))}
      </div>

      {open && <StoryPlayer items={data} startIndex={startAt} onClose={() => setOpen(false)} />}

      <style jsx>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}

/* ---------- полноэкранный сторис-плеер (CSS-progress + arrows + autclose) ---------- */
function StoryPlayer({
  items,
  startIndex = 0,
  onClose,
}: {
  items: Array<{ idx: number; title: string; blurb: string; image: string }>;
  startIndex?: number;
  onClose: () => void;
}) {
  const DURATION = 15000; // 15s
  const [i, setI] = useState(startIndex);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const go = useCallback(
    (dir: -1 | 1) => {
      setI((cur) => {
        let n = cur + dir;
        if (n < 0) n = items.length - 1;
        if (n >= items.length) n = 0;
        return n;
      });
    },
    [items.length]
  );

  const seekByClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      let idx = Math.floor((x / rect.width) * items.length);
      if (idx < 0) idx = 0;
      if (idx > items.length - 1) idx = items.length - 1;
      setI(idx);
    },
    [items.length]
  );

  // управление с клавиатуры
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const cur = items[i];

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 text-white">
      {/* крестик — крупный */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-[80] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
        aria-label="Закрыть"
      >
        <span className="text-[30px] leading-[1]">×</span>
      </button>

      {/* зоны клика назад/вперёд */}
      <button
        aria-label="Назад"
        className="absolute inset-y-0 left-0 w-1/3"
        onClick={() => go(-1)}
      />
      <button
        aria-label="Вперёд"
        className="absolute inset-y-0 right-0 w-1/3"
        onClick={() => go(1)}
      />

      {/* холст истории: до 97vh, полностью покрываем фото */}
      <div className="grid h-full place-items-center px-4">
        <div className="relative w-full max-w-[480px] md:max-w-[560px] h-[97vh] max-h-[97vh] aspect-[9/16] overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] ring-1 ring-white/10">
          {/* фото: покрытие окна */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={cur.image || cur.title}
            src={cur.image || "/placeholder.jpg"}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* ПРОГРЕСС — внутри границ; click-to-seek */}
          <div
            ref={containerRef}
            className="progress-container absolute inset-x-0 top-0 cursor-pointer select-none p-3"
            onClick={seekByClick}
          >
            <div className="flex gap-1">
              {items.map((_, idx) => {
                const passed = idx < i;
                const active = idx === i;
                return (
                  <div key={idx} className="h-[3px] flex-1 overflow-hidden rounded bg-white/25">
                    <div
                      className={[
                        "bar h-full rounded bg-white/95 will-change-transform",
                        passed ? "bar--passed" : "",
                        active ? "bar--active" : "",
                      ].join(" ")}
                      style={active ? { animationDuration: `${DURATION}ms` } : undefined}
                      onAnimationEnd={
                        active
                          ? () => {
                              if (i >= items.length - 1) onClose();
                              else go(1);
                            }
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
            {/* заголовок под прогрессом */}
            <div className="mt-2 line-clamp-2 text-[17px] font-semibold leading-5 drop-shadow">
              {cur.title}
            </div>
          </div>

          {/* низ: мягкий градиент + blur + описание */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 via-black/20 to-transparent backdrop-blur-lg" />
            {cur.blurb ? (
              <div className="relative text-[15px] leading-6 opacity-95 drop-shadow-md">
                {cur.blurb}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* CSS прогресса */}
      <style jsx>{`
        @keyframes fill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .bar { transform-origin: left center; transform: scaleX(0); }
        .bar--passed { transform: scaleX(1); transition: none; }
        .bar--active { animation-name: fill; animation-timing-function: linear; animation-fill-mode: forwards; }
      `}</style>
    </div>
  );
}
