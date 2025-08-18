import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

type AuditInput = {
  req?: Request | undefined;
  action: string;
  status?: "OK" | "ERROR";
  error?: string | null;
  target?: { type?: string | null; id?: string | null };
  payload?: any;
  diff?: any;
  meta?: any;
  startedAt?: number;
};

const SECRET_KEYS = new Set(["password", "newPassword", "token", "secret", "key", "authorization"]);

function redact(obj: any): any {
  try {
    if (obj == null) return obj;
    if (Array.isArray(obj)) return obj.map(redact);
    if (typeof obj === "object") {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = SECRET_KEYS.has(k.toLowerCase()) ? "***" : redact(v);
      }
      return out;
    }
    return obj;
  } catch {
    return undefined;
  }
}

export async function auditLog(input: AuditInput) {
  try {
    const { req, action } = input;

    let route = "";
    let method = "";
    try {
      if (req) {
        const url = new URL(req.url);
        route = url.pathname;
        method = req.method;
      }
    } catch {}

    const session = await getServerSession(authOptions).catch(() => null);
    const actorId = (session?.user as any)?.id ?? null;
    const actorEmail = session?.user?.email ?? null;
    const role = (session?.user as any)?.role ?? null;

    let ip = "local";
    let ua = "";
    try {
      if (req) {
        ip =
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          "local";
        ua = req.headers.get("user-agent") ?? "";
      }
    } catch {}

    const status = input.status ?? "OK";
    const durationMs = input.startedAt ? Date.now() - input.startedAt : null;

    await prisma.activity.create({
      data: {
        action,
        route,
        method,
        status: status === "OK" ? "OK" : "ERROR",
        actorId,
        actorEmail,
        role,
        ip,
        ua,
        durationMs: durationMs ?? undefined,
        targetType: input.target?.type ?? undefined,
        targetId: input.target?.id ?? undefined,
        payload: input.payload ? redact(input.payload) : undefined,
        diff: input.diff ? redact(input.diff) : undefined,
        error: input.error ?? undefined,
        meta: input.meta ? redact(input.meta) : undefined,
      },
    });
  } catch (e) {
    console.error("auditLog error (ignored):", e);
  }
}

export function withAudit<TCtx = any>(
  action: string,
  handler: (req: Request, ctx: TCtx) => Promise<Response>,
  getTarget?: (req: Request, ctx: TCtx, payload?: any) =>
    Promise<{ type?: string | null; id?: string | null } | null> |
    { type?: string | null; id?: string | null } |
    null,
  logBody: "none" | "json" | "text" = "none",
) {
  return async (req: Request, ctx: TCtx) => {
    const startedAt = Date.now();
    let status: "OK" | "ERROR" = "OK";
    let error: string | null = null;
    let payload: any = undefined;

    try {
      if (logBody !== "none") {
        const clone = req.clone();
        if (logBody === "json") payload = await clone.json().catch(() => undefined);
        else payload = (await clone.text().catch(() => "")).slice(0, 2000);
      }

      const res = await handler(req, ctx);
      if (res.status >= 400) status = "ERROR";
      return res;
    } catch (e: any) {
      status = "ERROR";

      // Пропускаем сквозь Response (например, redirect/NextResponse)
      if (e instanceof Response) {
        error = `Response ${e.status}`;
        throw e;
      }

      // Наши HttpError/ошибки с .status → вернём JSON с кодом
      const httpStatus = typeof e?.status === "number" ? e.status : undefined;
      error = (e?.message || String(e)).slice(0, 500);
      if (httpStatus) {
        return NextResponse.json({ error: e?.message || "Error" }, { status: httpStatus });
      }

      // Иное — пробрасываем дальше
      throw e;
    } finally {
      let target: any = null;
      try {
        if (getTarget) {
          target = await Promise.resolve((getTarget as any)(req, ctx, payload));
        }
      } catch {}
      await auditLog({
        req,
        action,
        status,
        error,
        target: target ?? undefined,
        payload,
        startedAt,
      });
    }
  };
}