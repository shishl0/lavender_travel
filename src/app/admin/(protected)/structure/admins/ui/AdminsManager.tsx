"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/tz";
import Select from "../../../ui/Select";

type AdminRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "EDITOR" | "VIEWER" | string;
  image: string | null;

  createdAtISO: string;
  createdAtDisplay: string;
  lastLoginAtISO: string | null;
  lastLoginAtDisplay: string | null;
};

function fmtKZ(iso?: string | null) {
  return iso ? formatDateTime(iso) : null;
}

export default function AdminsManager({
  initial,
  canManage = false,
}: {
  initial: AdminRow[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminRow[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "EDITOR",
    password: "",
  });

  // --- CREATE
  async function createUser() {
    if (!canManage) return;
    if (!form.email || !form.password) {
      alert("Email и пароль обязательны");
      return;
    }
    setBusy("create");
    try {
      const res = await fetch("/api/admins/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "create failed");

      const u = j.user as AdminRow;
      setRows((p) => [u, ...p]);
      setForm({ email: "", name: "", role: "EDITOR", password: "" });

      router.refresh();
    } catch (e) {
      alert("Ошибка создания");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  // --- UPDATE
  async function updateUser(id: string, patch: Partial<Pick<AdminRow, "email" | "name" | "role">>) {
    setBusy(`u:${id}`);
    try {
      const res = await fetch("/api/admins/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "update failed");

      const u = j.user as AdminRow;
      setRows((p) => p.map((x) => (x.id === id ? u : x)));
      router.refresh();
    } catch (e) {
      alert("Ошибка сохранения");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  // --- RESET PASSWORD
  async function resetPassword(id: string) {
    if (!canManage) return;
    const newPassword = prompt("Введите новый пароль:");
    if (!newPassword) return;
    setBusy(`rp:${id}`);
    try {
      const res = await fetch("/api/admins/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, newPassword }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "reset failed");
      alert("Пароль обновлён");
    } catch (e) {
      alert("Ошибка смены пароля");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  // --- DELETE
  async function removeUser(id: string) {
    if (!canManage) return;
    if (!confirm("Удалить пользователя?")) return;
    setBusy(`d:${id}`);
    try {
      const res = await fetch("/api/admins/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "delete failed");

      setRows((p) => p.filter((x) => x.id !== id));
      router.refresh();
    } catch (e) {
      alert("Ошибка удаления");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4">
      {/* Создание пользователя */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Добавить пользователя</h3>

        {!canManage && (
          <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            У вас нет прав для создания пользователей. Обратитесь к администратору.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="h-10 border rounded-lg px-3 py-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            disabled={!canManage}
          />
          <input
            className="h-10 border rounded-lg px-3 py-2"
            placeholder="Имя (опц.)"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            disabled={!canManage}
          />

          <Select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            disabled={!canManage}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="VIEWER">VIEWER</option>
          </Select>

          <input
            className="h-10 border rounded-lg px-3 py-2"
            placeholder="Пароль"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            disabled={!canManage}
          />
        </div>

        <div className="mt-3">
          <button
            className="w-50 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded press"
            onClick={createUser}
            disabled={!canManage || busy === "create"}
          >
            {busy === "create" ? "Создаём…" : "Создать"}
          </button>
        </div>
      </div>

      {/* Список пользователей */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Имя</th>
              <th className="px-3 py-2">Роль</th>
              <th className="px-3 py-2">Создан</th>
              <th className="px-3 py-2">Последний вход</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const isBusy =
                busy?.startsWith(`u:${u.id}`) ||
                busy?.startsWith(`rp:${u.id}`) ||
                busy?.startsWith(`d:${u.id}`);

              return (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">
                    <input
                      className="h-10 border rounded-lg px-2 py-1 w-64"
                      value={u.email}
                      onChange={(e) =>
                        setRows((p) => p.map((x) => (x.id === u.id ? { ...x, email: e.target.value } : x)))
                      }
                      onBlur={(e) => canManage && updateUser(u.id, { email: e.currentTarget.value.trim() })}
                      disabled={!canManage || !!isBusy}
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      className="h-10 border rounded-lg px-2 py-1 w-48"
                      value={u.name || ""}
                      onChange={(e) =>
                        setRows((p) => p.map((x) => (x.id === u.id ? { ...x, name: e.target.value } : x)))
                      }
                      onBlur={(e) => canManage && updateUser(u.id, { name: e.currentTarget.value })}
                      disabled={!canManage || !!isBusy}
                    />
                  </td>

                  <td className="px-3 py-2">
                    <Select
                      value={u.role}
                      onChange={(e) => {
                        const role = e.target.value;
                        setRows((p) => p.map((x) => (x.id === u.id ? { ...x, role } : x)));
                        if (canManage) updateUser(u.id, { role });
                      }}
                      disabled={!canManage || !!isBusy}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </Select>
                  </td>

                  <td className="px-3 py-2 text-gray-500">
                    <time dateTime={u.createdAtISO} suppressHydrationWarning>
                      {u.createdAtDisplay}
                    </time>
                  </td>

                  <td className="px-3 py-2 text-gray-500">
                    {u.lastLoginAtISO ? (
                      <time dateTime={u.lastLoginAtISO} suppressHydrationWarning>
                        {u.lastLoginAtDisplay ?? fmtKZ(u.lastLoginAtISO)}
                      </time>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <button
                      className="btn-ghost press mr-2"
                      onClick={() => canManage && resetPassword(u.id)}
                      disabled={!canManage || !!isBusy}
                    >
                      Сбросить пароль
                    </button>
                    <button
                      onClick={() => canManage && removeUser(u.id)}
                      disabled={!canManage || !!isBusy}
                      className="h-9 w-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50 press"
                      title="Удалить"
                      >
                      <b>x</b>
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                  Нет пользователей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500">
        Права:
        <ul className="list-disc ml-5 mt-1">
          <li><b>ADMIN</b> — полный доступ (пользователи, контент, аналитика, действия)</li>
          <li><b>EDITOR</b> — редактирование контента (Site Settings, Hero, Destinations), просмотр аналитики</li>
          <li><b>VIEWER</b> — только просмотр аналитики</li>
        </ul>
      </div>
    </div>
  );
}