import "server-only";
import { unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { AuthError } from "@/lib/auth";
import { StorageError } from "@/lib/storage";
import type { ActionState } from "./types";

/** A user-facing error raised inside an action. */
export class ActionError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
  }
}

export function ok(message: string, data?: Record<string, string>): ActionState {
  return { ok: true, message, data, at: Date.now() };
}

/**
 * Runs an action body and converts known failures into an ActionState.
 * Every action still calls `await requireAdmin()` itself as its first statement inside `fn`.
 */
export async function handle(fn: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err); // let redirect()/notFound() through
    const at = Date.now();
    if (err instanceof AuthError) return { ok: false, message: "Administrator access required.", at };
    if (err instanceof ActionError) return { ok: false, message: err.message, errors: err.errors, at };
    if (err instanceof StorageError) return { ok: false, message: err.message, at };
    if (err instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".");
        if (key && !errors[key]) errors[key] = issue.message;
      }
      const first = err.issues[0];
      const where = first?.path.length ? `${first.path.join(".")}: ` : "";
      return { ok: false, message: `Please check the form — ${where}${first?.message ?? "invalid input"}`, errors, at };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        const target = (err.meta?.target as string[] | string | undefined) ?? "";
        const field = Array.isArray(target) ? target.join(", ") : String(target);
        return { ok: false, message: `That value is already in use${field ? ` (${field})` : ""}. It must be unique.`, at };
      }
      if (err.code === "P2025") return { ok: false, message: "The record no longer exists.", at };
      if (err.code === "P2003") return { ok: false, message: "This record is still referenced by other data.", at };
    }
    console.error("[admin action]", err);
    return { ok: false, message: "Something went wrong. Please try again.", at };
  }
}

/** Revalidates the storefront and the given admin paths. */
export function refresh(...adminPaths: string[]) {
  revalidatePath("/", "layout");
  for (const p of adminPaths) revalidatePath(p);
}

/* ---------------- FormData helpers ---------------- */

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function strs(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === "string" && v.length > 0);
}

export function file(fd: FormData, key: string): File | null {
  const v = fd.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

/* ---------------- Shared zod pieces ---------------- */

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const idSchema = z.string().trim().min(1, "Missing id").max(64);

/** Optional image reference: a site-relative path or an http(s) URL. */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "Use a /path or an https:// URL")
  .refine((v) => !v.startsWith("//"), "Protocol-relative URLs are not allowed");

export const intSchema = (min = 0, max = 2_000_000_000) => z.coerce.number().int("Must be a whole number").min(min).max(max);
