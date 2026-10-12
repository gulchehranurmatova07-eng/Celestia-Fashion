import "server-only";

type L = "en" | "ru" | "uz";

const STATUS: Record<L, Record<string, string>> = {
  en: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "being prepared",
    SHIPPED: "on its way",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  },
  ru: {
    PENDING: "ожидает подтверждения",
    CONFIRMED: "подтверждён",
    PROCESSING: "собирается",
    SHIPPED: "в пути",
    DELIVERED: "доставлен",
    CANCELLED: "отменён",
  },
  uz: {
    PENDING: "kutilmoqda",
    CONFIRMED: "tasdiqlandi",
    PROCESSING: "tayyorlanmoqda",
    SHIPPED: "yo‘lda",
    DELIVERED: "yetkazildi",
    CANCELLED: "bekor qilindi",
  },
};

/** Localised status-update email (falls back to English). */
export function orderStatusEmail(locale: string, number: string, name: string, status: string) {
  const l: L = locale === "ru" || locale === "uz" ? locale : "en";
  const s = STATUS[l][status] ?? status.toLowerCase();
  if (l === "ru") {
    return {
      subject: `CELESTIA — заказ ${number}: ${s}`,
      body: `Здравствуйте, ${name}!\n\nСтатус вашего заказа ${number} изменён: ${s}.\n\nЕсли у вас есть вопросы, просто ответьте на это письмо.\n\nCELESTIA`,
    };
  }
  if (l === "uz") {
    return {
      subject: `CELESTIA — ${number} buyurtma: ${s}`,
      body: `Assalomu alaykum, ${name}!\n\n${number} raqamli buyurtmangiz holati yangilandi: ${s}.\n\nSavollaringiz bo‘lsa, ushbu xatga javob yozing.\n\nCELESTIA`,
    };
  }
  return {
    subject: `CELESTIA — order ${number} is ${s}`,
    body: `Dear ${name},\n\nThe status of your order ${number} has been updated: it is now ${s}.\n\nIf you have any questions, simply reply to this email.\n\nCELESTIA`,
  };
}
