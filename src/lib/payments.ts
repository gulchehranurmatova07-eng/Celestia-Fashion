import "server-only";
import type { StoreSettings } from "./settings";

export const PAYMENT_PROVIDERS = ["COD", "CLICK", "PAYME", "UZUM"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

/** Whether the merchant credentials for a provider exist in the environment. */
export function providerConfigured(provider: PaymentProvider) {
  switch (provider) {
    case "COD":
      return true;
    case "CLICK":
      return Boolean(process.env.CLICK_SERVICE_ID && process.env.CLICK_MERCHANT_ID && process.env.CLICK_SECRET_KEY);
    case "PAYME":
      return Boolean(process.env.PAYME_MERCHANT_ID && process.env.PAYME_SECRET_KEY);
    case "UZUM":
      return Boolean(process.env.UZUM_MERCHANT_ID && process.env.UZUM_SECRET_KEY);
  }
}

/**
 * Payment methods offered at checkout: enabled by an administrator AND configured.
 * Online providers are additionally gated on a server-side redirect integration,
 * which must be implemented against the provider's merchant API before launch —
 * until then they are never offered, even if keys are present.
 */
const ONLINE_INTEGRATION_READY: Record<Exclude<PaymentProvider, "COD">, boolean> = {
  CLICK: false,
  PAYME: false,
  UZUM: false,
};

export function availablePaymentMethods(settings: StoreSettings): PaymentProvider[] {
  const out: PaymentProvider[] = [];
  if (settings.payments.cod) out.push("COD");
  if (settings.payments.click && providerConfigured("CLICK") && ONLINE_INTEGRATION_READY.CLICK) out.push("CLICK");
  if (settings.payments.payme && providerConfigured("PAYME") && ONLINE_INTEGRATION_READY.PAYME) out.push("PAYME");
  if (settings.payments.uzum && providerConfigured("UZUM") && ONLINE_INTEGRATION_READY.UZUM) out.push("UZUM");
  return out;
}

export function paymentStatusReport() {
  return PAYMENT_PROVIDERS.map((p) => ({
    provider: p,
    configured: providerConfigured(p),
    integrationReady: p === "COD" ? true : ONLINE_INTEGRATION_READY[p],
  }));
}
