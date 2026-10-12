import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

export function ContentPage({ title, locale, children, wide }: { title: string; locale: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="container-luxe pb-24">
      <Breadcrumbs locale={locale} items={[{ label: title }]} />
      <h1 className="heading-display pb-10 pt-2 text-5xl md:text-7xl">{title}</h1>
      <div className={wide ? "" : "max-w-3xl"}>{children}</div>
    </div>
  );
}
