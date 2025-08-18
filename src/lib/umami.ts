declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, any>) => void;
      // у cloud ещё есть umami.trackView, но track(name) достаточно
    };
  }
}

export function track(name: string, data?: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track?.(name, data);
  } catch {}
}