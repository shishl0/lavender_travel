import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import { headers as getHeaders } from "next/headers";

export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message || (status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Error"));
    this.status = status;
  }
}

/**
 * Универсальная проверка:
 * - Для HTML-запросов (страницы) делает redirect.
 * - Для API бросает HttpError (её перехватит withAudit и отдаст JSON 401/403).
 */
export async function requireRole(roles?: Role[]) {
  const session = await getServerSession(authOptions);

  let isPageRequest = false;
  try {
    const h = await getHeaders();
    isPageRequest = (h?.get("accept") || "").includes("text/html");
  } catch {
    // В некоторых контекстах заголовков может не быть.
  }

  if (!session?.user?.id) {
    if (isPageRequest) redirect("/admin/login");
    throw new HttpError(401, "Unauthorized");
  }

  if (roles?.length) {
    const role: Role = ((session.user as any)?.role ?? "VIEWER") as Role;
    if (!roles.includes(role)) {
      if (isPageRequest) redirect("/admin");
      throw new HttpError(403, "Forbidden");
    }
  }

  return session;
}

// Алиас
export async function assertRole(roles: Role[]) {
  return requireRole(roles);
}