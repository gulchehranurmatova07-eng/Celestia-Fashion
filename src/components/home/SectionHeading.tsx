import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-12" data-reveal>
      <div>
        <p className="eyebrow mb-3 text-ink-faint">{eyebrow}</p>
        <h2 className="heading-display text-4xl md:text-6xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
