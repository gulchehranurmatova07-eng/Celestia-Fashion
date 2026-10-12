"use client";

import { useStore } from "@/components/providers/StoreProvider";
import { Link } from "@/i18n/routing";
import { CloseIcon } from "@/components/ui/Icons";
import { useTranslations } from "next-intl";

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  const t = useTranslations("common.actions");
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto flex w-full max-w-md animate-fade-up items-center gap-4 bg-obsidian px-5 py-3.5 text-sm text-ivory shadow-lg">
          <span className="flex-1">{toast.message}</span>
          {toast.action &&
            (toast.action.href ? (
              <Link href={toast.action.href} className="text-2xs font-medium uppercase tracking-wide2 underline underline-offset-4">
                {toast.action.label}
              </Link>
            ) : (
              <button type="button" onClick={() => { toast.action?.onClick?.(); dismissToast(toast.id); }} className="text-2xs font-medium uppercase tracking-wide2 underline underline-offset-4">
                {toast.action.label}
              </button>
            ))}
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label={t("close")} className="opacity-70 hover:opacity-100">
            <CloseIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
