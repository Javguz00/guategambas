type RawOrderItem = {
  productId?: unknown;
  variantId?: unknown;
  name?: unknown;
  variantLabel?: unknown;
  category?: unknown;
  unit?: unknown;
  unitPrice?: unknown;
  quantity?: unknown;
};

export interface SanitizedOrderItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  category: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

export interface SanitizedOrderPayload {
  customerName: string;
  whatsapp: string;
  city: string;
  notes: string;
  items: SanitizedOrderItem[];
  total: number;
}

export function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeWhatsapp(value: unknown) {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return digits;
}

function normalizeNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : NaN;
}

function sanitizeItem(item: RawOrderItem): SanitizedOrderItem | null {
  const unitPrice = normalizeNumber(item.unitPrice);
  const quantity = normalizeNumber(item.quantity);

  const productId = cleanText(item.productId, 80);
  const variantId = cleanText(item.variantId, 80);
  const name = cleanText(item.name, 120);
  const variantLabel = cleanText(item.variantLabel, 80);
  const category = cleanText(item.category, 40);
  const unit = cleanText(item.unit, 40);

  if (!productId || !variantId || !name || !variantLabel || !category || !unit) {
    return null;
  }

  if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  return {
    productId,
    variantId,
    name,
    variantLabel,
    category,
    unit,
    unitPrice,
    quantity: Math.floor(quantity)
  };
}

export function sanitizeOrderPayload(body: unknown): SanitizedOrderPayload | null {
  if (!body || typeof body !== "object") return null;

  const candidate = body as {
    customerName?: unknown;
    whatsapp?: unknown;
    city?: unknown;
    notes?: unknown;
    items?: unknown;
    total?: unknown;
  };

  const customerName = cleanText(candidate.customerName, 80);
  const whatsapp = normalizeWhatsapp(candidate.whatsapp);
  const city = cleanText(candidate.city, 80);
  const notes = cleanText(candidate.notes, 240);
  const total = normalizeNumber(candidate.total);

  if (!customerName || !whatsapp || !city || !Array.isArray(candidate.items) || candidate.items.length === 0) {
    return null;
  }

  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }

  const items = candidate.items.map((item) => sanitizeItem(item as RawOrderItem));
  if (items.some((item) => item === null)) {
    return null;
  }

  return {
    customerName,
    whatsapp,
    city,
    notes,
    items: items as SanitizedOrderItem[],
    total
  };
}
