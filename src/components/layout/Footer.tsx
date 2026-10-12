import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Emblem, Wordmark } from "@/components/brand/Logo";
import { FacebookIcon, InstagramIcon, TelegramIcon } from "@/components/ui/Icons";
import type { StoreSettings } from "@/lib/settings";
import type { Locale } from "@/lib/constants";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NewsletterForm } from "./NewsletterForm";

export async function Footer({ settings, locale, signedIn, codEnabled }: { settings: StoreSettings; locale: Locale; signedIn: boolean; codEnabled: boolean }) {
  const t = await getTranslations("common");
  const social = [
    { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.social.telegram, label: "Telegram", Icon: TelegramIcon },
    { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
  ].filter((s) => s.href);

  const col = (title: string, links: { href: string; label: string }[]) => (
    <div>
      <h2 className="eyebrow mb-5 text-ivory/60">{title}</h2>
      <ul className="space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.href}><Link href={l.href} className="link-underline text-ivory/85 hover:text-ivory">{l.label}</Link></li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="on-dark bg-obsidian text-ivory">
      <div className="container-luxe grid gap-14 py-16 lg:grid-cols-[1.2fr_2fr] lg:py-20">
        <div className="max-w-sm space-y-6">
          <Link href="/" className="inline-flex flex-col items-start gap-4" aria-label="CELESTIA">
            <Emblem className="h-12 w-12 text-champagne" />
            <Wordmark className="text-2xl" />
          </Link>
          <p className="font-serif text-xl font-light italic text-champagne">{t("brand.slogan")}</p>
          <p className="text-sm leading-relaxed text-ivory/70">{t("brand.statement")}</p>
          <div className="pt-2">
            <p className="eyebrow mb-1 text-ivory/60">{t("newsletter.title")}</p>
            <NewsletterForm tone="dark" id="footer-newsletter" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {col(t("footer.shop"), [
            { href: "/catalog?new=1", label: t("nav.newArrivals") },
            { href: "/catalog?gender=men", label: t("nav.men") },
            { href: "/catalog?gender=women", label: t("nav.women") },
            { href: "/catalog?category=accessories", label: t("nav.accessories") },
            { href: "/collections", label: t("nav.collections") },
            { href: "/catalog?sale=1", label: t("nav.sale") },
          ])}
          {col(t("footer.service"), [
            { href: "/shipping-returns", label: t("footer.shippingReturns") },
            { href: "/size-guide", label: t("footer.sizeGuide") },
            { href: "/contact", label: t("footer.contactUs") },
            { href: signedIn ? "/account/orders" : "/login", label: t("footer.orders") },
          ])}
          {col(t("footer.about"), [
            { href: "/about", label: t("footer.ourStory") },
            { href: "/privacy", label: t("footer.privacy") },
            { href: "/terms", label: t("footer.terms") },
            { href: signedIn ? "/account" : "/login", label: t("footer.account") },
          ])}
          <div>
            <h2 className="eyebrow mb-5 text-ivory/60">{t("footer.contact")}</h2>
            <address className="space-y-2 text-sm not-italic text-ivory/85">
              <p><a href={`mailto:${settings.contact.email}`} className="link-underline">{settings.contact.email}</a></p>
              <p><a href={`tel:${settings.contact.phone.replace(/\s/g, "")}`} className="link-underline">{settings.contact.phone}</a></p>
              <p className="text-ivory/60">{settings.contact.address[locale]}</p>
              <p className="text-ivory/60">{settings.contact.hours[locale]}</p>
            </address>
            {social.length > 0 && (
              <ul className="mt-6 flex gap-3" aria-label={t("footer.follow")}>
                {social.map(({ href, label, Icon }) => (
                  <li key={label}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-champagne"><Icon /></a></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/15">
        <div className="container-luxe flex flex-col gap-4 py-6 text-xs text-ivory/60 md:flex-row md:items-center md:justify-between">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p className="md:text-center">
            {t("footer.deliveryInfo")}
            {codEnabled && <> · {t("footer.paymentInfo")}: {t("footer.cod")}</>}
          </p>
          <LanguageSwitcher signedIn={signedIn} className="text-ivory" />
        </div>
        <p className="container-luxe pb-6 text-[11px] text-ivory/45">{t("footer.demoNotice")}</p>
      </div>
    </footer>
  );
}
