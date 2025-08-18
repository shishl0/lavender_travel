export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export const can = {
  manageUsers: (role: Role) => role === "ADMIN",
  editContent: (role: Role) => role === "ADMIN" || role === "EDITOR",
  viewAnalytics: (_role: Role) => true, // всем
  viewActivity: (role: Role) => role === "ADMIN" || role === "EDITOR",
};