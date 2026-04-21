"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const statusOptions = ["PENDING", "CONFIRMED", "DELIVERED"] as const;
type OrderStatus = (typeof statusOptions)[number];

type Order = {
  id: string;
  customerName: string;
  whatsapp: string;
  city: string;
  notes?: string;
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
  status: OrderStatus;
  createdAt: string;
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  async function loadOrders(filters?: { city?: string; from?: string; to?: string }) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters?.city) params.set("city", filters.city);
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) throw new Error("No se pudo cargar pedidos");
      const data = (await response.json()) as { orders: Order[] };
      setOrders(data.orders);
    } catch {
      setError("No se pudo cargar pedidos. Revisa la DB o filtros.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadOrders({ city, from, to });
  }

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  function formatOrderItem(item: Order["items"][number]) {
    const baseName = item.name || item.productId || item.packId || "Producto";
    if (!item.variantLabel) return baseName;
    return `${baseName} - ${item.variantLabel}`;
  }

  async function updateOrderStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id, status })
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar estado");
      }

      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    } catch {
      setError("No se pudo actualizar estado del pedido.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="container section">
      <h1>Admin - Pedidos</h1>
      <p className="muted">Panel de practica para filtrar y revisar pedidos registrados.</p>

      <form className="card order-form" onSubmit={handleFilter}>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Filtrar por ciudad"
        />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <div className="actions">
          <button type="submit">Aplicar filtros</button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setCity("");
              setFrom("");
              setTo("");
              void loadOrders();
            }}
          >
            Limpiar
          </button>
        </div>
      </form>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="card">
          <h3>Resumen</h3>
          <p className="muted">Pedidos: {orders.length}</p>
          <p className="cart-total">Ingresos estimados: Q {totalRevenue.toFixed(2)}</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        {loading ? <p className="muted">Cargando pedidos...</p> : null}
        {error ? <p className="muted">{error}</p> : null}
        {!loading && !error ? (
          <div className="grid" style={{ gap: 12 }}>
            {orders.map((order) => (
              <article key={order.id} className="card">
                <h3>{order.customerName}</h3>
                <p className="muted">
                  {order.city} · {order.whatsapp}
                </p>
                <p className="muted">Estado: {order.status}</p>
                <p className="muted">Fecha: {new Date(order.createdAt).toLocaleString()}</p>
                <p>Total: Q {Number(order.total || 0).toFixed(2)}</p>
                <div className="actions">
                  {statusOptions.map((status) => (
                    <button
                      key={`${order.id}-${status}`}
                      type="button"
                      className={status === order.status ? "secondary" : ""}
                      disabled={updatingId === order.id || status === order.status}
                      onClick={() => updateOrderStatus(order.id, status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <ul>
                  {Array.isArray(order.items)
                    ? order.items.map((item, idx) => (
                        <li key={`${order.id}-${idx}`}>
                          {formatOrderItem(item)} x {item.quantity}
                        </li>
                      ))
                    : null}
                </ul>
                {order.notes ? <p className="muted">Notas: {order.notes}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
