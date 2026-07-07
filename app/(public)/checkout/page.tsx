'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CartSummary from '@/app/components/cart/CartSummary';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Loading from '@/app/components/ui/Loading';
import {
  PaymentMethod,
  type ApiResponse,
  type CartItem,
  type Order,
  type Product,
} from '@/lib/types';
import { validateEmail, validatePhone } from '@/lib/validators';

const CART_STORAGE_KEY = 'cart';

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  PaymentMethod.CONTRAENTREGA,
  PaymentMethod.DEPOSITO_PREVIO,
  PaymentMethod.TARJETA,
];

interface CheckoutFormState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  department: string;
  address: string;
  notes: string;
  paymentMethod: PaymentMethod;
}

type CheckoutFormErrors = Partial<Record<keyof CheckoutFormState | 'items', string>>;

interface CheckoutDisplayItem extends CartItem {
  product?: Product | null;
}

const getInitialFormState = (): CheckoutFormState => ({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  city: '',
  department: '',
  address: '',
  notes: '',
  paymentMethod: PaymentMethod.CONTRAENTREGA,
});

const currencyFormatter = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

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

const validateForm = (formData: CheckoutFormState, items: CheckoutDisplayItem[]) => {
  const errors: CheckoutFormErrors = {};

  if (items.length === 0) {
    errors.items = 'Tu carrito está vacío.';
  }

  if (formData.customerName.trim().length < 2) {
    errors.customerName = 'Ingresa el nombre del cliente.';
  }

  if (!validateEmail(formData.customerEmail.trim())) {
    errors.customerEmail = 'Ingresa un correo válido.';
  }

  if (!validatePhone(formData.customerPhone.trim())) {
    errors.customerPhone = 'Ingresa un teléfono válido.';
  }

  if (formData.city.trim().length === 0) {
    errors.city = 'La ciudad es requerida.';
  }

  if (formData.address.trim().length === 0) {
    errors.address = 'La dirección es requerida.';
  }

  if (!PAYMENT_METHOD_OPTIONS.includes(formData.paymentMethod)) {
    errors.paymentMethod = 'Selecciona un método de pago válido.';
  }

  return errors;
};

export default function CheckoutPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [items, setItems] = useState<CheckoutDisplayItem[]>([]);
  const [formData, setFormData] = useState<CheckoutFormState>(getInitialFormState);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const summaryItems = useMemo<CartItem[]>(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    [items]
  );

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoadingCart(true);
        setPageError(null);

        const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
        const parsedCart = rawCart ? JSON.parse(rawCart) : [];
        const normalizedItems = normalizeCartItems(parsedCart);

        if (normalizedItems.length === 0) {
          setItems([]);
          return;
        }

        const productResponses = await Promise.all(
          normalizedItems.map(async (item) => {
            try {
              const response = await fetch(`/api/products/${item.productId}`, { cache: 'no-store' });
              if (!response.ok) {
                return null;
              }

              const result: ApiResponse<Product> = await response.json();
              return result.success ? result.data || null : null;
            } catch {
              return null;
            }
          })
        );

        const productsById = new Map(
          productResponses.filter((product): product is Product => product !== null).map((product) => [
            product.id,
            product,
          ])
        );

        setItems(
          normalizedItems.map((item) => ({
            ...item,
            product: productsById.get(item.productId) || null,
          }))
        );
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'No se pudo cargar el carrito');
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  useEffect(() => {
    if (loadingCart) {
      return;
    }

    if (items.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        }))
      )
    );
  }, [items, loadingCart]);

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
    setPageError(null);
  };

  const handleQuantityChange = (productId: string, quantityValue: string) => {
    const requestedQuantity = Number(quantityValue);

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const maxStock = item.product?.stock ?? Number.MAX_SAFE_INTEGER;
        const nextQuantity = Number.isNaN(requestedQuantity)
          ? item.quantity
          : Math.min(Math.max(1, Math.floor(requestedQuantity)), maxStock);

        return {
          ...item,
          quantity: nextQuantity,
        };
      })
    );
    setErrors((currentErrors) => ({
      ...currentErrors,
      items: undefined,
    }));
  };

  const handleRemoveItem = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateForm(formData, items);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      setPageError(null);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName.trim(),
          customerEmail: formData.customerEmail.trim(),
          customerPhone: formData.customerPhone.trim(),
          city: formData.city.trim(),
          department: formData.department.trim() || null,
          address: formData.address.trim(),
          notes: formData.notes.trim() || null,
          paymentMethod: formData.paymentMethod,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const result: ApiResponse<Order> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'No se pudo completar la orden');
      }

      window.localStorage.removeItem(CART_STORAGE_KEY);
      router.push(`/checkout/success?orderId=${result.data.id}`);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'No se pudo completar la orden');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCart) {
    return <Loading size="lg" message="Cargando carrito..." />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500">
            Revisa tu carrito y completa los datos para finalizar la compra.
          </p>
        </div>

        {pageError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold">Carrito</h2>
          </div>

          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Subtotal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {item.product?.name || `Producto ${item.productId.slice(0, 8)}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.product?.category?.name || 'Sin categoría'}
                        </div>
                      </td>
                      <td className="px-6 py-4">{currencyFormatter.format(item.price)}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min={1}
                          max={item.product?.stock || undefined}
                          value={item.quantity}
                          onChange={(event) => handleQuantityChange(item.productId, event.target.value)}
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {item.product && item.product.stock > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            Stock disponible: {item.product.stock}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {currencyFormatter.format(item.price * item.quantity)}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-gray-500">Tu carrito está vacío.</div>
          )}
        </div>

        {errors.items && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.items}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="rounded-lg bg-white p-8 shadow">
          <h2 className="mb-6 text-xl font-semibold">Información del cliente</h2>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              label="Nombre"
              name="customerName"
              value={formData.customerName}
              onChange={handleFieldChange}
              error={errors.customerName}
              required
            />
            <Input
              label="Email"
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleFieldChange}
              error={errors.customerEmail}
              required
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              label="Teléfono"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleFieldChange}
              error={errors.customerPhone}
              required
            />
            <Input
              label="Ciudad"
              name="city"
              value={formData.city}
              onChange={handleFieldChange}
              error={errors.city}
              required
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              label="Departamento"
              name="department"
              value={formData.department}
              onChange={handleFieldChange}
            />
            <Input
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={handleFieldChange}
              error={errors.address}
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Método de pago</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleFieldChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAYMENT_METHOD_OPTIONS.map((paymentMethodOption) => (
                <option key={paymentMethodOption} value={paymentMethodOption}>
                  {paymentMethodOption}
                </option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-red-500">{errors.paymentMethod}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFieldChange}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Indicaciones de entrega, referencias, etc."
            />
          </div>

          <Button type="submit" size="lg" variant="primary" isLoading={submitting} disabled={items.length === 0}>
            Confirmar pedido
          </Button>
        </form>
      </div>

      <div>
        <CartSummary items={summaryItems} onContinue={() => formRef.current?.requestSubmit()} />
      </div>
    </div>
  );
}
