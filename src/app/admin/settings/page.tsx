import { getAdminSettings } from "@/lib/admin/queries";
import { ActionForm, FormStatus, SubmitButton } from "@/components/admin/ActionForm";
import { Checkbox, TextArea, TextField } from "@/components/admin/fields";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { Badge, PageHeader } from "@/components/admin/ui";
import { btnDark, section, sectionHead } from "@/components/admin/styles";
import { saveSettingsAction } from "./actions";

export const metadata = { title: "Settings" };

const LOCS = ["en", "ru", "uz"] as const;

function Localized({ label, name, value, area, required }: { label: string; name: string; value: Record<string, string>; area?: boolean; required?: boolean }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {LOCS.map((l) =>
        area ? (
          <TextArea key={l} label={`${label} (${l.toUpperCase()})`} name={`${name}.${l}`} defaultValue={value[l] ?? ""} rows={3} />
        ) : (
          <TextField key={l} label={`${label} (${l.toUpperCase()})`} name={`${name}.${l}`} defaultValue={value[l] ?? ""} required={required && l === "en"} />
        ),
      )}
    </div>
  );
}

const PROVIDER_FIELD = { COD: "cod", CLICK: "click", PAYME: "payme", UZUM: "uzum" } as const;
const PROVIDER_LABEL = { COD: "Cash on delivery", CLICK: "Click", PAYME: "Payme", UZUM: "Uzum Bank" } as const;

export default async function SettingsPage() {
  const { settings: s, report } = await getAdminSettings();
  return (
    <>
      <PageHeader title="Settings" eyebrow="Store" description="Changes apply to the storefront immediately after saving." />
      <ActionForm action={saveSettingsAction} className="space-y-6" aria-label="Store settings">
        <section className={section} aria-labelledby="ann-h">
          <div className={sectionHead}><h2 id="ann-h" className="eyebrow">Announcement bar</h2></div>
          <div className="space-y-4 p-4">
            <Checkbox label="Show the announcement bar" name="announcement.enabled" defaultChecked={s.announcement.enabled} />
            <Localized label="Text" name="announcement.text" value={s.announcement.text} />
            <TextField label="Link" name="announcement.href" defaultValue={s.announcement.href} hint="Optional: /catalog?new=1 or https://…" className="max-w-md" />
          </div>
        </section>

        <section className={section} aria-labelledby="hero-h">
          <div className={sectionHead}><h2 id="hero-h" className="eyebrow">Homepage hero</h2></div>
          <div className="space-y-4 p-4">
            <Localized label="Title" name="hero.title" value={s.hero.title} />
            <Localized label="Subtitle" name="hero.subtitle" value={s.hero.subtitle} area />
            <div className="grid gap-4 lg:grid-cols-2">
              {[0, 1, 2].map((i) => (
                <ImageUrlField key={i} label={`Desktop image ${i + 1} of 3`} name={`hero.imageDesktop.${i}`} defaultValue={s.hero.imageDesktop[i] ?? ""} />
              ))}
              <ImageUrlField label="Mobile image" name="hero.imageMobile" defaultValue={s.hero.imageMobile} />
            </div>
          </div>
        </section>

        <section className={section} aria-labelledby="ship-h">
          <div className={sectionHead}><h2 id="ship-h" className="eyebrow">Shipping</h2></div>
          <div className="space-y-4 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Courier — Tashkent (UZS)" name="shipping.courierTashkent" type="number" min={0} step={1} defaultValue={s.shipping.courierTashkent} />
              <TextField label="Courier — regions (UZS)" name="shipping.courierRegions" type="number" min={0} step={1} defaultValue={s.shipping.courierRegions} />
              <TextField label="Free delivery from (UZS)" name="shipping.freeThreshold" type="number" min={0} step={1} defaultValue={s.shipping.freeThreshold} hint="0 disables free delivery" />
            </div>
            <Checkbox label="Offer in-store pickup" name="shipping.pickupEnabled" defaultChecked={s.shipping.pickupEnabled} />
            <Localized label="Pickup address" name="shipping.pickupAddress" value={s.shipping.pickupAddress} />
          </div>
        </section>

        <section className={section} aria-labelledby="pay-h">
          <div className={sectionHead}><h2 id="pay-h" className="eyebrow">Payments</h2></div>
          <div className="p-4">
            <p className="mb-4 max-w-3xl text-sm text-ink-soft">
              Online providers are <strong>never shown at checkout</strong> until both their credentials are configured in the server
              environment <em>and</em> the integration is marked ready in code — even if you enable them here.
            </p>
            <ul className="divide-y divide-line border border-line">
              {report.map((r) => {
                const field = PROVIDER_FIELD[r.provider];
                const shown = s.payments[field] && r.configured && r.integrationReady;
                return (
                  <li key={r.provider} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <Checkbox label={PROVIDER_LABEL[r.provider]} name={`payments.${field}`} defaultChecked={s.payments[field]} />
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span>Credentials configured: <Badge tone={r.configured ? "green" : "red"}>{r.configured ? "Yes" : "No"}</Badge></span>
                      <span>Integration ready: <Badge tone={r.integrationReady ? "green" : "red"}>{r.integrationReady ? "Yes" : "No"}</Badge></span>
                      <span>At checkout now: <Badge tone={shown ? "green" : "neutral"}>{shown ? "Shown" : "Hidden"}</Badge></span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className={section} aria-labelledby="contact-h">
          <div className={sectionHead}><h2 id="contact-h" className="eyebrow">Contact</h2></div>
          <div className="space-y-4 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Email" name="contact.email" type="email" defaultValue={s.contact.email} />
              <TextField label="Phone" name="contact.phone" type="tel" defaultValue={s.contact.phone} />
            </div>
            <Localized label="Address" name="contact.address" value={s.contact.address} />
            <Localized label="Opening hours" name="contact.hours" value={s.contact.hours} />
          </div>
        </section>

        <section className={section} aria-labelledby="social-h">
          <div className={sectionHead}><h2 id="social-h" className="eyebrow">Social links</h2></div>
          <div className="grid gap-4 p-4 md:grid-cols-3">
            <TextField label="Instagram" name="social.instagram" type="url" defaultValue={s.social.instagram} placeholder="https://instagram.com/…" />
            <TextField label="Telegram" name="social.telegram" type="url" defaultValue={s.social.telegram} placeholder="https://t.me/…" />
            <TextField label="Facebook" name="social.facebook" type="url" defaultValue={s.social.facebook} placeholder="https://facebook.com/…" />
          </div>
        </section>

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-4 border border-line bg-white px-4 py-3">
          <SubmitButton className={btnDark} pendingText="Saving…">Save settings</SubmitButton>
          <FormStatus />
        </div>
      </ActionForm>
    </>
  );
}
