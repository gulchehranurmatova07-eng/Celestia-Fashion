import { Link } from "@/i18n/routing";

export function AnnouncementBar({ text, href }: { text: string; href: string }) {
  if (!text) return null;
  return (
    <div className="bg-obsidian text-ivory">
      <div className="container-luxe flex min-h-9 items-center justify-center py-2 text-center">
        {href ? (
          <Link href={href} className="text-[11px] leading-snug tracking-[0.12em] hover:underline hover:underline-offset-4">
            {text}
          </Link>
        ) : (
          <p className="text-[11px] leading-snug tracking-[0.12em]">{text}</p>
        )}
      </div>
    </div>
  );
}
