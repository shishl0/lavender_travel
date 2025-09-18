"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

type Author = "user" | "agent";

type ConversationState = {
  destination?: string;
  when?: string;
  duration?: string;
  budget?: string;
  travelers?: string;
  accommodation?: string;
  extras?: string;
  departureCity?: string;
  mealPlan?: string;
};

type ReplyOption = {
  label: string;
  value?: string;
  next?: string;
  action?: "summary" | "faq" | "whatsapp" | "restart";
  storeKey?: keyof ConversationState;
  variant?: "whatsapp";
};

type ReplyOptionTemplate = {
  labelKey: string;
  valueKey?: string;
  value?: string;
  next?: string;
  action?: "summary" | "faq" | "whatsapp" | "restart";
  storeKey?: keyof ConversationState;
  variant?: "whatsapp";
};

type Message = {
  id: number;
  author: Author;
  text: string;
  at: number;
  options?: ReplyOption[];
  source?: "input" | "option";
};

type DestinationItem = {
  id: string;
  key: string;
  title?: { ru?: string | null; kk?: string | null; en?: string | null } | null;
  isActive: boolean;
};

type ChatStep = {
  message: string;
  options: ReplyOption[] | ((state: ConversationState, ctx: { destinations: DestinationItem[] }) => ReplyOption[]);
};

const DEFAULT_WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/77080086191";
const CLOSE_DELAY_MS = 220;
const RESET_DURATION_MS = 320;

type ChatMiniProps = {
  waNumber: string | null;
};

const INITIAL_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.options.initial.pickTour", next: "destination" },
  { labelKey: "chatMini.options.initial.faq", next: "faqMenu" },
  { labelKey: "chatMini.options.initial.deals", value: "deals", action: "faq" },
  { labelKey: "chatMini.actions.openWhatsapp", action: "whatsapp", variant: "whatsapp" },
];

const FAQ_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.options.faq.documents", value: "documents", action: "faq" },
  { labelKey: "chatMini.options.faq.payment", value: "payment", action: "faq" },
  { labelKey: "chatMini.options.faq.kids", value: "kids", action: "faq" },
  { labelKey: "chatMini.options.faq.refund", value: "refund", action: "faq" },
  { labelKey: "chatMini.options.faq.insurance", value: "insurance", action: "faq" },
  { labelKey: "chatMini.options.faq.luggage", value: "luggage", action: "faq" },
  { labelKey: "chatMini.options.faq.transfers", value: "transfers", action: "faq" },
  { labelKey: "chatMini.options.faq.weather", value: "weather", action: "faq" },
  { labelKey: "chatMini.options.faq.pickTour", next: "destination" },
  { labelKey: "chatMini.actions.openWhatsapp", action: "whatsapp", variant: "whatsapp" },
  { labelKey: "chatMini.actions.restart", action: "restart" },
];

const FAQ_FOLLOWUP_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.options.faqFollowup.more", next: "faqMenu" },
  { labelKey: "chatMini.options.faqFollowup.pickTour", next: "destination" },
  { labelKey: "chatMini.actions.openWhatsapp", action: "whatsapp", variant: "whatsapp" },
  { labelKey: "chatMini.actions.restart", action: "restart" },
];

const DEPARTURE_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.steps.departure.options.almaty", storeKey: "departureCity", next: "dates" },
  { labelKey: "chatMini.steps.departure.options.astana", storeKey: "departureCity", next: "dates" },
  { labelKey: "chatMini.steps.departure.options.shymkent", storeKey: "departureCity", next: "dates" },
  { labelKey: "chatMini.steps.departure.options.other", action: "whatsapp" },
];

const DURATION_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.steps.duration.options.fiveSeven", storeKey: "duration", next: "budget" },
  { labelKey: "chatMini.steps.duration.options.eightTen", storeKey: "duration", next: "budget" },
  { labelKey: "chatMini.steps.duration.options.moreTen", storeKey: "duration", next: "budget" },
  { labelKey: "chatMini.steps.duration.options.needHelp", storeKey: "duration", next: "budget" },
];

