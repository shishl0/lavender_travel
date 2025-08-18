"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/structure/siteSettings", label: "Редактирование" },
  { href: "/admin/analytics",              label: "Аналитика" },
  { href: "/admin/activity",               label: "Действия" },
];

const EDIT_ROOT = "/admin/structure";

export default function TabNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname() || "/";

  return (
    <div className={`flex ${mobile ? "gap-2" : "gap-1"}`}>
      {items.map((i) => {
        const isEditTab = i.href === "/admin/structure/siteSettings";

        const active = isEditTab
          ? pathname === EDIT_ROOT || pathname.startsWith(`${EDIT_ROOT}/`)
          : (pathname === "/admin" && i.href === "/admin/analytics") || pathname.startsWith(i.href);

        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={[
              "px-3 py-2 rounded-lg text-sm transition press",
              active
                ? "bg-[#f0ecfb] text-[#5e3bb7] font-semibold"
                : "hover:bg-gray-100 text-gray-700",
            ].join(" ")}
          >
            {i.label}
          </Link>
        );
      })}
    </div>
  );
}