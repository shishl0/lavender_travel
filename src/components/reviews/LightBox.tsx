"use client";
import { useEffect, useRef, useState } from "react";

export default function Lightbox({
  images,
  startIndex = 0,
  onClose,
}: { images: string[]; startIndex?: number; onClose: () => void }) {
  const [i, setI] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pinch = useRef<number | null>(null);

  const clampScale = (s: number) => Math.min(4, Math.max(1, s));
  const resetPan = () => { setDx(0); setDy(0); };
  const resetZoom = () => { setScale(1); resetPan(); };

  const prev = () => { setI(p => (p - 1 + images.length) % images.length); resetZoom(); };
  const next = () => { setI(p => (p + 1) % images.length); resetZoom(); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "+" || e.key === "=") setScale(s => clampScale(s * 1.15));
      else if (e.key === "-") setScale(s => clampScale(s / 1.15));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    // масштабируем при pinch-to-zoom (ctrlKey) или явной прокрутке
    if (!e.ctrlKey && Math.abs(e.deltaY) < 28) return;
    e.preventDefault();
    setScale(s => clampScale(s * (e.deltaY < 0 ? 1.12 : 0.9)));
  };

  const onPointerDown: React.PointerEventHandler<HTMLImageElement> = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove: React.PointerEventHandler<HTMLImageElement> = (e) => {
    if (!dragging.current || scale === 1) return;
    const mx = e.clientX - last.current.x;
    const my = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setDx(x => x + mx);
    setDy(y => y + my);
  };
  const onPointerUp = () => { dragging.current = false; };
  const onDouble = () => setScale(s => (s > 1 ? 1 : 2));

  // === Touch (pinch) без деструктуризации TouchList ===
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length >= 2) {
      const a = e.touches.item(0)!;
      const b = e.touches.item(1)!;
      pinch.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }
  };
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length >= 2 && pinch.current) {
      e.preventDefault();
      const a = e.touches.item(0)!;
      const b = e.touches.item(1)!;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const k = d / pinch.current;
      setScale(s => clampScale(s * k));
      pinch.current = d;
    }
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    pinch.current = null;
  };

  return (
    <div
      className="lb"
      onClick={onClose}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="lb-top" onClick={(e) => e.stopPropagation()}>
        <div className="lb-title">{i + 1} / {images.length}</div>
        <div className="lb-actions">
          <button className="lb-btn" onClick={() => setScale(s => clampScale(s / 1.15))} aria-label="Уменьшить">−</button>
          <button className="lb-btn" onClick={() => setScale(s => clampScale(s * 1.15))} aria-label="Увеличить">+</button>
          <button className="lb-btn" onClick={resetZoom} aria-label="Сбросить зум">1×</button>
          <button className="lb-btn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[i]}
        alt=""
        className="lb-img"
        style={{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={onDouble}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      <button className="lb-nav lb-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Назад">‹</button>
      <button className="lb-nav lb-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Вперёд">›</button>
    </div>
  );
}