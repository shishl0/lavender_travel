"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: redirectTo,
    });
    setBusy(false);

    if (res?.error) {
      setErr("Неверный email или пароль");
      return;
    }
    window.location.href = res?.url ?? redirectTo;
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{err}</div>}
      <input
        className="border rounded-lg px-3 py-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <input
        className="border rounded-lg px-3 py-2"
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded" disabled={busy}>
        {busy ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}