const BUDGET_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.steps.budget.options.low", storeKey: "budget", next: "travelers" },
  { labelKey: "chatMini.steps.budget.options.medium", storeKey: "budget", next: "travelers" },
  { labelKey: "chatMini.steps.budget.options.high", storeKey: "budget", next: "travelers" },
  { labelKey: "chatMini.steps.budget.options.premium", storeKey: "budget", next: "travelers" },
  { labelKey: "chatMini.steps.budget.options.consult", storeKey: "budget", action: "summary" },
];

const TRAVELERS_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.steps.travelers.options.couple", storeKey: "travelers", next: "accommodation" },
  { labelKey: "chatMini.steps.travelers.options.family", storeKey: "travelers", next: "accommodation" },
  { labelKey: "chatMini.steps.travelers.options.friends", storeKey: "travelers", next: "accommodation" },
  { labelKey: "chatMini.steps.travelers.options.solo", storeKey: "travelers", next: "accommodation" },
];

const ACCOMMODATION_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.steps.accommodation.options.fiveStar", storeKey: "accommodation", next: "mealPlan" },
  { labelKey: "chatMini.steps.accommodation.options.fourStar", storeKey: "accommodation", next: "mealPlan" },
  { labelKey: "chatMini.steps.accommodation.options.boutique", storeKey: "accommodation", next: "mealPlan" },
  { labelKey: "chatMini.steps.accommodation.options.villa", storeKey: "accommodation", next: "mealPlan" },
  { labelKey: "chatMini.steps.accommodation.options.advice", storeKey: "accommodation", next: "mealPlan" },
];

const MEAL_PLAN_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.steps.mealPlan.options.allInclusive", storeKey: "mealPlan", next: "extras" },
  { labelKey: "chatMini.steps.mealPlan.options.halfBoard", storeKey: "mealPlan", next: "extras" },
  { labelKey: "chatMini.steps.mealPlan.options.breakfast", storeKey: "mealPlan", next: "extras" },
  { labelKey: "chatMini.steps.mealPlan.options.roomOnly", storeKey: "mealPlan", next: "extras" },
  { labelKey: "chatMini.steps.mealPlan.options.flexible", storeKey: "mealPlan", next: "extras" },
];

const EXTRAS_OPTION_TEMPLATES: ReplyOptionTemplate[] = [
  { labelKey: "chatMini.steps.extras.options.sea", storeKey: "extras", action: "summary" },
  { labelKey: "chatMini.steps.extras.options.spa", storeKey: "extras", action: "summary" },
  { labelKey: "chatMini.steps.extras.options.active", storeKey: "extras", action: "summary" },
  { labelKey: "chatMini.steps.extras.options.manager", storeKey: "extras", action: "summary" },
];

const SUMMARY_ORDER: (keyof ConversationState)[] = [
  "destination",
  "departureCity",
  "when",
  "duration",
  "budget",
  "travelers",
  "accommodation",
  "mealPlan",
  "extras",
];

const SUMMARY_LABEL_KEYS: Record<keyof ConversationState, string> = {
  destination: "chatMini.summary.labels.destination",
  departureCity: "chatMini.summary.labels.departureCity",
  when: "chatMini.summary.labels.when",
  duration: "chatMini.summary.labels.duration",
  budget: "chatMini.summary.labels.budget",
  travelers: "chatMini.summary.labels.travelers",
  accommodation: "chatMini.summary.labels.accommodation",
  mealPlan: "chatMini.summary.labels.mealPlan",
  extras: "chatMini.summary.labels.extras",
};

const FALLBACK_KEYWORDS = [
  "цена",
  "стоимость",
  "скидк",
  "акци",
  "промо",
  "телефон",
  "позвоните",
  "whatsapp",
  "ватсап",
  "вотсап",
  "price",
  "cost",
  "discount",
  "promo",
  "deal",
  "phone",
  "call",
  "hot",
  "баға",
  "құны",
  "жеңілдік",
  "акция",
  "байланыс",
  "хабарласыңыз",
  "уатсап"
];

