export type Classified = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  channel: "paid" | "organic" | "social" | "referral" | "direct";
};

function host(href?: string | null): string | null {
  if (!href) return null;
  try { return new URL(href).hostname.toLowerCase(); } catch { return null; }
}

export function classifySource(opts: { utm?: any; referrer?: string | null }): Classified {
  const u = opts.utm || {};
  const src = (u.source ?? u.utm_source)?.toString().toLowerCase();
  const med = (u.medium ?? u.utm_medium)?.toString().toLowerCase();
  const cmp = (u.campaign ?? u.utm_campaign)?.toString();

  const refHost = host(opts.referrer);

  // helper: платный трафик по medium
  const isPaid = (m?: string | null) =>
    !!m && /(cpc|ppc|paid|ads|utm_paid|promoted)/i.test(m);

  // Если есть UTM — это главный сигнал
  let source = src || null;
  let medium = med || null;
  let campaign = cmp || null;

  // Если нет UTM — возьмём из referrer
  if (!source) {
    if (!refHost) source = "direct";
    else if (/google\./.test(refHost)) source = "google";
    else if (/bing\./.test(refHost)) source = "bing";
    else if (/yandex\./.test(refHost)) source = "yandex";
    else if (/instagram\.com/.test(refHost)) source = "instagram";
    else if (/facebook\.com|fb\.com|meta\.com/.test(refHost)) source = "facebook";
    else if (/tiktok\.com/.test(refHost)) source = "tiktok";
    else if (/youtube\.com|youtu\.be/.test(refHost)) source = "youtube";
    else source = refHost; // обычный реферал
  }

  // Канал
  let channel: Classified["channel"] = "referral";
  if (source === "direct") channel = "direct";
  else if (["google", "bing", "yandex"].includes(source)) {
    // платно/органика
    channel = isPaid(medium) ? "paid" : "organic";
  } else if (["instagram", "facebook", "tiktok", "youtube", "vk", "telegram"].includes(source)) {
    channel = isPaid(medium) ? "paid" : "social";
  } else {
    // прочие сайты
    channel = isPaid(medium) ? "paid" : "referral";
  }

  return { source, medium, campaign, channel };
}

// Человеческие названия каналов
export function humanChannel(k?: string | null): string {
  switch (k) {
    case "paid": return "Реклама";
    case "organic": return "Поисковая органика";
    case "social": return "Соцсети";
    case "referral": return "Переходы с сайтов";
    case "direct": return "Прямые заходы";
    default: return "Другое";
  }
}

// Красивые имена источников
export function humanSource(s?: string | null): string {
  if (!s || s === "direct") return "Прямой заход";
  const m: Record<string, string> = {
    google: "Google",
    yandex: "Яндекс",
    bing: "Bing",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  return m[s] || s;
}