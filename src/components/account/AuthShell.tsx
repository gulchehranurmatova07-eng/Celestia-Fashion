import Image from "next/image";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, image = "/images/looks/look-10.jpg", children }: { title: string; subtitle?: string; image?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-var(--header-h))] md:grid-cols-2">
      <div className="relative hidden bg-[#141414] md:block">
        <Image src={image} alt="" fill priority sizes="50vw" className="object-cover object-top" />
      </div>
      <div className="flex items-center justify-center px-5 py-16 md:px-12">
        <div className="w-full max-w-sm">
          <h1 className="heading-display text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
