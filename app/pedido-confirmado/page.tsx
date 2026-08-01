"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const LAST_ORDER_STORAGE_KEY = "gg_last_order_v1";

type ConfirmedItem = {
  productId?: string;
  variantId?: string;
  name?: string;
  variantLabel?: string;
  quantity: number;
  unitPrice?: number;
};

type StoredOrderSummary = {
  orderId?: string;
  payload?: {
    customerName?: string;
    whatsapp?: string;
    city?: string;
    departamento?: string;
    paymentMethod?: string;
    notes?: string;
    items?: ConfirmedItem[];
    total?: number;
    shippingCost?: number;
  };
  finalTotal?: number;
  whatsappUrl?: string;
  createdAt?: string;
  shippingMessage?: string;
};

export default function PedidoConfirmadoPage() {
  const [summary, setSummary] = useState<StoredOrderSummary | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_ORDER_STORAGE_KEY);
      if (raw) {
        setSummary(JSON.parse(raw) as StoredOrderSummary);
      }
    } catch {
      setSummary(null);
    }
  }, []);

  const items = useMemo(() => summary?.payload?.items || [], [summary]);
  const shippingCost = summary?.payload?.shippingCost || 0;
  const orderTotal = summary?.finalTotal ?? ((summary?.payload?.total || 0) + shippingCost);

  return (
    <main className="container section" style={{ paddingTop: 24, paddingBottom: 32 }}>
      <article className="card" style={{ display: "grid", gap: 16 }}>
        <span className="badge">Pedido registrado</span>
        <h1 style={{ margin: 0 }}>¡Gracias por tu compra!</h1>
        <p className="muted" style={{ margin: 0 }}>
          Tu pedido quedó guardado y el resumen también se usó para abrir WhatsApp.
        </p>

        <div className="summary-card accent-card" style={{ gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Resumen</h2>
          {summary?.orderId ? <p className="muted" style={{ margin: 0 }}>Código de pedido: {summary.orderId}</p> : null}
          {summary?.payload?.customerName ? <p className="muted" style={{ margin: 0 }}>Cliente: {summary.payload.customerName}</p> : null}
          {summary?.payload?.whatsapp ? <p className="muted" style={{ margin: 0 }}>WhatsApp: {summary.payload.whatsapp}</p> : null}
          {summary?.payload?.city ? <p className="muted" style={{ margin: 0 }}>Dirección: {summary.payload.city}</p> : null}
          {summary?.payload?.departamento ? <p className="muted" style={{ margin: 0 }}>Departamento: {summary.payload.departamento}</p> : null}
          {summary?.payload?.paymentMethod ? <p className="muted" style={{ margin: 0 }}>Pago: {summary.payload.paymentMethod === "DEPOSITO_PREVIO" ? "Depósito previo" : "Pago contra entrega"}</p> : null}
          <p className="muted" style={{ margin: 0 }}>Subtotal: Q {(summary?.payload?.total || 0).toFixed(2)}</p>
          <p className="muted" style={{ margin: 0 }}>Envío: Q {shippingCost.toFixed(2)}</p>
          <p style={{ margin: 0, fontWeight: 800 }}>Total: Q {orderTotal.toFixed(2)}</p>
        </div>

        {items.length > 0 ? (
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Productos</h3>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
              {items.map((item, index) => (
                <li key={`${item.productId || item.name || "item"}-${index}`}>
                  {item.name || "Producto"}{item.variantLabel ? ` - ${item.variantLabel}` : ""} x {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="checkout-link" href="/">
            Volver a la tienda
          </Link>
          <Link className="secondary" href="/products" style={{ textDecoration: "none", textAlign: "center" }}>
            Seguir comprando
          </Link>
        </div>
      </article>
    </main>
  );
}
