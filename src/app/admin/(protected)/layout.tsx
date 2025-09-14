import { ReactNode } from "react";
import { requireRole } from "@/lib/require-auth";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "./ui/UserMenu";
import TabNav from "./ui/TabNav";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(); // редиректит на /admin/login если не залогинен
  const user = session.user as any;

  return (
    <div className="admin-ui min-h-screen bg-[#f7f7fb]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container h-14 flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Lavender" width={28} height={28} className="rounded-md" />
            <span className="font-semibold">Lavender Admin</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <TabNav />
          </nav>

          <UserMenu
            name={user?.name ?? "Admin"}
            email={user?.email ?? ""}
            role={user?.role ?? "ADMIN"}
            image={user?.image ?? undefined}
          />
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden border-t border-gray-200">
          <div className="container py-2">
            <TabNav mobile />
          </div>
        </div>
      </header>

      {/* Page area */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}