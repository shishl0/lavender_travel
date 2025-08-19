"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/structure/siteSettings", label: "Site Settings" },
  { href: "/admin/structure/hero",         label: "Hero" },
  { href: "/admin/structure/destinations", label: "Destinations" },
  { href: "/admin/structure/admins",       label: "Admins" },
  { href: "/admin/structure/reviews",      label: "Reviews"},
];

export default function StructureTabs() {
  const pathname = usePathname() || "/";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => {
        const active = pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={[
              "px-3 py-1.5 rounded-md text-sm border press",
              active
                ? "bg-white border-[#dcd0ff] text-[#5e3bb7] shadow-sm"
                : "border-gray-200 hover:bg-gray-50 text-gray-700",
            ].join(" ")}
          >
            {i.label}
          </Link>
        );
      })}
    </div>
  );
}