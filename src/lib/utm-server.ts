import { cookies } from "next/headers";
import type { Utm } from "./utm-types";


export async function readUtmCookie(): Promise<Utm | null> {
  try {
    const jar = await cookies(); 
    const raw = jar.get("utm")?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as Utm;
  } catch {
    return null;
  }
}