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
  priceOverride?: number | null;
  gradeLabel?: string;
  price: number;
};

type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  variants: CatalogVariant[];
};

type CrmProduct = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  basePrice: number;
  stock?: number | null;
  active: boolean;
  gradeLabel?: string | null;
  unitLabel?: string | null;
  notes?: string | null;
  updatedAt: string;
};

type CatalogDraft = {
  stockAvailable: string;
  priceOverride: string;
  isActive: boolean;
};

type CrmDraft = {
  name: string;
  category: string;
  description: string;
  basePrice: string;
  stock: string;
  active: boolean;
  gradeLabel: string;
  unitLabel: string;
  notes: string;
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [crmProducts, setCrmProducts] = useState<CrmProduct[]>([]);

  const [catalogDrafts, setCatalogDrafts] = useState<Record<string, CatalogDraft>>({});
  const [catalogDirty, setCatalogDirty] = useState<Record<string, true>>({});
  const [crmDrafts, setCrmDrafts] = useState<Record<string, CrmDraft>>({});
  const [crmDirty, setCrmDirty] = useState<Record<string, true>>({});

  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [savingCrm, setSavingCrm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadOrders(filters?: { city?: string; from?: string; to?: string; q?: string; paymentMethod?: string }) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters?.city) params.set("city", filters.city);
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      if (filters?.q) params.set("q", filters.q);
      if (filters?.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
      const response = await fetch(`/api/orders?${params.toString()}`);
      if (response.status === 401) {
        setAuthenticated(false);
        setOrders([]);
        setError("Ingresa la contraseña para ver pedidos.");
        return;
      }
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `No se pudo cargar pedidos (${response.status})`);
      }
      const data = (await response.json()) as { orders: Order[] };
      setOrders(data.orders);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar pedidos.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function toCatalogDraftMap(products: CatalogProduct[]) {
    const next: Record<string, CatalogDraft> = {};
    products.forEach((product) => {
      product.variants.forEach((variant) => {
        const key = `${product.id}:${variant.id}`;
        next[key] = {
          stockAvailable: variant.stockAvailable === null || variant.stockAvailable === undefined ? "" : String(variant.stockAvailable),
          priceOverride: variant.priceOverride === null || variant.priceOverride === undefined ? String(variant.price) : String(variant.priceOverride),
          isActive: variant.isActive !== false
        };
      });
    });
    return next;
  }

  function toCrmDraftMap(products: CrmProduct[]) {
    const next: Record<string, CrmDraft> = {};
    products.forEach((product) => {
      next[product.id] = {
        name: product.name,
        category: product.category,
        description: product.description || "",
        basePrice: String(product.basePrice),
        stock: product.stock === null || product.stock === undefined ? "" : String(product.stock),
        active: product.active,
        gradeLabel: product.gradeLabel || "",
        unitLabel: product.unitLabel || "",
        notes: product.notes || ""
      };
    });
    return next;
  }

  async function loadCatalog() {
    try {
      const response = await fetch("/api/catalog");
      if (!response.ok) return;
      const data = (await response.json()) as { products?: CatalogProduct[] };
      if (Array.isArray(data.products)) {
        setCatalog(data.products);
        setCatalogDrafts(toCatalogDraftMap(data.products));
        setCatalogDirty({});
      }
    } catch {
      setCatalog([]);
      setCatalogDrafts({});
      setCatalogDirty({});
    }
  }

  async function loadCrmProducts() {
    try {
      const response = await fetch("/api/crm/products");
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as { products?: CrmProduct[] };
      if (Array.isArray(data.products)) {
        setCrmProducts(data.products);
        setCrmDrafts(toCrmDraftMap(data.products));
        setCrmDirty({});
      }
    } catch {
      setCrmProducts([]);
      setCrmDrafts({});
      setCrmDirty({});
    }
  }

  useEffect(() => {
    void loadOrders({ q, paymentMethod: paymentMethodFilter || undefined });
    void loadCatalog();
    void loadCrmProducts();
  }, [q, paymentMethodFilter]);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadOrders({ city, from, to, q, paymentMethod: paymentMethodFilter || undefined });
  }

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders]);

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "PENDING").length, [orders]);

  const catalogDirtyCount = useMemo(() => Object.keys(catalogDirty).length, [catalogDirty]);
  const crmDirtyCount = useMemo(() => Object.keys(crmDirty).length, [crmDirty]);

  function formatOrderItem(item: Order["items"][number]) {
    const baseName = item.name || item.productId || item.packId || "Producto";
    if (!item.variantLabel) return baseName;
    return `${baseName} - ${item.variantLabel}`;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!response.ok) throw new Error("Contraseña invalida");
      setAuthenticated(true);
      setPassword("");
      await loadOrders({ city, from, to, q, paymentMethod: paymentMethodFilter || undefined });
      await Promise.all([loadCatalog(), loadCrmProducts()]);
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
    setQ("");
    setPaymentMethodFilter("");
    setError("");
    setNotice("");
  }

  function markCatalogDraft(productId: string, variantId: string, changes: Partial<CatalogDraft>) {
    const key = `${productId}:${variantId}`;
    setCatalogDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || { stockAvailable: "", priceOverride: "", isActive: true }), ...changes } }));
    setCatalogDirty((prev) => ({ ...prev, [key]: true }));
  }

  async function saveAllCatalogChanges() {
    const dirtyKeys = Object.keys(catalogDirty);
    if (dirtyKeys.length === 0) {
      setNotice("No hay cambios pendientes en inventario.");
      setError("");
      return;
    }
    setSavingCatalog(true);
    setError("");
    setNotice("");
    try {
      for (const key of dirtyKeys) {
        const [productId, variantId] = key.split(":");
        const draft = catalogDrafts[key];
        if (!productId || !variantId || !draft) continue;
        const response = await fetch("/api/catalog", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, variantId, stockAvailable: draft.stockAvailable === "" ? null : Number(draft.stockAvailable), isActive: draft.isActive, priceOverride: draft.priceOverride === "" ? null : Number(draft.priceOverride) }) });
        if (!response.ok) throw new Error(`No se pudo guardar variante ${variantId}`);
      }
      await loadCatalog();
      setNotice(`Inventario actualizado (${dirtyKeys.length} cambios).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar inventario.");
    } finally {
      setSavingCatalog(false);
    }
  }

  function markCrmDraft(productId: string, changes: Partial<CrmDraft>) {
    setCrmDrafts((prev) => ({ ...prev, [productId]: { ...(prev[productId] || { name: "", category: "", description: "", basePrice: "", stock: "", active: true, gradeLabel: "", unitLabel: "", notes: "" }), ...changes } }));
    setCrmDirty((prev) => ({ ...prev, [productId]: true }));
  }

  async function saveAllCrmChanges() {
    const dirtyIds = Object.keys(crmDirty);
    if (dirtyIds.length === 0) {
      setNotice("No hay cambios pendientes en productos CRM.");
      setError("");
      return;
    }
    setSavingCrm(true);
    setError("");
    setNotice("");
    try {
      for (const id of dirtyIds) {
        const draft = crmDrafts[id];
        if (!draft) continue;
        const response = await fetch("/api/crm/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: draft.name, category: draft.category, description: draft.description, basePrice: Number(draft.basePrice), stock: draft.stock === "" ? null : Number(draft.stock), active: draft.active, gradeLabel: draft.gradeLabel, unitLabel: draft.unitLabel, notes: draft.notes }) });
        if (!response.ok) throw new Error(`No se pudo guardar ${draft.name || id}`);
      }
      await loadCrmProducts();
      setNotice(`Productos CRM actualizados (${dirtyIds.length} cambios).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar productos CRM.");
    } finally {
      setSavingCrm(false);
    }
  }

  async function updateOrderStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (!response.ok) throw new Error("No se pudo actualizar estado");
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
      setNotice(`Pedido ${id.slice(0, 8)} actualizado a ${status}.`);
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
          <h1>Dashboard Admin</h1>
          <p className="muted">Control de pedidos, inventario y productos CRM desde un solo panel.</p>
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
          <p className="muted">Solo tú puedes ver y administrar esta información.</p>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña del admin" autoComplete="current-password" required />
          <button type="submit" disabled={authLoading}>
            {authLoading ? "Validando..." : "Entrar"}
          </button>
          {error ? <p className="muted">{error}</p> : null}
        </form>
      ) : (
        <>
          <section className="grid admin-kpi-grid">
            <article className="card admin-kpi">
              <p className="muted">Pedidos totales</p>
              <strong>{orders.length}</strong>
            </article>
            <article className="card admin-kpi">
              <p className="muted">Pendientes</p>
              <strong>{pendingOrders}</strong>
            </article>
            <article className="card admin-kpi">
              <p className="muted">Ingresos estimados</p>
              <strong>Q {totalRevenue.toFixed(2)}</strong>
            </article>
            <article className="card admin-kpi">
              <p className="muted">Cambios sin guardar</p>
              <strong>{catalogDirtyCount + crmDirtyCount}</strong>
            </article>
          </section>

          {notice ? <p className="admin-notice">{notice}</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}

          <section className="card">
            <h3>Pedidos</h3>
            <form className="order-form" onSubmit={handleFilter}>
              <div className="admin-grid-5">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente o WhatsApp" />
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filtrar por ciudad" />
                <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
                  <option value="">Todas las formas de pago</option>
                  <option value="DEPOSITO_PREVIO">Depósito previo</option>
                  <option value="PAGO_CONTRAENTREGA">Pago contra entrega</option>
                  <option value="TARJETA_CUBO">Tarjeta Cubo</option>
                </select>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="actions">
                <button type="submit">Aplicar filtros</button>
                <button type="button" className="secondary" onClick={() => { setCity(""); setFrom(""); setTo(""); setQ(""); setPaymentMethodFilter(""); void loadOrders(); }}>
                  Limpiar
                </button>
              </div>
            </form>

            <div className="grid" style={{ gap: 12, marginTop: 14 }}>
              {loading ? <p className="muted">Cargando pedidos...</p> : null}
              {!loading && orders.length === 0 ? <p className="muted">No hay pedidos para estos filtros.</p> : null}
              {!loading
                ? orders.map((order) => (
                    <article key={order.id} className="card admin-order-card">
                      <div>
                        <h3>{order.customerName}</h3>
                        <p className="muted">
                          {order.city} · {order.whatsapp}
                        </p>
                        <p className="muted">Fecha: {new Date(order.createdAt).toLocaleString()}</p>
                        <p className="cart-total">Q {Number(order.total || 0).toFixed(2)}</p>
                      </div>
                      <div className="admin-order-actions">
                        <a className="secondary" href={`/admin/order/${order.id}`}>
                          Ver detalle
                        </a>
                        {statusOptions.map((status) => (
                          <button key={`${order.id}-${status}`} type="button" className={status === order.status ? "secondary" : ""} disabled={updatingId === order.id || status === order.status} onClick={() => updateOrderStatus(order.id, status)}>
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
                  ))
                : null}
            </div>
          </section>

          <section className="card">
            <div className="admin-section-head">
              <div>
                <h3>Inventario del catálogo</h3>
                <p className="muted">Edita libremente y guarda todo con un solo botón.</p>
              </div>
              <button type="button" onClick={() => void saveAllCatalogChanges()} disabled={savingCatalog}>
                {savingCatalog ? "Guardando inventario..." : `Guardar cambios (${catalogDirtyCount})`}
              </button>
            </div>

            <div className="grid" style={{ gap: 12, marginTop: 12 }}>
              {catalog.flatMap((product) =>
                product.variants.map((variant) => {
                  const key = `${product.id}:${variant.id}`;
                  const draft = catalogDrafts[key] || { stockAvailable: "", priceOverride: String(variant.price), isActive: variant.isActive !== false };
                  return (
                    <article key={key} className="card">
                      <h3>{product.name}</h3>
                      <p className="muted">{(variant.gradeLabel || "Sin grado") + " · " + variant.label}</p>
                      <p className="muted">Precio base: Q {variant.price.toFixed(2)}</p>
                      <div className="admin-edit-grid">
                        <input type="number" min="0" value={draft.stockAvailable} placeholder="Stock (vacío = sin límite)" aria-label={`Stock para ${product.name} ${variant.label}`} onChange={(event) => markCatalogDraft(product.id, variant.id, { stockAvailable: event.target.value })} />
                        <input type="number" min="0" step="0.01" value={draft.priceOverride} aria-label={`Precio para ${product.name} ${variant.label}`} onChange={(event) => markCatalogDraft(product.id, variant.id, { priceOverride: event.target.value })} />
                        <label className="admin-checkbox">
                          <input type="checkbox" checked={draft.isActive} onChange={(event) => markCatalogDraft(product.id, variant.id, { isActive: event.target.checked })} />
                          Disponible
                        </label>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <section className="card">
            <div className="admin-section-head">
              <div>
                <h3>Productos CRM</h3>
                <p className="muted">Puedes editar todos los campos y aplicar todo junto.</p>
              </div>
              <button type="button" onClick={() => void saveAllCrmChanges()} disabled={savingCrm}>
                {savingCrm ? "Guardando CRM..." : `Guardar cambios (${crmDirtyCount})`}
              </button>
            </div>

            <div className="grid" style={{ gap: 12, marginTop: 12 }}>
              {crmProducts.length === 0 ? <p className="muted">No hay productos CRM registrados.</p> : null}
              {crmProducts.map((product) => {
                const draft = crmDrafts[product.id];
                if (!draft) return null;
                return (
                  <article key={product.id} className="card">
                    <div className="admin-grid-2">
                      <input value={draft.name} placeholder="Nombre" onChange={(event) => markCrmDraft(product.id, { name: event.target.value })} />
                      <input value={draft.category} placeholder="Categoría" onChange={(event) => markCrmDraft(product.id, { category: event.target.value })} />
                      <input type="number" min="0" step="0.01" value={draft.basePrice} placeholder="Precio" onChange={(event) => markCrmDraft(product.id, { basePrice: event.target.value })} />
                      <input type="number" min="0" value={draft.stock} placeholder="Stock" onChange={(event) => markCrmDraft(product.id, { stock: event.target.value })} />
                      <input value={draft.gradeLabel} placeholder="Grado" onChange={(event) => markCrmDraft(product.id, { gradeLabel: event.target.value })} />
                      <input value={draft.unitLabel} placeholder="Unidad" onChange={(event) => markCrmDraft(product.id, { unitLabel: event.target.value })} />
                    </div>
                    <textarea rows={2} value={draft.description} placeholder="Descripción" onChange={(event) => markCrmDraft(product.id, { description: event.target.value })} />
                    <textarea rows={2} value={draft.notes} placeholder="Notas internas" onChange={(event) => markCrmDraft(product.id, { notes: event.target.value })} />
                    <label className="admin-checkbox">
                      <input type="checkbox" checked={draft.active} onChange={(event) => markCrmDraft(product.id, { active: event.target.checked })} />
                      Producto activo
                    </label>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
