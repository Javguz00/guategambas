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

type CatalogVariant = {
  id: string;
  label: string;
  stockAvailable?: number | null;
  isActive?: boolean;
};

type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  variants: CatalogVariant[];
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [savingVariantKey, setSavingVariantKey] = useState("");

  async function loadOrders(filters?: { city?: string; from?: string; to?: string }) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters?.city) params.set("city", filters.city);
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      const response = await fetch(`/api/orders?${params.toString()}`);
      if (response.status === 401) {
        setAuthenticated(false);
        setOrders([]);
        setError("Ingresa la contraseña para ver pedidos.");
        return;
      }
      if (!response.ok) throw new Error("No se pudo cargar pedidos");
      const data = (await response.json()) as { orders: Order[] };
      setOrders(data.orders);
      setAuthenticated(true);
    } catch {
      setError("No se pudo cargar pedidos. Revisa la DB o filtros.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCatalog() {
    try {
      const response = await fetch("/api/catalog");
      if (!response.ok) return;

      const data = (await response.json()) as { products?: CatalogProduct[] };
      if (Array.isArray(data.products)) {
        setCatalog(data.products);
      }
    } catch {
      setCatalog([]);
    }
  }

  useEffect(() => {
    void loadOrders();
    void loadCatalog();
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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        throw new Error("Contraseña invalida");
      }

      setAuthenticated(true);
      setPassword("");
      await loadOrders({ city, from, to });
    } catch {
      setAuthenticated(false);
      setOrders([]);
      setError("Contraseña incorrecta. Vuelve a intentar.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setOrders([]);
    setPassword("");
    setCity("");
    setFrom("");
    setTo("");
    setError("");
  }

  async function saveVariantState(productId: string, variantId: string) {
    const key = `${productId}:${variantId}`;
    const variantInput = document.getElementById(`${key}-stock`) as HTMLInputElement | null;
    const activeInput = document.getElementById(`${key}-active`) as HTMLInputElement | null;
    const stockValue = variantInput?.value ?? "";
    const isActive = activeInput?.checked ?? true;

    setSavingVariantKey(key);
    setError("");

    try {
      const response = await fetch("/api/catalog", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId,
          variantId,
          stockAvailable: stockValue === "" ? null : Number(stockValue),
          isActive
        })
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar inventario");
      }

      await loadCatalog();
    } catch {
      setError("No se pudo guardar el estado del inventario.");
    } finally {
      setSavingVariantKey("");
    }
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
    <main className="container section admin-shell">
      <div className="hero-bar">
        <div>
          <span className="badge">Acceso privado</span>
          <h1>GuateGambas Admin</h1>
          <p className="muted">Panel privado para revisar pedidos, filtrar y cambiar estados.</p>
        </div>
        {authenticated ? (
          <button type="button" className="secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        ) : null}
      </div>

      {!authenticated ? (
        <form className="card admin-login" onSubmit={handleLogin}>
          <h3>Ingresar contraseña</h3>
          <p className="muted">Solo tú puedes ver y administrar los pedidos.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña del admin"
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={authLoading}>
            {authLoading ? "Validando..." : "Entrar"}
          </button>
          {error ? <p className="muted">{error}</p> : null}
        </form>
      ) : (
        <>
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

          <section className="section" style={{ paddingTop: 0 }}>
            <div className="card">
              <h3>Inventario del catálogo</h3>
              <p className="muted">Marca una variante como agotada o desactívala cuando ya no esté disponible.</p>
            </div>

            <div className="grid" style={{ gap: 12, marginTop: 12 }}>
              {catalog.flatMap((product) =>
                product.variants.map((variant) => {
                  const key = `${product.id}:${variant.id}`;
                  return (
                    <article key={key} className="card">
                      <h3>{product.name}</h3>
                      <p className="muted">{variant.label}</p>
                      <div className="actions" style={{ alignItems: "center" }}>
                        <input
                          id={`${key}-stock`}
                          type="number"
                          min="0"
                          defaultValue={variant.stockAvailable ?? ""}
                          placeholder="Sin límite"
                          aria-label={`Stock para ${product.name} ${variant.label}`}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            id={`${key}-active`}
                            type="checkbox"
                            defaultChecked={variant.isActive !== false}
                          />
                          Disponible
                        </label>
                        <button
                          type="button"
                          disabled={savingVariantKey === key}
                          onClick={() => saveVariantState(product.id, variant.id)}
                        >
                          {savingVariantKey === key ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
