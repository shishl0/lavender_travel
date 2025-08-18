"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      className="btn-ghost press"
      onClick={() => signOut({ callbackUrl: "/admin/login?msg=signedout" })}
    >
      Выйти
    </button>
  );
}