import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "ADMIN" | "EDITOR" | "VIEWER";
  }
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: "ADMIN" | "EDITOR" | "VIEWER";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "EDITOR" | "VIEWER";
  }
}