import type { Utm } from "./utm-types";

export function getUtm(): Utm {
  if (typeof document === "undefined") return {};
  try {
    const m = document.cookie.match(/(?:^|;\s*)utm=([^;]+)/);
    if (!m) return {};
    const raw = decodeURIComponent(m[1]);
    return raw ? (JSON.parse(raw) as Utm) : {};
  } catch {
    return {};
  }
}

function setUtmCookie(v: Utm, maxAgeDays = 90) {
  try {
    const payload = encodeURIComponent(JSON.stringify(v));
    const maxAge = maxAgeDays * 24 * 60 * 60;
    document.cookie = `utm=${payload}; path=/; max-age=${maxAge}`;
  } catch {}
}

function sameOriginReferrer(): boolean {
  try {
    const ref = document.referrer;
    if (!ref) return false;
    const rh = new URL(ref).host;
    return rh === location.host;
  } catch {
    return false;
  }
}

export function captureUtmOnce() {
  if (typeof window === "undefined") return;
  try {
    const sp = new URLSearchParams(window.location.search);

    const next: Utm = {};
    const src = sp.get("utm_source") ?? undefined;
    const med = sp.get("utm_medium") ?? undefined;
    const cmp = sp.get("utm_campaign") ?? undefined;
    const cnt = sp.get("utm_content") ?? undefined;
    const trm = sp.get("utm_term") ?? undefined;

    if (src) next.source = src;
    if (med) next.medium = med;
    if (cmp) next.campaign = cmp;
    if (cnt) next.content = cnt;
    if (trm) next.term = trm;

    if (Object.keys(next).length > 0) {
      setUtmCookie(next);
      return;
    }

    const existing = getUtm();
    if (Object.keys(existing).length > 0) return;

    if (!sameOriginReferrer() && document.referrer) {
      try {
        const host = new URL(document.referrer).host;
        if (host) setUtmCookie({ source: `ref:${host}` });
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}