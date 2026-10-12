"use server";

import { redirect } from "next/navigation";
import { destroySession, requireAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/storage";
import { ActionError, handle, ok } from "@/lib/admin/action";
import type { ActionState } from "@/lib/admin/types";

export async function signOutAction() {
  await destroySession();
  redirect("/");
}

/** Generic image upload used by image URL fields (categories, collections, settings). */
export async function uploadImageAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    await requireAdmin();
    const f = fd.get("file");
    if (!(f instanceof File) || f.size === 0) throw new ActionError("Choose an image to upload.");
    const url = await saveImage(f);
    return ok("Image uploaded — remember to save the form.", { url });
  });
}
