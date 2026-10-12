"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/Dialog";
import { CloseIcon } from "@/components/ui/Icons";
import { hasSizeGuide } from "@/lib/size-guide";
import { SizeGuideTable } from "./SizeGuideTable";

export function SizeGuideDialog({ chart }: { chart: string }) {
  const t = useTranslations("product");
  const tc = useTranslations("common.actions");
  const [open, setOpen] = useState(false);
  if (!hasSizeGuide(chart)) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-ink-soft underline underline-offset-4 hover:text-ink">
        {t("sizeGuide")}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} label={t("sizeChart.title")} variant="right">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <h2 className="font-serif text-2xl">{t("sizeChart.title")}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={tc("close")} className="p-2">
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <p className="text-sm leading-relaxed text-ink-soft">{t("sizeChart.intro")}</p>
            <SizeGuideTable chart={chart} />
            <div>
              <h3 className="eyebrow mb-3">{t("sizeChart.howTo")}</h3>
              <ul className="space-y-2 text-sm leading-relaxed text-ink-soft">
                {chart === "shoes" ? (
                  <li>{t("sizeChart.howToFoot")}</li>
                ) : (
                  <>
                    <li>{t("sizeChart.howToChest")}</li>
                    <li>{t("sizeChart.howToWaist")}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
