"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProductImageAction,
  moveProductImageAction,
  updateProductImageAction,
  uploadProductImageAction,
} from "@/app/admin/products/actions";
import { INITIAL_STATE } from "@/lib/admin/types";
import { ActionForm, SubmitButton } from "./ActionForm";
import { useToast } from "./Toast";
import { btnDark, btnGhost, input, label as labelCls, section, sectionHead } from "./styles";

type Img = { id: string; url: string; alt: string; colorId: string | null };
type Color = { id: string; nameEn: string };

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ProductImages({ productId, images, colors }: { productId: string; images: Img[]; colors: Color[] }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const uid = useId();

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const files = Array.from(fileRef.current?.files ?? []);
    if (!files.length) {
      toast("Choose at least one image.", false);
      return;
    }
    let done = 0;
    for (const [i, f] of files.entries()) {
      if (!TYPES.includes(f.type)) {
        toast(`${f.name}: only JPEG, PNG, WebP or AVIF images are allowed.`, false);
        continue;
      }
      if (f.size > MAX) {
        toast(`${f.name}: larger than 5 MB.`, false);
        continue;
      }
      setBusy(`Uploading ${i + 1} of ${files.length}…`);
      const one = new FormData();
      one.set("productId", productId);
      one.set("alt", String(fd.get("alt") ?? ""));
      one.set("colorId", String(fd.get("colorId") ?? ""));
      one.set("file", f);
      try {
        const res = await uploadProductImageAction(INITIAL_STATE, one);
        if (res.ok) done++;
        else toast(`${f.name}: ${res.message}`, false);
      } catch {
        toast(`${f.name}: upload failed.`, false);
      }
    }
    setBusy(null);
    if (done) {
      toast(`${done} image${done === 1 ? "" : "s"} uploaded.`);
      form.reset();
    }
    router.refresh();
  }

  const colorOptions = [{ id: "", nameEn: "— Any colour —" }, ...colors];

  return (
    <section className={section} aria-labelledby="images-h">
      <div className={sectionHead}>
        <h2 id="images-h" className="eyebrow">Images</h2>
        <span className="text-xs text-ink-faint">The first image is the main product photo.</span>
      </div>

      <form onSubmit={onUpload} className="grid gap-3 border-b border-line p-4 md:grid-cols-[2fr_2fr_1.5fr_auto] md:items-end" aria-label="Upload images">
        <div>
          <label htmlFor={`${uid}-files`} className={labelCls}>Files</label>
          <input
            ref={fileRef}
            id={`${uid}-files`}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="block w-full text-xs file:mr-3 file:border file:border-obsidian file:bg-white file:px-3 file:py-2 file:text-2xs file:uppercase file:tracking-wide2"
            aria-describedby={`${uid}-files-hint`}
          />
          <p id={`${uid}-files-hint`} className="mt-1 text-xs text-ink-faint">JPEG, PNG, WebP, AVIF · max 5 MB each</p>
        </div>
        <div>
          <label htmlFor={`${uid}-alt`} className={labelCls}>Alt text</label>
          <input id={`${uid}-alt`} name="alt" maxLength={200} className={input} placeholder="Describe the photo" />
        </div>
        <div>
          <label htmlFor={`${uid}-color`} className={labelCls}>Colour</label>
          <select id={`${uid}-color`} name="colorId" className={input}>
            {colorOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.nameEn}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={btnDark} disabled={busy !== null}>
          {busy ?? "Upload"}
        </button>
      </form>

      {images.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-faint">No images yet.</p>
      ) : (
        <ol className="divide-y divide-line">
          {images.map((img, i) => (
            <li key={img.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <span className="w-5 text-xs text-ink-faint">{i + 1}</span>
              <div className="h-24 w-[72px] shrink-0 border border-line bg-ivory">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <ActionForm action={updateProductImageAction} className="flex min-w-[260px] flex-1 flex-wrap items-end gap-2" aria-label={`Image ${i + 1} details`}>
                <input type="hidden" name="id" value={img.id} />
                <div className="min-w-[160px] flex-1">
                  <label htmlFor={`alt-${img.id}`} className={labelCls}>Alt text</label>
                  <input id={`alt-${img.id}`} name="alt" defaultValue={img.alt} maxLength={200} className={`${input} h-9`} />
                </div>
                <div className="w-44">
                  <label htmlFor={`col-${img.id}`} className={labelCls}>Colour</label>
                  <select id={`col-${img.id}`} name="colorId" defaultValue={img.colorId ?? ""} className={`${input} h-9`}>
                    {colorOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameEn}</option>
                    ))}
                  </select>
                </div>
                <SubmitButton className={btnGhost}>Save</SubmitButton>
              </ActionForm>
              <div className="flex items-center gap-2">
                <ActionForm action={moveProductImageAction} className="flex gap-1">
                  <input type="hidden" name="id" value={img.id} />
                  <SubmitButton className={btnGhost} name="dir" value="up" aria-label={`Move image ${i + 1} up`} disabled={i === 0}>
                    ↑
                  </SubmitButton>
                  <SubmitButton className={btnGhost} name="dir" value="down" aria-label={`Move image ${i + 1} down`} disabled={i === images.length - 1}>
                    ↓
                  </SubmitButton>
                </ActionForm>
                <ActionForm action={deleteProductImageAction}>
                  <input type="hidden" name="id" value={img.id} />
                  <SubmitButton className={`${btnGhost} hover:border-[#9B1C1C] hover:text-[#9B1C1C]`} confirm="Delete this image?" aria-label={`Delete image ${i + 1}`}>
                    Delete
                  </SubmitButton>
                </ActionForm>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
