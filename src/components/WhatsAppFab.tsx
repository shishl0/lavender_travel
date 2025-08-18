"use client";
import { track } from "@/lib/track";

export default function WhatsAppFab({ phone = "77080086191" }: { phone?: string }) {
  const onClick = () => {
    track("click_whatsapp", { place: "fab" });
  };

  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noreferrer"
      className="fab press"
      aria-label="WhatsApp"
      onClick={onClick}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 3.9A10 10 0 0 0 4.4 18.3L3 21l2.9-.8A10 10 0 1 0 20 3.9Zm-4.5 12.9c-1.1.1-2-.2-3.3-.9-2.8-1.6-4.6-4.6-4.8-4.9-.2-.3-1.1-1.5-1.1-2.8 0-1.4.7-2.1 1-2.4.3-.3.7-.4 1-.4h.7c.2 0 .5 0 .7.6.2.5.9 2.1.9 2.2.1.2.1.4 0 .6-.2.4-.4.5-.7.9-.1.1-.3.3-.1.6.2.3.8 1.3 1.8 2.1 1.2 1 2.1 1.3 2.5 1.4.2 0 .5 0 .6-.2.2-.2.7-.8.8-1 .2-.3.4-.2.6-.1.3.1 1.8.9 2.1 1 .3.2.5.3.5.5.1.4-.1 1.3-.6 2-.5.6-1.2.8-1.6.8Z" fill="#fff"/>
      </svg>
    </a>
  );
}