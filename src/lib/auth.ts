import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auditLog } from "@/lib/audit";

async function safeAudit(params: {
  action: string;
  status: "OK" | "ERROR";
  error?: string;
  target?: { type: string; id?: string | null };
  payload?: any;
  startedAt?: number;
}) {
  try {
    await auditLog({
      req: undefined,
      action: params.action,
      status: params.status,
      error: params.error,
      target: params.target,
      payload: params.payload,
      startedAt: params.startedAt ?? Date.now(),
    });
  } catch {
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const startedAt = Date.now();
        const email = (credentials?.email || "").toLowerCase().trim();
        const payload = { provider: "credentials", email };

        try {
          if (!email || !credentials?.password) {
            await safeAudit({
              action: "auth.signInTry",
              status: "ERROR",
              error: "missing_credentials",
              payload,
            });
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user?.passwordHash) {
            await safeAudit({
              action: "auth.signInTry",
              status: "ERROR",
              error: "user_not_found",
              payload,
            });
            return null;
          }

          const ok = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!ok) {
            await safeAudit({
              action: "auth.signInTry",
              status: "ERROR",
              error: "invalid_password",
              target: { type: "User", id: user.id },
              payload,
              startedAt,
            });
            return null;
          }

          await safeAudit({
            action: "auth.signInTry",
            status: "OK",
            target: { type: "User", id: user.id },
            payload,
            startedAt,
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            role: user.role,
          } as any;
        } catch (e: any) {
          await safeAudit({
            action: "auth.signInTry",
            status: "ERROR",
            error: e?.message || "unknown_error",
            payload,
            startedAt,
          });
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string | undefined;
        (session.user as any).role = (token as any).role ?? "VIEWER";
      }
      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      const userId = (user as any)?.id ?? null;

      if (userId) {
        await prisma.user
          .update({
            where: { id: userId as string },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => {});
      }

      await safeAudit({
        action: "auth.signIn",
        status: "OK",
        target: { type: "User", id: userId },
        payload: { provider: account?.provider || "credentials" },
      });
    },

    async signOut({ token, session }: any) {
      const userId =
        (token?.id as string | undefined) ??
        token?.sub ??
        ((session?.user as any)?.id as string | undefined) ??
        null;

      await safeAudit({
        action: "auth.signOut",
        status: "OK",
        target: { type: "User", id: userId },
        payload: { provider: "credentials" },
      });
    },
  },

  pages: { signIn: "/admin/login" },
};