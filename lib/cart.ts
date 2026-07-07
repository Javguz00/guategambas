import type { Cart, CartItem } from './types';

export const CART_STORAGE_KEY = 'cart';

interface StoredCart {
  items: CartItem[];
}

const EMPTY_CART: StoredCart = {
  items: [],
};

const normalizeCartItems = (value: unknown): CartItem[] => {
  const items = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { items?: unknown[] }).items)
      ? (value as { items: unknown[] }).items
      : [];

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Partial<CartItem>;
      const quantity = Number(candidate.quantity);
      const price = Number(candidate.price);

      if (
        typeof candidate.productId !== 'string' ||
        candidate.productId.trim().length === 0 ||
        Number.isNaN(quantity) ||
        Number.isNaN(price)
      ) {
        return null;
      }

      return {
        productId: candidate.productId,
        quantity: Math.max(1, Math.floor(quantity)),
        price: Math.max(0, price),
      };
    })
    .filter((item): item is CartItem => item !== null);
};

export function readCart(): StoredCart {
  if (typeof window === 'undefined') {
    return EMPTY_CART;
  }

  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      return EMPTY_CART;
    }

    return {
      items: normalizeCartItems(JSON.parse(rawCart)),
    };
  } catch {
    return EMPTY_CART;
  }
}

export function writeCart(cart: StoredCart): StoredCart {
  const normalizedCart = {
    items: normalizeCartItems(cart),
  };

  if (typeof window !== 'undefined') {
    if (normalizedCart.items.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedCart));
    }
  }

  return normalizedCart;
}

export function addToCart(
  item: CartItem,
  options?: {
    maxStock?: number;
  }
): StoredCart {
  const currentCart = readCart();
  const existingItem = currentCart.items.find((cartItem) => cartItem.productId === item.productId);
  const nextQuantity = (existingItem?.quantity || 0) + Math.max(1, Math.floor(item.quantity));
  const cappedQuantity = options?.maxStock
    ? Math.min(nextQuantity, Math.max(1, options.maxStock))
    : nextQuantity;

  const nextItems = existingItem
    ? currentCart.items.map((cartItem) =>
        cartItem.productId === item.productId
          ? {
              ...cartItem,
              quantity: cappedQuantity,
              price: item.price,
            }
          : cartItem
      )
    : [
        ...currentCart.items,
        {
          ...item,
          quantity: cappedQuantity,
        },
      ];

  return writeCart({ items: nextItems });
}

export function toCartSummary(items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    subtotal,
    shippingCost: 0,
    total: subtotal,
  };
}
