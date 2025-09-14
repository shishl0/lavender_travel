"use client";

function detectDevice() {
  try {
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return "mobile";
    return (window.innerWidth || 0) < 768 ? "mobile" : "desktop";
  } catch {
    return "desktop";
  }
}

export function track(
  type: string,
  meta?: Record<string, unknown>
) {
  try {
    const payload = {
      type,
      path: location.pathname + (location.hash || ""),
      locale: document.documentElement.lang || "ru",
      referrer: document.referrer || null,
      device: detectDevice(),
      meta: meta ?? {},
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });

    if ("sendBeacon" in navigator) {
      navigator.sendBeacon("/api/analytics/track", blob);
    } else {
      fetch("/api/analytics/track", { method: "POST", body: blob, keepalive: true });
    }
  } catch {
    // молча
  }
}