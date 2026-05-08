"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const statusOptions = ["PENDING", "CONFIRMED", "DELIVERED"] as const;
type OrderStatus = (typeof statusOptions)[number];

type PaymentMethod = "DEPOSITO_PREVIO" | "PAGO_CONTRAENTREGA" | "TARJETA_CUBO";
type PaymentStatus = "DRAFT" | "PENDING" | "PAID" | "FAILED" | "CANCELED";

type Order = {
  id: string;
  customerName: string;
  email?: string | null;
  whatsapp: string;
  city: string;
  departamento?: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  notes?: string | null;
  items: Array<{
    productId?: string;
    variantId?: string;
    packId?: string;
    name?: string;
    variantLabel?: string;
    category?: string;
    unit?: string;
    unitPrice?: number;
    quantity: number;
  }>;
  total: number;
  shippingCost: number;
  status: OrderStatus;
  createdAt: string;
};

function formatPaymentMethod(paymentMethod: PaymentMethod) {
  if (paymentMethod === "DEPOSITO_PREVIO") return "Depósito previo";
  if (paymentMethod === "TARJETA_CUBO") return "Tarjeta Cubo";
  return "Pago contra entrega";
}

function formatPaymentStatus(paymentStatus: PaymentStatus) {
  if (paymentStatus === "PAID") return "Pagado";
  if (paymentStatus === "FAILED") return "Fallido";
  if (paymentStatus === "CANCELED") return "Cancelado";
  if (paymentStatus === "PENDING") return "Pendiente";
  return "Borrador";
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("No se encontró el pedido.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOrder() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.status === 401) {
          throw new Error("Debes iniciar sesión en Admin para ver este pedido.");
        }
        if (!response.ok) {
          throw new Error("No se pudo cargar el pedido.");
        }

        const data = (await response.json()) as { order?: Order };
        if (!cancelled && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el pedido.");
          setOrder(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const subtotal = useMemo(() => {
    if (!order) return 0;
    return Number(order.total || 0) - Number(order.shippingCost || 0);
  }, [order]);

  async function updateOrderStatus(status: OrderStatus) {
    if (!order) return;

    setUpdatingId(status);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: order.id, status })
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar estado");
      }

      setOrder((current) => (current ? { ...current, status } : current));
    } catch {
      setError("No se pudo actualizar el estado del pedido.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="container section admin-shell">
      <div className="hero-bar">
        <div>
          <span className="badge">Detalle de pedido</span>
          <h1>Pedido {orderId}</h1>
          <p className="muted">Consulta la información completa y actualiza el estado sin salir del panel.</p>
        </div>
        <button type="button" className="secondary" onClick={() => router.push("/admin")}>Volver</button>
      </div>

      {loading ? <p className="muted">Cargando pedido...</p> : null}
      {error ? <p className="muted">{error}</p> : null}

      {!loading && order ? (
        <>
          <section className="section" style={{ paddingTop: 20 }}>
            <div className="grid" style={{ gap: 12 }}>
              <article className="card">
                <h3>Cliente</h3>
                <p className="muted">{order.customerName}</p>
                <p className="muted">WhatsApp: {order.whatsapp}</p>
                {order.email ? <p className="muted">Correo: {order.email}</p> : null}
                <p className="muted">Ciudad: {order.city}</p>
                {order.departamento ? <p className="muted">Departamento: {order.departamento}</p> : null}
              </article>

              <article className="card">
                <h3>Pago y entrega</h3>
                <p className="muted">Método: {formatPaymentMethod(order.paymentMethod)}</p>
                <p className="muted">Estado de pago: {formatPaymentStatus(order.paymentStatus)}</p>
                {order.paymentProvider ? <p className="muted">Proveedor: {order.paymentProvider}</p> : null}
                {order.paymentReference ? <p className="muted">Referencia: {order.paymentReference}</p> : null}
                <p className="muted">Estado del pedido: {order.status}</p>
                <p className="muted">Creado: {new Date(order.createdAt).toLocaleString()}</p>
              </article>

              <article className="card">
                <h3>Totales</h3>
                <p className="muted">Subtotal: Q {subtotal.toFixed(2)}</p>
                <p className="muted">Envío: Q {Number(order.shippingCost || 0).toFixed(2)}</p>
                <p className="cart-total">Total: Q {Number(order.total || 0).toFixed(2)}</p>
              </article>
            </div>
          </section>

          <section className="section" style={{ paddingTop: 0 }}>
            <div className="card">
              <div className="actions" style={{ alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>Acciones de estado</h3>
                <span className="muted">Actualiza sin recargar el panel</span>
              </div>
              <div className="actions" style={{ marginTop: 12 }}>
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={status === order.status ? "secondary" : ""}
                    disabled={updatingId === status || status === order.status}
                    onClick={() => updateOrderStatus(status)}
                  >
                    {updatingId === status ? "Guardando..." : status}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="section" style={{ paddingTop: 0 }}>
            <div className="card">
              <h3>Productos</h3>
              <ul>
                {order.items.map((item, index) => {
                  const label = item.variantLabel ? `${item.name || item.productId || "Producto"} - ${item.variantLabel}` : item.name || item.productId || "Producto";
                  const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
                  return (
                    <li key={`${order.id}-${index}`} style={{ marginBottom: 12 }}>
                      <strong>{label}</strong>
                      <p className="muted">
                        Cantidad: {item.quantity} · Precio unitario: Q {Number(item.unitPrice || 0).toFixed(2)} · Total: Q {lineTotal.toFixed(2)}
                      </p>
                    </li>
                  );
                })}
              </ul>
              {order.notes ? <p className="muted">Notas: {order.notes}</p> : null}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
