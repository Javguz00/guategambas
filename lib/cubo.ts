export type CuboConfig = {
  apiBaseUrl: string;
  checkoutUrl: string;
  apiKey: string;
  publicKey: string;
  merchantId: string;
  webhookSecret: string;
};

export type CuboCheckoutRequest = {
  orderId?: string;
  amount: number;
  currency: string;
  customerName: string;
  customerWhatsapp: string;
  metadata?: Record<string, unknown>;
};

export function getCuboConfig(): CuboConfig {
  return {
    apiBaseUrl: process.env.CUBO_API_BASE_URL?.trim() || "",
    checkoutUrl: process.env.CUBO_CHECKOUT_URL?.trim() || "",
    apiKey: process.env.CUBO_API_KEY?.trim() || "",
    publicKey: process.env.CUBO_PUBLIC_KEY?.trim() || "",
    merchantId: process.env.CUBO_MERCHANT_ID?.trim() || "",
    webhookSecret: process.env.CUBO_WEBHOOK_SECRET?.trim() || ""
  };
}

export function isCuboReady(config: CuboConfig = getCuboConfig()) {
  return Boolean(config.checkoutUrl || (config.apiBaseUrl && config.apiKey && config.merchantId));
}

export function getCuboReadinessMessage(config: CuboConfig = getCuboConfig()) {
  if (isCuboReady(config)) {
    return "Cubo está configurado para continuar con la integración.";
  }

  return "Cubo aún no está configurado. Falta cargar la API, keys y URL de checkout.";
}