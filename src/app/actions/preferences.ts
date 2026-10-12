"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LOCALES } from "@/lib/constants";

export async function saveLocalePreference(locale: string) {
  const user = await getCurrentUser();
  if (!user || !LOCALES.includes(locale as never)) return;
  await db.user.update({ where: { id: user.id }, data: { locale } });
}
