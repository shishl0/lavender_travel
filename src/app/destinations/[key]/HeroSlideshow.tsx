"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  /** Длительность показа кадра (без учёта перехода), по умолчанию 5000 мс */
  holdMs?: number;
  /** Длительность перехода (dissolve), по умолчанию 1500 мс */
  fadeMs?: number;
  className?: string;
};

export default function HeroSlideshow({
  images,
  holdMs = 5000,
  fadeMs = 1900,
  className = "",
}: Props) {
  const imgs = useMemo(() => (images || []).filter(Boolean), [images]);
  const [cur, setCur] = useState(0);
  const [next, setNext] = useState(1);
  const [phase, setPhase] = useState<"idle" | "fading">("idle");
  const tHold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tFade = useRef<ReturnType<typeof setTimeout> | null>(null);

  // какие src уже загружены/декодированы
  const loadedRef = useRef<Set<string>>(new Set());
  const markLoaded = (src?: string) => {
    if (!src) return;
    loadedRef.current.add(src);
  };

  // предзагрузка
  useEffect(() => {
    if (typeof window === "undefined") return;
    imgs.forEach((src) => {
      const i = new Image();
      i.decoding = "async";
      i.src = src;
      i.onload = () => markLoaded(src);
      i.onerror = () => markLoaded(src);
    });
  }, [imgs]);

  // очистка
  useEffect(() => {
    return () => {
      if (tHold.current) clearTimeout(tHold.current);
      if (tFade.current) clearTimeout(tFade.current);
    };
  }, []);

  // цикл показа
  useEffect(() => {
    if (imgs.length <= 1) return;

    const startFade = () => {
      setPhase("fading");
      tFade.current = setTimeout(() => {
        setCur((c) => {
          const n = (c + 1) % imgs.length;
          setNext((n + 1) % imgs.length);
          setPhase("idle");
          return n;
        });
        tHold.current = setTimeout(tick, holdMs);
      }, fadeMs);
    };

    const waitReadyThenFade = () => {
      const nextSrc = imgs[next];
      if (loadedRef.current.has(nextSrc)) {
        startFade();
      } else {
        // ждём, пока браузер дорисует next (без мигания)
        tFade.current = setTimeout(waitReadyThenFade, 50);
      }
    };

    const tick = () => {
      waitReadyThenFade();
    };

    // первый запуск
    tHold.current = setTimeout(tick, holdMs);

    return () => {
      if (tHold.current) clearTimeout(tHold.current);
      if (tFade.current) clearTimeout(tFade.current);
    };
  }, [imgs, next, holdMs, fadeMs]);

  if (imgs.length === 0) return null;

  if (imgs.length === 1) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgs[0]}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
          onLoad={() => markLoaded(imgs[0])}
          onError={() => markLoaded(imgs[0])}
        />
      </div>
    );
  }

  const curSrc = imgs[cur];
  const nextSrc = imgs[next];

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* текущий слой */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`cur-${curSrc}`}
        src={curSrc}
        alt=""
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity"
        style={{
          opacity: phase === "fading" ? 0 : 1,
          transitionDuration: `${fadeMs}ms`,
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
        onLoad={() => markLoaded(curSrc)}
        onError={() => markLoaded(curSrc)}
      />

      {/* следующий слой — заранее смонтирован с opacity:0 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`next-${nextSrc}`}
        src={nextSrc}
        alt=""
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity"
        style={{
          opacity: phase === "fading" ? 1 : 0,
          transitionDuration: `${fadeMs}ms`,
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
        onLoad={() => markLoaded(nextSrc)}
        onError={() => markLoaded(nextSrc)}
      />

      {/* буллеты */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {imgs.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === cur ? "w-6 bg-white/90" : "w-2 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}