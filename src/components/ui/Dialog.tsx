"use client";

import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** "center" modal, or a drawer sliding from the given side */
  variant?: "center" | "right" | "left" | "top";
  className?: string;
};

/**
 * Accessible modal built on the native <dialog> element: focus is trapped,
 * Escape closes it, the rest of the page is inert and focus returns to the opener.
 */
export function Dialog({ open, onClose, label, children, variant = "center", className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && el.open) {
      el.close();
    }
    return () => {
      if (!open) document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => {
      document.documentElement.style.overflow = "";
      onClose();
    };
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={clsx(
        "m-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-obsidian/45 backdrop:backdrop-blur-[1px] open:animate-fade-in",
        variant === "center" && "fixed inset-0 m-auto h-fit max-h-[92vh] w-[min(1080px,calc(100vw-2rem))]",
        variant === "right" && "fixed inset-y-0 left-auto right-0 h-full w-full max-w-[440px]",
        variant === "left" && "fixed inset-y-0 left-0 right-auto h-full w-full max-w-[420px]",
        variant === "top" && "fixed inset-x-0 bottom-auto top-0 w-full",
      )}
    >
      {open && (
        <div
          className={clsx(
            "h-full bg-white text-ink",
            variant === "right" && "animate-[slide-in-right_0.45s_cubic-bezier(0.22,0.61,0.36,1)_both]",
            variant === "left" && "animate-[slide-in-left_0.45s_cubic-bezier(0.22,0.61,0.36,1)_both]",
            variant === "top" && "animate-[slide-in-top_0.4s_cubic-bezier(0.22,0.61,0.36,1)_both]",
            className,
          )}
        >
          {children}
        </div>
      )}
    </dialog>
  );
}
