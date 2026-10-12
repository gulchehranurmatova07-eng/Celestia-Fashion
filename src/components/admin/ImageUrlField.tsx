"use client";

import { useEffect, useId, useRef, useState } from "react";
import { uploadImageAction } from "@/app/admin/actions";
import { INITIAL_STATE } from "@/lib/admin/types";
import { input, label as labelCls } from "./styles";
import { FieldError } from "./ActionForm";
import { useToast } from "./Toast";

/** A URL input with an optional "upload" button that stores the file and fills in its URL. */
export function ImageUrlField({
  label,
  name,
  defaultValue = "",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
}) {
  const id = useId();
  const toast = useToast();
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  // Keep the controlled value in sync when the surrounding form is reset.
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onReset = () => setUrl(defaultValue);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const res = await uploadImageAction(INITIAL_STATE, fd);
      toast(res.message, res.ok);
      if (res.ok && res.data?.url) setUrl(res.data.url);
    } catch {
      toast("Upload failed.", false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="flex gap-3">
        <div className="h-16 w-12 shrink-0 border border-line bg-ivory">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={ref}
            id={id}
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={input}
            placeholder="/images/… or https://…"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex h-8 cursor-pointer items-center border border-line px-3 text-2xs uppercase tracking-wide2 hover:border-obsidian focus-within:outline focus-within:outline-1 focus-within:outline-obsidian">
              {busy ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={onFile}
                disabled={busy}
                aria-label={`Upload ${label}`}
              />
            </label>
            {url ? (
              <button type="button" className="text-xs underline underline-offset-4" onClick={() => setUrl("")}>
                Clear
              </button>
            ) : null}
            <span className="text-xs text-ink-faint">{hint ?? "JPEG, PNG, WebP or AVIF · max 5 MB"}</span>
          </div>
        </div>
      </div>
      <FieldError name={name} />
    </div>
  );
}
