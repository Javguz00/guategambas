'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CartSummary from '@/components/cart/CartSummary';
import { Button, Input, Loading } from '@/components/ui';
import {
  PaymentMethod,
  type ApiResponse,
  type CartItem,
  type Order,
  type Product,
} from '@/lib/types';
import { readCart, writeCart } from '@/lib/cart';
import { validatePhone } from '@/lib/validators';

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  PaymentMethod.CONTRAENTREGA,
  PaymentMethod.DEPOSITO_PREVIO,
];

const WHATSAPP_NUMBER = '50243132549';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CONTRAENTREGA]: 'Contra entrega',
  [PaymentMethod.DEPOSITO_PREVIO]: 'Depósito previo',
  [PaymentMethod.TARJETA]: 'Tarjeta',
};

interface CheckoutFormState {
  customerName: string;
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
  customerPhone: '',
  city: '',
  department: '',
  address: '',
  notes: '',
  paymentMethod: PaymentMethod.CONTRAENTREGA,
});

const validateForm = (formData: CheckoutFormState, items: CheckoutDisplayItem[]) => {
  const errors: CheckoutFormErrors = {};

  if (items.length === 0) {
    errors.items = 'Tu carrito está vacío.';
  }

  if (formData.customerName.trim().length < 2) {
    errors.customerName = 'Ingresa el nombre del cliente.';
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

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = 0;
  const shipping = subtotal > 100 ? 0 : 50; // Free shipping over Q100

  const summaryItems = useMemo(() =>
    items.map((item) => ({
      id: item.variantKey || item.productId,
      name: item.grade
        ? `${item.product?.name || `Producto ${item.productId.slice(0, 8)}`} (${item.grade === 'NORMAL' ? 'Grado normal' : 'Grado alto'})`
        : item.product?.name || `Producto ${item.productId.slice(0, 8)}`,
      price: item.price,
      quantity: item.quantity,
      image: item.product?.image || undefined,
    })),
    [items]
  );

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoadingCart(true);
        setPageError(null);

        const normalizedItems = readCart().items;

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
      writeCart({ items: [] });
      return;
    }

    writeCart({
      items: items.map((item) => ({
        productId: item.productId,
        variantKey: item.variantKey,
        grade: item.grade,
        quantity: item.quantity,
        price: item.price,
      })),
    });
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

  const handleQuantityChange = (variantKey: string, quantityValue: string) => {
    const requestedQuantity = Number(quantityValue);

    setItems((currentItems) =>
      currentItems.map((item) => {
        if ((item.variantKey || item.productId) !== variantKey) {
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

  const handleRemoveItem = (variantKey: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => (item.variantKey || item.productId) !== variantKey)
    );
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

      let orderId = `TEMP-${Date.now()}`;

      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: formData.customerName.trim(),
            customerPhone: formData.customerPhone.trim(),
            city: formData.city.trim(),
            department: formData.department.trim() || null,
            address: formData.address.trim(),
            notes: formData.notes.trim() || null,
            paymentMethod: formData.paymentMethod,
            items: items.map((item) => ({
              productId: item.productId,
              grade: item.grade,
              quantity: item.quantity,
              price: item.price,
            })),
          }),
        });

        const result: ApiResponse<Order> = await response.json();
        if (response.ok && result.success && result.data) {
          orderId = result.data.id;
        } else if (response.status !== 503) {
          throw new Error(result.error || 'No se pudo completar la orden');
        }
      } catch (apiError) {
        if (apiError instanceof Error) {
          throw apiError;
        }
      }

      const paymentLabel = PAYMENT_METHOD_LABELS[formData.paymentMethod];
      const orderLines = items
        .map((item) => {
          const productName = item.product?.name || `Producto ${item.productId.slice(0, 8)}`;
          const gradeLabel = item.grade
            ? ` (${item.grade === 'NORMAL' ? 'Grado normal' : 'Grado alto'})`
            : '';
          return `- ${productName}${gradeLabel}: ${item.quantity} x Q${item.price.toFixed(2)} = Q${(item.quantity * item.price).toFixed(2)}`;
        })
        .join('\n');

      const whatsappMessage = [
        'Hola, quiero confirmar este pedido de Guategambas:',
        '',
        `Pedido: ${orderId}`,
        `Nombre: ${formData.customerName.trim()}`,
        `Teléfono: ${formData.customerPhone.trim()}`,
        `Ciudad: ${formData.city.trim()}`,
        `Departamento: ${formData.department.trim() || 'N/A'}`,
        `Dirección: ${formData.address.trim()}`,
        `Método de pago: ${paymentLabel}`,
        formData.notes.trim() ? `Notas: ${formData.notes.trim()}` : null,
        '',
        'Detalle:',
        orderLines,
        '',
        `Subtotal: Q${subtotal.toFixed(2)}`,
        `Envío: Q${shipping.toFixed(2)}`,
        `Total: Q${(subtotal + shipping).toFixed(2)}`,
      ]
        .filter((line) => line !== null)
        .join('\n');

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      writeCart({ items: [] });
      router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'No se pudo completar la orden');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCart) {
    return <Loading fullScreen text="Cargando carrito..." />;
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-dark mb-2">
              Carrito de compras
            </h1>
            <p className="text-gray-500">
              Revisa tu carrito y completa los datos para finalizar la compra.
            </p>
          </div>

          {pageError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft">
              ⚠ {pageError}
            </div>
          )}

          {/* Cart Table */}
          <div className="card overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-semibold text-dark">Productos</h2>
            </div>

            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
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
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, index) => (
                      <tr key={item.variantKey || item.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-dark">
                            {item.product?.name || `Producto ${item.productId.slice(0, 8)}`}
                          </div>
                          {item.grade && (
                            <div className="text-xs text-primary mt-1 font-medium">
                              {item.grade === 'NORMAL' ? 'Grado normal (-15%)' : 'Grado alto'}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {typeof item.product?.category === 'string' 
                              ? item.product.category 
                              : item.product?.category?.name || 'Sin categoría'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          Q{item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min={1}
                            max={item.product?.stock || undefined}
                            value={item.quantity}
                            onChange={(event) =>
                              handleQuantityChange(item.variantKey || item.productId, event.target.value)
                            }
                            className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-primary">
                          Q{(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRemoveItem(item.variantKey || item.productId)}
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
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
                <Button asChild>
                  <Link href="/products">Explorar productos</Link>
                </Button>
              </div>
            )}
          </div>

          {errors.items && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft">
              {errors.items}
            </div>
          )}

          {/* Checkout Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="card space-y-6">
            <h2 className="text-lg font-semibold text-dark">Información del envío</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Nombre completo"
                name="customerName"
                placeholder="Juan Pérez"
                value={formData.customerName}
                onChange={handleFieldChange}
                error={errors.customerName}
                required
              />
              <Input
                label="Teléfono"
                name="customerPhone"
                placeholder="+502 7XXX XXXX"
                value={formData.customerPhone}
                onChange={handleFieldChange}
                error={errors.customerPhone}
                required
              />
              <Input
                label="Ciudad"
                name="city"
                placeholder="Guatemala"
                value={formData.city}
                onChange={handleFieldChange}
                error={errors.city}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Departamento (opcional)"
                name="department"
                placeholder="Guatemala"
                value={formData.department}
                onChange={handleFieldChange}
              />
              <Input
                label="Dirección"
                name="address"
                placeholder="Calle Principal, Zona 10"
                value={formData.address}
                onChange={handleFieldChange}
                error={errors.address}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-dark">Método de pago</label>
              <div className="space-y-2">
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <label key={method} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={handleFieldChange}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm font-medium text-dark">{PAYMENT_METHOD_LABELS[method]}</span>
                  </label>
                ))}
              </div>
              {errors.paymentMethod && (
                <p className="text-sm text-red-600">{errors.paymentMethod}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Notas adicionales (opcional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFieldChange}
                rows={3}
                placeholder="Indicaciones de entrega, referencias, instrucciones especiales..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={items.length === 0 || submitting}
            >
              {submitting ? 'Enviando...' : 'Enviar pedido por WhatsApp'}
            </Button>
          </form>
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <CartSummary
              items={summaryItems}
              subtotal={subtotal}
              tax={tax}
              shipping={shipping}
              primaryActionLabel={submitting ? 'Enviando...' : 'Enviar pedido por WhatsApp'}
              primaryActionDisabled={items.length === 0 || submitting}
              onPrimaryAction={() => formRef.current?.requestSubmit()}
            />
            <div className="mt-4 card bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">✓ Envíos a todo Guatemala</span>
                <br />
                <span className="text-blue-700">Consulta disponibilidad en tu zona</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