function titleForDestination(item: DestinationItem): string {
  const title = item.title;
  return (
    title?.ru?.trim() ||
    title?.kk?.trim() ||
    title?.en?.trim() ||
    item.key.replace(/[-_]/g, " ")
  );
}

function searchDestinationsByQuery(query: string, items: DestinationItem[]): ReplyOption[] {
  const cleaned = query
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s]/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 3) return [];

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const matches = items
    .filter((item) => {
      if (!item.isActive) return false;
      const name = titleForDestination(item).toLowerCase();
      return tokens.every((token) => name.includes(token));
    })
    .slice(0, 6);

  return matches.map((item) => {
    const label = titleForDestination(item);
    return {
      label,
      value: label,
      next: "departure",
      storeKey: "destination" as const,
    } satisfies ReplyOption;
  });
}

function mergeOptions(...lists: (ReplyOption[] | undefined)[]): ReplyOption[] {
  const seen = new Set<string>();
  const merged: ReplyOption[] = [];
  lists.forEach((list) => {
    list?.forEach((opt) => {
      const key = `${opt.label}__${opt.action ?? ""}__${opt.next ?? ""}__${opt.storeKey ?? ""}__${opt.variant ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(opt);
      }
    });
  });
  return merged;
}

export default function ChatMini({ waNumber }: ChatMiniProps) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const { t, i18n } = useTranslation();
  const locale = useMemo(() => {
    const lang = (i18n.language || "ru").toLowerCase();
    if (lang.startsWith("kk")) return "kk-KZ";
    if (lang.startsWith("en")) return "en-US";
    return "ru-RU";
  }, [i18n.language]);
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale]
  );

  const resolveText = useCallback(
    (key: string) => {
      const value = t(key);
      return value === key ? "" : value;
    },
    [t]
  );

  const whatsappDefaultMessage = useMemo(() => {
    const fallback = "Hi! We'd love to plan a trip with Lavender Travel.";
    const resolved = resolveText("chatMini.whatsappMessage.default");
    return resolved || fallback;
  }, [resolveText]);

  const whatsappDirectMessage = useMemo(() => {
    const fallback = "Hello! I’m reaching out from the Lavender chat assistant on your website to arrange a trip.";
    const resolved = resolveText("chatMini.whatsappMessage.direct");
    return resolved || fallback;
  }, [resolveText]);

  const whatsappBaseUrl = useMemo(() => {
    if (!waNumber) return DEFAULT_WHATSAPP_URL;
    const trimmed = waNumber.trim();
    if (!trimmed) return DEFAULT_WHATSAPP_URL;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    const digits = trimmed.replace(/\D+/g, "");
    if (digits.length) {
      return `https://wa.me/${digits}`;
    }
    return DEFAULT_WHATSAPP_URL;
  }, [waNumber]);

  const buildWhatsappUrl = useCallback(
    (text?: string) => {
      const base = whatsappBaseUrl || DEFAULT_WHATSAPP_URL;
      const payload = text?.trim();
      if (!payload) return base;
      const encoded = encodeURIComponent(payload);
      const separator = base.includes("?") ? "&" : "?";
      return `${base}${separator}text=${encoded}`;
    },
    [whatsappBaseUrl]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(true);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<ConversationState>({});
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [resetting, setResetting] = useState(false);
  const [whatsappContext, setWhatsappContext] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const buildOptions = useCallback(
    (templates: ReplyOptionTemplate[]): ReplyOption[] =>
      templates.map((tpl) => {
        const label = t(tpl.labelKey);
        const value =
          tpl.value !== undefined
            ? tpl.value
            : tpl.valueKey
              ? t(tpl.valueKey)
              : label;
        return {
          label,
          value,
          next: tpl.next,
          action: tpl.action,
          storeKey: tpl.storeKey,
          variant: tpl.variant,
        };
      }),
    [t]
  );

  const initialOptions = useMemo(() => buildOptions(INITIAL_OPTION_TEMPLATES), [buildOptions]);
  const faqOptions = useMemo(() => buildOptions(FAQ_OPTION_TEMPLATES), [buildOptions]);
  const faqFollowupOptions = useMemo(() => buildOptions(FAQ_FOLLOWUP_TEMPLATES), [buildOptions]);
  const departureOptions = useMemo(() => buildOptions(DEPARTURE_OPTION_TEMPLATES), [buildOptions]);
  const durationOptions = useMemo(() => buildOptions(DURATION_OPTION_TEMPLATES), [buildOptions]);
  const budgetOptions = useMemo(() => buildOptions(BUDGET_OPTION_TEMPLATES), [buildOptions]);
  const travelerOptions = useMemo(() => buildOptions(TRAVELERS_OPTION_TEMPLATES), [buildOptions]);
  const accommodationOptions = useMemo(() => buildOptions(ACCOMMODATION_OPTION_TEMPLATES), [buildOptions]);
  const mealPlanOptions = useMemo(() => buildOptions(MEAL_PLAN_OPTION_TEMPLATES), [buildOptions]);
  const extrasOptions = useMemo(() => buildOptions(EXTRAS_OPTION_TEMPLATES), [buildOptions]);
  const restartSoloOption = useMemo(
    () => buildOptions([{ labelKey: "chatMini.actions.restart", action: "restart" }])[0],
    [buildOptions]
  );

  const seasonalDateOptions = useCallback((): ReplyOption[] => {
    const month = new Date().getMonth();
    let seasonalKey = "chatMini.options.when.seasonSummer";
    if (month >= 5 && month <= 7) seasonalKey = "chatMini.options.when.seasonAutumn";
    else if (month >= 8 && month <= 10) seasonalKey = "chatMini.options.when.seasonWinter";

    return [
      { label: t("chatMini.options.when.soon"), value: t("chatMini.options.when.soon"), storeKey: "when", next: "duration" },
      { label: t("chatMini.options.when.twoThree"), value: t("chatMini.options.when.twoThree"), storeKey: "when", next: "duration" },
      { label: t(seasonalKey), value: t(seasonalKey), storeKey: "when", next: "duration" },
      { label: t("chatMini.options.when.exact"), value: t("chatMini.options.when.exact"), storeKey: "when", next: "duration" },
    ];
  }, [t]);

  const buildDestinationOptions = useCallback(
    (items: DestinationItem[]): ReplyOption[] => {
      if (!items.length) {
        return buildOptions([
          { labelKey: "chatMini.options.destinationsViewAll", action: "whatsapp" },
          { labelKey: "chatMini.actions.restart", action: "restart" },
        ]);
      }
      const active = items.filter((it) => it.isActive);
      // Show the last 5 active destinations preserving DTO order
      const shortlist = active.slice(-5);

      const base = shortlist.map((item) => {
        const label = titleForDestination(item);
        return {
          label,
          value: label,
          storeKey: "destination" as const,
          next: "departure",
        } satisfies ReplyOption;
      });

      return [
        ...base,
        ...buildOptions([
          { labelKey: "chatMini.options.destinationOther", action: "whatsapp" },
          { labelKey: "chatMini.actions.restart", action: "restart" },
        ]),
      ];
    },
    [buildOptions]
  );

  const chatFlow: Record<string, ChatStep> = useMemo(() => ({
    destination: {
      message: t("chatMini.steps.destination.message"),
      options: (_state, ctx) => buildDestinationOptions(ctx.destinations),
    },
    departure: {
      message: t("chatMini.steps.departure.message"),
      options: departureOptions,
    },
    dates: {
      message: t("chatMini.steps.dates.message"),
      options: seasonalDateOptions(),
    },
    duration: {
      message: t("chatMini.steps.duration.message"),
      options: durationOptions,
    },
    budget: {
      message: t("chatMini.steps.budget.message"),
      options: budgetOptions,
    },
    travelers: {
      message: t("chatMini.steps.travelers.message"),
      options: travelerOptions,
    },
    accommodation: {
      message: t("chatMini.steps.accommodation.message"),
      options: accommodationOptions,
    },
    mealPlan: {
      message: t("chatMini.steps.mealPlan.message"),
      options: mealPlanOptions,
    },
    extras: {
      message: t("chatMini.steps.extras.message"),
      options: extrasOptions,
    },
    faqMenu: {
      message: t("chatMini.steps.faqMenu.message"),
      options: () => faqOptions,
    },
  }), [
    t,
    buildDestinationOptions,
    departureOptions,
    seasonalDateOptions,
    durationOptions,
    budgetOptions,
    travelerOptions,
    accommodationOptions,
    mealPlanOptions,
    extrasOptions,
    faqOptions,
  ]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/destinations/public/list")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json || cancelled) return;
        const items = Array.isArray(json?.items) ? (json.items as DestinationItem[]) : [];
        setDestinations(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const buildSummaryLines = useCallback(
    (current: ConversationState) => {
      const label = (key: keyof ConversationState) => t(SUMMARY_LABEL_KEYS[key]);
      const lines: string[] = [];
      SUMMARY_ORDER.forEach((key) => {
        const value = current[key];
        if (value) lines.push(`• ${label(key)}: ${value}`);
      });
      return lines;
    },
    [t]
  );

  const buildWhatsappSummary = useCallback(
    (current: ConversationState) => {
      const lines = buildSummaryLines(current);
      if (!lines.length) {
        return whatsappDefaultMessage;
      }

      const intro = resolveText("chatMini.whatsappMessage.intro");
      const preface = resolveText("chatMini.whatsappMessage.preface");
      const outro = resolveText("chatMini.whatsappMessage.outro");

      const segments: string[] = [];
      if (intro) segments.push(intro);
      if (preface && lines.length) segments.push(preface);
      segments.push(lines.join("\n"));
      if (outro) segments.push(outro);

      return segments.join("\n\n").trim();
    },
    [buildSummaryLines, resolveText, whatsappDefaultMessage]
  );

  const startConversation = useCallback(() => {
    setState({});
    setWhatsappContext(whatsappDefaultMessage);
    setMessages([
      {
        id: 1,
        author: "agent",
        text: t("chatMini.messages.welcome"),
        at: Date.now(),
        options: initialOptions,
      },
    ]);
  }, [initialOptions, t, whatsappDefaultMessage]);

  useEffect(() => {
    startConversation();
  }, [startConversation]);

  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) {
      setDraft("");
      return;
    }
    const focusId = window.setTimeout(() => draftRef.current?.focus(), 120);
    return () => window.clearTimeout(focusId);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const buildOptionsList = useCallback(
    (templates: ReplyOptionTemplate[]) => buildOptions(templates),
    [buildOptions]
  );

  const openChatWindow = useCallback(() => {
    setResetting(false);
    setButtonVisible(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setChatMounted(true);
    if (!isOpen) {
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => setIsOpen(true));
      } else {
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  }, [isOpen]);

  const closeChatWindow = useCallback(() => {
    setIsOpen(false);
    setResetting(false);
    setButtonVisible(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    closeTimerRef.current = window.setTimeout(() => {
      setChatMounted(false);
      setButtonVisible(true);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeChatWindow();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeChatWindow]);

  const pushAgentMessage = useCallback((text: string, options?: ReplyOption[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        author: "agent",
        text,
        at: Date.now(),
        options,
      },
    ]);
  }, []);

  const openWhatsapp = useCallback(() => {
    const userMessages = messages
      .filter((msg) => msg.author === "user" && msg.source === "input")
      .map((msg) => msg.text.trim())
      .filter(Boolean);
    const hasTypedMessages = userMessages.length > 0;
    const textToSend = (hasTypedMessages ? whatsappDirectMessage : whatsappContext?.trim() || whatsappDefaultMessage).trim();
    const targetUrl = buildWhatsappUrl(textToSend);
    try {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch {
      /* noop */
    }
    pushAgentMessage(t("chatMini.messages.openWhatsapp"), [restartSoloOption]);
  }, [buildWhatsappUrl, messages, pushAgentMessage, restartSoloOption, t, whatsappContext, whatsappDefaultMessage, whatsappDirectMessage]);

  const serveStep = useCallback(
    (stepId: string, current: ConversationState = state) => {
      const step = chatFlow[stepId];
      if (!step) return;
      const options =
        typeof step.options === "function"
          ? step.options(current, { destinations })
          : step.options;
      pushAgentMessage(step.message, options);
    },
    [chatFlow, destinations, pushAgentMessage, state]
  );

  const showSummary = useCallback(
    (current: ConversationState = state) => {
      const summaryLines = buildSummaryLines(current);
      const summary = summaryLines.length
        ? `${t("chatMini.summary.intro")}\n${summaryLines.join("\n")}`
        : t("chatMini.summary.empty");
      const whatsappMessage = buildWhatsappSummary(current);
      setWhatsappContext(whatsappMessage);
      pushAgentMessage(summary, buildOptionsList([
        { labelKey: "chatMini.actions.openWhatsapp", action: "whatsapp", variant: "whatsapp" },
        { labelKey: "chatMini.actions.restart", action: "restart" },
      ]));
    },
    [buildSummaryLines, buildOptionsList, buildWhatsappSummary, pushAgentMessage, state, t]
  );

  const pushFallback = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      if (FALLBACK_KEYWORDS.some((k) => lower.includes(k))) {
        pushAgentMessage(
          t("chatMini.messages.fallbackWhatsapp"),
          buildOptionsList([
            { labelKey: "chatMini.actions.openWhatsapp", action: "whatsapp", variant: "whatsapp" },
            { labelKey: "chatMini.actions.restart", action: "restart" },
          ])
        );
        return;
      }

      const suggestions = searchDestinationsByQuery(text, destinations);
      if (suggestions.length) {
        pushAgentMessage(
          t("chatMini.messages.searchResults"),
          mergeOptions(
            suggestions.slice(0, 5),
            buildOptionsList([
              { labelKey: "chatMini.actions.openWhatsapp", action: "whatsapp", variant: "whatsapp" },
              { labelKey: "chatMini.actions.restart", action: "restart" },
            ])
          )
        );
        return;
      }

      const fallbackOptions = messages[messages.length - 1]?.options || initialOptions;
      pushAgentMessage(
        t("chatMini.messages.fallbackStandard"),
        mergeOptions(
          fallbackOptions,
          buildOptionsList([
            { labelKey: "chatMini.actions.openWhatsapp", action: "whatsapp", variant: "whatsapp" },
            { labelKey: "chatMini.actions.restart", action: "restart" },
          ])
        )
      );
    },
    [buildOptionsList, destinations, initialOptions, messages, pushAgentMessage, t]
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, author: "user", text, at: Date.now(), source: "input" },
    ]);
    setDraft("");
    setTimeout(() => pushFallback(text), 160);
  }, [draft, pushFallback]);

  const handleOptionSelect = useCallback(
    (option: ReplyOption) => {
      const label = option.label;
      let updatedState = state;

      if (option.storeKey) {
        updatedState = { ...state, [option.storeKey]: option.value || label };
        setState(updatedState);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          author: "user",
          text: label,
          at: Date.now(),
          source: "option",
        },
      ]);

      const { action, next } = option;

      if (action === "restart") {
        if (resetTimerRef.current) {
          window.clearTimeout(resetTimerRef.current);
        }
        setResetting(true);
        resetTimerRef.current = window.setTimeout(() => {
          setResetting(false);
          startConversation();
          resetTimerRef.current = null;
        }, RESET_DURATION_MS);
        return;
      }

      if (action === "whatsapp") {
        setTimeout(() => openWhatsapp(), 160);
        return;
      }

      if (action === "faq") {
        const key = option.value || "";
        const response = t(`chatMini.faq.responses.${key}`);
        setTimeout(() => {
          if (response && response !== `chatMini.faq.responses.${key}`) {
            pushAgentMessage(response, faqFollowupOptions);
          } else {
            pushAgentMessage(t("chatMini.messages.unknownFaq"), buildOptionsList([
              { labelKey: "chatMini.actions.openWhatsapp", action: "whatsapp", variant: "whatsapp" },
              { labelKey: "chatMini.actions.restart", action: "restart" },
            ]));
          }
        }, 160);
        return;
      }

      if (action === "summary") {
        setTimeout(() => showSummary(updatedState), 160);
        return;
      }

      if (next) {
        setTimeout(() => serveStep(next, updatedState), 160);
        return;
      }
    },
    [state, t, buildOptionsList, faqFollowupOptions, openWhatsapp, pushAgentMessage, serveStep, showSummary, startConversation]
  );

  const buttonAria = t("chatMini.aria.open");
  const closeAria = t("chatMini.aria.close");

  return (
    <>
      <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex flex-col items-end gap-3">
        {chatMounted && (
          <div
            className={`pointer-events-auto flex w-[360px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-slate-950/95 via-slate-900/92 to-slate-900/88 text-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.9)] backdrop-blur chat-container ${
              isOpen ? "chat-container--open" : "chat-container--closing"
            }`}
            role="dialog"
            aria-label={buttonAria}
          >
            <header className="chat-header flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
              <span className="chat-header__title">{t("chatMini.button.title")}</span>
              <button
                type="button"
                onClick={closeChatWindow}
                aria-label={closeAria}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-[18px] leading-none text-white/80 transition duration-150 ease-out hover:bg-white/18"
              >
                ×
              </button>
            </header>

            <div
              ref={listRef}
              className={`chat-scroll flex max-h-[360px] flex-col gap-3 overflow-y-auto px-5 pb-4 pt-3 ${
                resetting ? "chat-scroll--resetting" : ""
              }`}
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.author === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`chat-bubble max-w-[80%] rounded-2xl border px-4 py-2 text-[15px] leading-5 transition-colors duration-200 ${
                      msg.author === "user"
                        ? "border-violet-400/40 bg-gradient-to-br from-violet-500/95 to-fuchsia-500/90 text-white shadow-[0_12px_28px_rgba(124,58,237,0.35)]"
                        : "border-white/10 bg-white/8 text-slate-100"
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div className="mt-1 text-right text-[11px] uppercase tracking-[0.18em] text-white/55">
                      {timeFormatter.format(msg.at)}
                    </div>
                    {msg.options?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.options.map((item, idx) => (
                          <button
                            key={`${msg.id}-${idx}-${item.label}`}
                            type="button"
                            onClick={() => handleOptionSelect(item)}
                            className={`rounded-full border px-3 py-1 text-[13px] font-medium transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 ${
                              item.variant === "whatsapp"
                                ? "border-[#25D366] bg-[#0B3D2A] text-[#25D366] shadow-[0_12px_28px_rgba(11,61,42,0.38)] hover:bg-[#0D4A30] hover:border-[#1EBE5B] focus-visible:ring-[#25D366]/60"
                                : "border-white/15 bg-white/12 text-white/90 hover:border-white/35 hover:bg-white/20 focus-visible:ring-violet-300/60"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <form
              className="border-t border-white/12 bg-slate-900/65 px-5 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <label className="flex items-end gap-3">
                <span className="sr-only">{t("chatMini.form.messageLabel")}</span>
                <textarea
                  ref={draftRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={1}
                  placeholder={t("chatMini.form.messagePlaceholder")}
                  className="min-h-[44px] flex-1 resize-none rounded-2xl border border-white/14 bg-white/8 px-3 py-2 text-[15px] text-white shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300/70"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  type="submit"
                  className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/35 transition-transform duration-[180ms] ease-out hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/80 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!draft.trim()}
                  aria-label={t("chatMini.actions.send")}
                >
                  ➤
                </button>
              </label>
            </form>
          </div>
        )}

        <button
          type="button"
          onClick={openChatWindow}
          className={`chat-launch relative inline-flex items-center gap-4 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400 px-6 py-3 text-left text-white shadow-[0_26px_48px_-24px_rgba(76,29,149,0.32)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/60 ${
            buttonVisible ? "chat-launch--visible" : "chat-launch--hidden"
          }`}
          aria-label={buttonAria}
          aria-hidden={!buttonVisible}
          tabIndex={buttonVisible ? 0 : -1}
        >
          <span className="chat-launch__glow" aria-hidden />
          <span className="chat-launch__icon" aria-hidden>
            <svg viewBox="0 0 24 24" className="chat-launch__iconSvg" focusable="false" aria-hidden>
              <path d="M12 2.9c-5.5 0-9.8 3.42-9.8 7.45 0 2.52 1.65 4.76 4.18 6.13l-1.04 3.76a.74.74 0 00.95.93l4.05-1.4c.78.2 1.61.3 2.46.3 5.5 0 9.8-3.42 9.8-7.45C21.6 6.32 17.5 2.9 12 2.9Z" fill="url(#chatGradient)"/>
              <path d="M6.5 10.8h.01M12 10.8h.01M17.5 10.8h.01" stroke="rgba(15, 118, 110, 0.82)" strokeWidth="2.2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="chatGradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="45%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="chat-launch__text">
            <span className="chat-launch__title">{t("chatMini.button.title")}</span>
            <span className="chat-launch__subtitle">{t("chatMini.button.subtitle")}</span>
          </span>
        </button>
      </div>

      <style jsx>{`
        .chat-container {
          opacity: 0;
          transform: translateY(14px) scale(0.96);
          transition: opacity 0.18s ease-out, transform 0.18s ease-out;
        }
        .chat-container.chat-container--open {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .chat-container.chat-container--closing {
          opacity: 0;
          transform: translateY(14px) scale(0.96);
          pointer-events: none;
        }
        @keyframes chat-bubble-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .chat-bubble {
          animation: chat-bubble-in 0.18s ease-out;
        }
        .chat-header__title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.88);
        }
        .chat-launch {
          opacity: 0;
          transform: translateY(12px) scale(0.94);
          transition: opacity 0.22s ease-out, transform 0.22s ease-out, filter 0.22s ease-out;
          pointer-events: none;
        }
        .chat-launch--visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .chat-launch--hidden {
          opacity: 0;
          pointer-events: none;
        }
        .chat-launch--visible:hover {
          filter: brightness(1.06) saturate(1.05);
          transform: translateY(-1px) scale(1.01);
        }
        .chat-launch__icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.24));
          box-shadow:
            inset 0 1px 10px rgba(255,255,255,0.52),
            0 14px 32px rgba(129, 140, 248, 0.24);
        }
        .chat-launch__iconSvg {
          width: 38px;
          height: 38px;
          color: rgba(79, 70, 229, 0.9);
          filter: drop-shadow(0 5px 12px rgba(129, 140, 248, 0.34));
        }
        .chat-launch__text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .chat-launch__title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.015em;
          text-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
        }
        .chat-launch__subtitle {
          font-size: 12px;
          color: rgba(240, 249, 255, 0.85);
          margin-top: 2px;
          text-shadow: 0 2px 5px rgba(15, 23, 42, 0.22);
        }
        .chat-launch__glow {
          position: absolute;
          inset: -30% -80% auto -40%;
          height: 140%;
          width: 160%;
          background: linear-gradient(120deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 70%);
          transform: translateX(-120%);
          opacity: 0.2;
          transition: transform 0.55s ease, opacity 0.35s ease;
          pointer-events: none;
        }
        .chat-launch--visible:hover .chat-launch__glow {
          transform: translateX(90%);
          opacity: 0.65;
        }
        .chat-scroll--resetting {
          animation: chat-reset 0.32s ease forwards;
        }
        .chat-scroll--resetting .chat-bubble {
          animation: chat-bubble-out 0.32s ease forwards;
        }
        @keyframes chat-reset {
          to {
            opacity: 0;
            transform: scale(0.94) translateY(12px);
            filter: blur(6px);
          }
        }
        @keyframes chat-bubble-out {
          to {
            opacity: 0;
            transform: scale(0.96) translateY(12px);
            filter: blur(6px);
          }
        }
        .chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
        }
        .chat-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .chat-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.35);
          border-radius: 20px;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8));
          border-radius: 20px;
        }
        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(139, 92, 246, 1), rgba(236, 72, 153, 1));
        }
      `}</style>
    </>
  );
}
