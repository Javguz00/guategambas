// Caridinas (gambitas) que no pueden ser enviadas por paquetería
const SHRIMP_PRODUCT_IDS = ["golden-bee", "tai-bee-spotted-head", "crs", "taiwan-cbs"];

export type ShippingResult = {
  isValid: boolean;
  shippingCost: number;
  message?: string;
};

export type ShippingInput = {
  departamento?: string;
  paymentMethod: "DEPOSITO_PREVIO" | "PAGO_CONTRAENTREGA";
  orderTotal: number;
  cartItems: Array<{ productId: string; variantId: string; quantity: number; price: number }>;
};

export function calculateShipping(input: ShippingInput): ShippingResult {
  const { departamento, paymentMethod, orderTotal, cartItems } = input;

  // Verificar si hay gambitas en el carrito
  const hasShrimp = cartItems.some((item) => SHRIMP_PRODUCT_IDS.includes(item.productId));

  // Si hay gambitas y no es Guatemala, rechazar
  if (hasShrimp && departamento && departamento.toLowerCase() !== "guatemala") {
    return {
      isValid: false,
      shippingCost: 0,
      message: "Las caridinas (gambitas) no pueden ser enviadas a otros departamentos por paquetería."
    };
  }

  // Si es Guatemala, no hay cargo de envío
  if (!departamento || departamento.toLowerCase() === "guatemala") {
    return {
      isValid: true,
      shippingCost: 0,
      message: undefined
    };
  }

  // Si es otro departamento con depósito previo, sin cargo (paga precio catálogo)
  if (paymentMethod === "DEPOSITO_PREVIO") {
    return {
      isValid: true,
      shippingCost: 0,
      message: "Deposito previo - Sin cargo de envío"
    };
  }

  // Si es otro departamento con pago contra entrega, agregar 3.8%
  if (paymentMethod === "PAGO_CONTRAENTREGA") {
    const surcharge = orderTotal * 0.038;
    return {
      isValid: true,
      shippingCost: parseFloat(surcharge.toFixed(2)),
      message: `Pago contra entrega - Cargo de envío (3.8%): Q ${surcharge.toFixed(2)}`
    };
  }

  return {
    isValid: true,
    shippingCost: 0,
    message: undefined
  };
}

export function getShimpProductIds(): string[] {
  return SHRIMP_PRODUCT_IDS;
}
