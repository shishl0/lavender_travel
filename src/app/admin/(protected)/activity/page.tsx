import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CleanupButton, WipeAllButton } from "./ui/Buttons";
import { formatDateTime } from "@/lib/tz";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function toStr(v: string | string[] | undefined, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function toInt(v: string | string[] | undefined, def: number, min = 1, max = 500): number {
  const n = parseInt(typeof v === "string" ? v : `${def}`, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}


export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const statusParam = toStr(sp.status, "ALL").toUpperCase();
  const q = toStr(sp.q, "").trim();
  const page = toInt(sp.page, 1, 1, 10_000);
  const take = toInt(sp.take, 100, 10, 500);
  const skip = (page - 1) * take;

  const where: any = {};
  if (statusParam === "OK" || statusParam === "ERROR") where.status = statusParam;

  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { route: { contains: q, mode: "insensitive" } },
      { actorEmail: { contains: q, mode: "insensitive" } },
      { actorId: { contains: q, mode: "insensitive" } },
      { ip: { contains: q, mode: "insensitive" } },
      { targetType: { contains: q, mode: "insensitive" } },
      { targetId: { contains: q, mode: "insensitive" } },
      { method: { contains: q, mode: "insensitive" } },
      { error: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { ts: "desc" },
      skip,
      take,
      select: {
        id: true,
        ts: true,
        action: true,
        status: true,
        actorEmail: true,
        actorId: true,
        role: true,
        route: true,
        method: true,
        ip: true,
        ua: true,
        durationMs: true,
        targetType: true,
        targetId: true,
        payload: true,
        diff: true,
        error: true,
        meta: true,
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / take));

  const buildQS = (over: Partial<Record<string, string | number>>) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (statusParam) u.set("status", statusParam);
    u.set("take", String(take));
    u.set("page", String(page));
    for (const [k, v] of Object.entries(over)) u.set(k, String(v));
    return `?${u.toString()}`;
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Действия</h1>
        <div className="flex items-center gap-2">
          <CleanupButton />
          <WipeAllButton />
        </div>
      </div>

      {/* Панель фильтров */}
      <form className="card p-3 md:p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Поиск</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="action / route / email / ip / target / error…"
            className="mt-1 w-full border rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 p-1">Статус</label>
          <select
            name="status"
            defaultValue={statusParam}
            className="mt-1 w-40 border rounded-xl px-3 py-2"
          >
            <option value="ALL">Все</option>
            <option value="OK">OK</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 p-1">На страницу</label>
          <select name="take" defaultValue={String(take)} className="mt-1 w-28 border rounded-xl px-3 py-2">
            {[50, 100, 200, 300, 500].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Кнопка — новая стилизация */}
        <button
          type="submit"
          className="w-50 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded press"
        >
          Фильтровать
        </button>
      </form>

      {/* Таблица */}
      <div className="card p-0 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
            <tr>
              <Th>Время</Th>
              <Th>Действие</Th>
              <Th>Статус</Th>
              <Th>Пользователь</Th>
              <Th>Target</Th>
              <Th>Маршрут</Th>
              <Th>Метод</Th>
              <Th>IP</Th>
              <Th>Длит, мс</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <Row key={r.id} row={r} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Всего: <b>{total}</b> · стр. {page} из {pages}
        </div>
        <div className="flex items-center gap-2">
          <Link
            className={`btn-ghost px-3 py-2 rounded-lg border ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
            href={buildQS({ page: Math.max(1, page - 1) })}
          >
            ← Назад
          </Link>
          <Link
            className={`btn-ghost px-3 py-2 rounded-lg border ${page >= pages ? "pointer-events-none opacity-50" : ""}`}
            href={buildQS({ page: Math.min(pages, page + 1) })}
          >
            Вперёд →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-medium">{children}</th>;
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "OK";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
      title={ok ? "Успех" : "Ошибка"}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {status}
    </span>
  );
}

function SafeJson({ value }: { value: unknown }) {
  try {
    if (value == null) return <i className="text-gray-400">—</i>;
    return (
      <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto max-h-72 whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  } catch {
    return <i className="text-gray-400">—</i>;
  }
}

function Row({
  row,
}: {
  row: {
    id: string;
    ts: Date;
    action: string;
    status: "OK" | "ERROR" | string;
    actorEmail: string | null;
    actorId: string | null;
    role: string | null;
    route: string | null;
    method: string | null;
    ip: string | null;
    ua: string | null;
    durationMs: number | null;
    targetType: string | null;
    targetId: string | null;
    payload: any | null;
    diff: any | null;
    error: string | null;
    meta: any | null;
  };
}) {
  return (
    <>
      <tr className="border-t">
        <td className="px-3 py-2 align-top text-gray-700" title={row.ts.toISOString()}>
          {formatDateTime(row.ts)}
        </td>
        <td className="px-3 py-2 align-top font-medium text-[var(--navy)] break-all">{row.action}</td>
        <td className="px-3 py-2 align-top"><StatusBadge status={row.status} /></td>
        <td className="px-3 py-2 align-top">
          <div className="text-gray-900">{row.actorEmail || row.actorId || "—"}</div>
          {row.role && <div className="text-xs text-gray-500">{row.role}</div>}
        </td>
        <td className="px-3 py-2 align-top">
          <div className="text-gray-900">{row.targetType || "—"}</div>
          {row.targetId && <div className="text-xs text-gray-500">{row.targetId}</div>}
        </td>
        <td className="px-3 py-2 align-top">
          <div className="truncate max-w-[360px]" title={row.route || undefined}>{row.route || "—"}</div>
        </td>
        <td className="px-3 py-2 align-top">{row.method || "—"}</td>
        <td className="px-3 py-2 align-top">{row.ip || "—"}</td>
        <td className="px-3 py-2 align-top">{row.durationMs ?? "—"}</td>
      </tr>

      {(row.payload || row.diff || row.error || row.meta || row.ua) && (
        <tr className="border-t bg-white/50">
          <td className="px-3 py-2" colSpan={9}>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 space-y-3">
                {row.payload && (
                  <details className="group">
                    <summary className="cursor-pointer select-none text-sm text-gray-700 font-medium">
                      Payload
                      <span className="text-xs text-gray-400 ml-2 group-open:hidden">(развернуть)</span>
                      <span className="text-xs text-gray-400 ml-2 hidden group-open:inline">(свернуть)</span>
                    </summary>
                    <SafeJson value={row.payload} />
                  </details>
                )}

                {row.diff && (
                  <details className="group">
                    <summary className="cursor-pointer select-none text-sm text-gray-700 font-medium">
                      Diff
                      <span className="text-xs text-gray-400 ml-2 group-open:hidden">(развернуть)</span>
                      <span className="text-xs text-gray-400 ml-2 hidden group-open:inline">(свернуть)</span>
                    </summary>
                    <SafeJson value={row.diff} />
                  </details>
                )}

                {row.meta && (
                  <details className="group">
                    <summary className="cursor-pointer select-none text-sm text-gray-700 font-medium">
                      Meta
                      <span className="text-xs text-gray-400 ml-2 group-open:hidden">(развернуть)</span>
                      <span className="text-xs text-gray-400 ml-2 hidden group-open:inline">(свернуть)</span>
                    </summary>
                    <SafeJson value={row.meta} />
                  </details>
                )}
              </div>

              <div className="w-full md:w-[40%] space-y-3">
                {row.error && (
                  <details className="group">
                    <summary className="cursor-pointer select-none text-sm text-gray-700 font-medium">
                      Ошибка
                      <span className="text-xs text-gray-400 ml-2 group-open:hidden">(развернуть)</span>
                      <span className="text-xs text-gray-400 ml-2 hidden group-open:inline">(свернуть)</span>
                    </summary>
                    <pre className="text-xs bg-red-50 text-red-800 rounded-lg p-3 whitespace-pre-wrap overflow-auto max-h-72">
                      {row.error}
                    </pre>
                  </details>
                )}

                {row.ua && (
                  <details className="group">
                    <summary className="cursor-pointer select-none text-sm text-gray-700 font-medium">
                      User-Agent
                      <span className="text-xs text-gray-400 ml-2 group-open:hidden">(развернуть)</span>
                      <span className="text-xs text-gray-400 ml-2 hidden group-open:inline">(свернуть)</span>
                    </summary>
                    <pre className="text-xs bg-gray-50 rounded-lg p-3 whitespace-pre-wrap overflow-auto max-h-72">
                      {row.ua}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}