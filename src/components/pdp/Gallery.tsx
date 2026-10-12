"use client";

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/Dialog";
import { ChevronLeft, ChevronRight, CloseIcon, ZoomIcon } from "@/components/ui/Icons";

type Img = { url: string; alt: string };

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const t = useTranslations("product");
  const [zoom, setZoom] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
    scroller.current?.scrollTo({ left: 0 });
  }, [images]);

  return (
    <section aria-label={t("gallery")}>
      {/* Mobile: swipeable carousel */}
      <div className="relative md:hidden">
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className="relative aspect-product w-full shrink-0 snap-center bg-[#141414]"
              onClick={() => setZoom(i)}
              aria-label={t("zoom", { n: i + 1 })}
            >
              <Image src={img.url} alt={img.alt || name} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden="true">
            {images.map((img, i) => (
              <span key={img.url} className={clsx("h-[3px] transition-all", i === active ? "w-6 bg-ivory" : "w-3 bg-ivory/40")} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: editorial grid */}
      <div className="hidden gap-2 md:grid md:grid-cols-2">
        {images.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => setZoom(i)}
            aria-label={t("zoom", { n: i + 1 })}
            className={clsx(
              "group relative aspect-product cursor-zoom-in overflow-hidden bg-[#141414]",
              images.length % 2 === 1 && i === 0 && "col-span-2 aspect-[4/5]",
            )}
          >
            <Image
              src={img.url}
              alt={img.alt || name}
              fill
              priority={i < 2}
              sizes="(min-width: 1280px) 30vw, 45vw"
              className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-[1.02]"
            />
            <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIcon size={16} />
            </span>
          </button>
        ))}
      </div>

      <ZoomViewer images={images} name={name} index={zoom} onIndex={setZoom} />
    </section>
  );
}

function ZoomViewer({ images, name, index, onIndex }: { images: Img[]; name: string; index: number | null; onIndex: (i: number | null) => void }) {
  const t = useTranslations("product");
  const [magnified, setMagnified] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const open = index !== null;
  const i = index ?? 0;
  const go = (d: number) => {
    setMagnified(false);
    onIndex((i + d + images.length) % images.length);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Dialog open={open} onClose={() => onIndex(null)} label={name} variant="center" className="bg-[#0d0d0d] text-ivory">
      <div className="relative flex h-[92vh] items-center justify-center overflow-hidden">
        {open && (
          <button
            type="button"
            className={clsx("relative h-full w-full", magnified ? "cursor-zoom-out" : "cursor-zoom-in")}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
              setMagnified((m) => !m);
            }}
            aria-label={t("imageOf", { n: i + 1, total: images.length })}
          >
            <Image
              src={images[i].url}
              alt={images[i].alt || name}
              fill
              sizes="100vw"
              quality={90}
              className="object-contain transition-transform duration-500 ease-luxe"
              style={{ transform: magnified ? "scale(2.2)" : "none", transformOrigin: origin }}
            />
          </button>
        )}
        <button type="button" onClick={() => onIndex(null)} aria-label={t("closeZoom")} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center bg-black/40">
          <CloseIcon />
        </button>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t("imageOf", { n: ((i - 1 + images.length) % images.length) + 1, total: images.length })} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/40">
              <ChevronLeft />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t("imageOf", { n: ((i + 1) % images.length) + 1, total: images.length })} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/40">
              <ChevronRight />
            </button>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs tracking-wide2 text-ivory/80">
              {i + 1} / {images.length}
            </p>
          </>
        )}
      </div>
    </Dialog>
  );
}
