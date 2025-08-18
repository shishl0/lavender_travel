"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";

type Props = {
  name?: string | null;
  email: string;
  role?: "ADMIN" | "EDITOR" | "VIEWER" | string;
  image?: string | null;
};

function Initials({ text, size = 28 }: { text?: string | null; size?: number }) {
  const letter = (text?.trim()?.[0] || "?").toUpperCase();
  return (
    <div
      className="grid place-items-center rounded-full border border-gray-300
                 bg-gradient-to-b from-gray-100 to-gray-200 text-[12px] font-semibold text-gray-700"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {letter}
    </div>
  );
}

function roleBadgeClasses(role: string) {
  if (role === "ADMIN") return "bg-rose-50 text-rose-700 border-rose-200";
  if (role === "EDITOR") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function UserMenu({ name, email, role = "VIEWER", image }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // закрытие по клику вне/ESC
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* COMPACT BUTTON: tiny avatar + role pill */}
      <button
        ref={btnRef}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 shadow-sm
                   bg-white/70 hover:bg-white transition text-[12px] press"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
      >
        {image ? (
          <Image
            src={image}
            alt="avatar"
            width={28}
            height={28}
            className="h-7 w-7 rounded-full border border-gray-300 object-cover"
          />
        ) : (
          <Initials text={name || email} size={28} />
        )}

        <span
          className={`inline-flex items-center rounded-md border px-1.5 py-0.5 ${roleBadgeClasses(
            role
          )}`}
        >
          {role}
        </span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            {image ? (
              <Image
                src={image}
                alt="avatar"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border border-gray-300 object-cover"
              />
            ) : (
              <Initials text={name || email} size={40} />
            )}
            <div className="min-w-0">
              {name ? (
                <div className="truncate text-sm text-gray-900">{name}</div>
              ) : null}
              <div className="truncate text-xs text-gray-500">{email}</div>
              <span
                className={`mt-1 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] ${roleBadgeClasses(
                  role
                )}`}
              >
                {role}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100">
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 press"
              onClick={() => signOut({ callbackUrl: "/admin/login?msg=signedout" })}
            >
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}