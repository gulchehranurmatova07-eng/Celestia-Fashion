import clsx from "clsx";

/** CELESTIA emblem: a high-contrast serif C, an orbital ring and a four-point star. */
export function Emblem({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path
        fill="currentColor"
        d="M46.14 15.15A22 22 0 1 0 46.14 48.85L47.38 45.75A18.5 18.5 0 1 1 47.38 18.25Z"
      />
      <ellipse cx="33" cy="34" rx="27" ry="6.2" fill="none" stroke="currentColor" strokeWidth="0.9" transform="rotate(-11 33 34)" />
      <path
        fill="currentColor"
        d="M35 20.5C35.7 27 37 28.6 42.8 30.2C37 31.8 35.7 33.4 35 40C34.3 33.4 33 31.8 27.2 30.2C33 28.6 34.3 27 35 20.5Z"
      />
    </svg>
  );
}

/** Wordmark set in the display serif with generous tracking; the final A echoes the logo's open Λ. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("font-serif font-normal uppercase tracking-luxe", className)}>
      CELESTI<span aria-hidden="true">Λ</span>
      <span className="sr-only">A</span>
    </span>
  );
}

export function Logo({ className, emblem = true }: { className?: string; emblem?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      {emblem && <Emblem className="h-7 w-7 shrink-0" />}
      <Wordmark className="text-[1.35rem] leading-none" />
    </span>
  );
}
