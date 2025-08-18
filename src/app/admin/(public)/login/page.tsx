import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const back = typeof params?.redirect === "string" ? params.redirect : "/admin";

  if (session?.user?.id) redirect(back);

  const msg = params?.msg;

  return (
      <div className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold mb-4">Lavender Admin</h1>

        {msg === "signedout" && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            Вы вышли из аккаунта.
          </div>
        )}

        <LoginForm />
      </div>
  );
}