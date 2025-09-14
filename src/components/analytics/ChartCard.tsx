"use client";

import { useEffect, useMemo, useRef, useState, useId } from "react";

type Point = { x: string; y: number };

export default function ChartCard({
  data,
  height = 140,
  padding = { top: 12, right: 28, bottom: 28, left: 36 },
  yTicks = 3,
}: {
  data: Point[];
  height?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  yTicks?: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [svgW, setSvgW] = useState<number>(600);
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 600;
      setSvgW(Math.max(100, Math.round(w)));
    });
    ro.observe(el);
    setSvgW(Math.max(100, Math.round(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);

  const plot = useMemo(() => {
    return {
      x0: padding.left,
      y0: padding.top,
      w: Math.max(10, svgW - padding.left - padding.right),
      h: Math.max(10, height - padding.top - padding.bottom),
    };
  }, [svgW, height, padding.left, padding.right, padding.top, padding.bottom]);

  const maxY = useMemo(() => Math.max(1, ...data.map((d) => d.y)), [data]);
  const stepX = useMemo(
    () => (data.length > 1 ? plot.w / (data.length - 1) : plot.w),
    [data.length, plot.w]
  );

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = plot.x0 + i * stepX;
      const y = plot.y0 + plot.h * (1 - d.y / maxY);
      return { x, y };
    });
  }, [data, stepX, plot.x0, plot.y0, plot.h, maxY]);

  const path = useMemo(() => {
    if (!points.length) return "";
    return points.map((p, i) => (i ? `L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`)).join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (!points.length) return "";
    const baseY = padding.top + plot.h;
    const first = points[0];
    const last = points[points.length - 1];
    return [
      `M ${first.x} ${baseY}`,
      `L ${first.x} ${first.y}`,
      ...points.slice(1).map((p) => `L ${p.x} ${p.y}`),
      `L ${last.x} ${baseY}`,
      "Z",
    ].join(" ");
  }, [points, padding.top, plot.h]);

  // чтобы не было вертикального «прыжка» из-за появления строки сверху
  const infoBar = (
    <div className="flex items-center justify-between text-xs text-gray-600 mb-1" style={{ minHeight: 18 }}>
      {hover != null ? (
        <>
          <span>{data[hover].x}</span>
          <span className="font-medium text-gray-900">{data[hover].y}</span>
        </>
      ) : (
        <>
          <span />
          <span />
        </>
      )}
    </div>
  );

  const onMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    const el = svgRef.current;
    if (!el || data.length === 0) return;
    const box = el.getBoundingClientRect();

    const pxLeft = padding.left;
    const pxRight = padding.right;
    const usable = Math.max(1, box.width - pxLeft - pxRight);
    const rel = (e.clientX - box.left - pxLeft) / usable;
    const i = Math.round(rel * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, i));
    setHover(clamped);
  };

  const onLeave = () => setHover(null);

  const yTickValues = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= yTicks; i++) arr.push(Math.round((maxY * i) / yTicks));
    return arr;
  }, [maxY, yTicks]);

  const active = hover != null ? points[hover] : null;

  return (
    <div className="mt-2">
      {infoBar}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${height}`}
        className="w-full block select-none"
        role="img"
        aria-label="Chart"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <defs>
          <linearGradient id={`chartGradient-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Y grid + labels */}
        {yTickValues.map((v, idx) => {
          const y = padding.top + plot.h * (1 - v / maxY);
          return (
            <g key={idx}>
              <line x1={padding.left} x2={padding.left + plot.w} y1={y} y2={y} stroke="currentColor" opacity="0.08" />
              <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.6">
                {v}
              </text>
            </g>
          );
        })}

        {/* X labels (редко, чтобы не мусорить) */}
        {data.map((d, i) => {
          const every = Math.max(1, Math.ceil(data.length / 8));
          if (i % every !== 0 && i !== data.length - 1) return null;
          const x = padding.left + i * stepX;
          return (
            <text key={i} x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
              {d.x}
            </text>
          );
        })}

        {/* заливка */}
        {areaPath && (
          <path d={areaPath} fill={`url(#chartGradient-${gradId})`} />
        )}

        {/* линия */}
        <path d={path} fill="none" stroke="currentColor" opacity="0.35" strokeWidth={2} />

        {/* точки */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill="currentColor" opacity="0.35" />
        ))}

        {/* курсор */}
        {active && (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1={padding.top}
              y2={padding.top + plot.h}
              stroke="currentColor"
              opacity="0.35"
            />
            <circle cx={active.x} cy={active.y} r={3.5} fill="currentColor" />
          </>
        )}

        {/* интерактивная зона */}
        <rect
          x={padding.left}
          y={padding.top}
          width={plot.w}
          height={plot.h}
          fill="transparent"
          style={{ cursor: "crosshair" }}
        />
      </svg>
    </div>
  );
}
