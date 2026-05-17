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

type ProductRecord = {
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

type ProductDraft = {
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

type CatalogDraft = {
  stockAvailable: string;
  priceOverride: string;
  isActive: boolean;
};

type MediaAsset = {
  filename: string;
  grade?: string;
  slot?: string;
  title?: string;
};

const adminTabs = [
  { id: "overview", label: "Resumen" },
  { id: "orders", label: "Pedidos" },
  { id: "catalog", label: "Catálogo" },
  { id: "products", label: "Productos" },
  { id: "stats", label: "Estadísticas" }
] as const;

const productCategories = ["all", "caridinas", "neocaridinas", "accesorios", "insumos", "suplementos", "plantas"] as const;

const mediaSlots = [
  { key: "cover", label: "Portada" },
  { key: "button", label: "Botón" },
  { key: "group", label: "Grupo" },
  { key: "announcement", label: "Anuncio" },
  { key: "gallery", label: "Galería" }
] as const;

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [mediaMapping, setMediaMapping] = useState<Record<string, MediaAsset[]>>({});
  const [catalogDrafts, setCatalogDrafts] = useState<Record<string, CatalogDraft>>({});
  const [catalogDirty, setCatalogDirty] = useState<Record<string, true>>({});
  const [productDrafts, setProductDrafts] = useState<Record<string, ProductDraft>>({});
  const [productDirty, setProductDirty] = useState<Record<string, true>>({});
  const [newProductDraft, setNewProductDraft] = useState<ProductDraft>({
    name: "",
    category: "neocaridinas",
    description: "",
    basePrice: "0",
    stock: "",
    active: true,
    gradeLabel: "",
    unitLabel: "",
    notes: ""
  });
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof adminTabs)[number]["id"]>("overview");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<(typeof productCategories)[number]>("all");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");

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
      const response = await fetch(`/api/orders?${params.toString()}`, { credentials: "same-origin" });
      if (response.status === 401) {
        setAuthenticated(false);
        setOrders([]);
        setError("Ingresa la contraseña para ver pedidos.");
        return;
      }
      if (!response.ok) throw new Error(await response.text());
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

  async function loadCatalog() {
    try {
      const response = await fetch("/api/catalog", { credentials: "same-origin" });
      if (!response.ok) return;
      const data = (await response.json()) as { products?: CatalogProduct[] };
      if (!Array.isArray(data.products)) return;
      setCatalog(data.products);
      const next: Record<string, CatalogDraft> = {};
      data.products.forEach((product) => {
        product.variants.forEach((variant) => {
          const key = `${product.id}:${variant.id}`;
          next[key] = {
            stockAvailable: variant.stockAvailable === null || variant.stockAvailable === undefined ? "" : String(variant.stockAvailable),
            priceOverride: variant.priceOverride === null || variant.priceOverride === undefined ? String(variant.price) : String(variant.priceOverride),
            isActive: variant.isActive !== false
          };
        });
      });
      setCatalogDrafts(next);
      setCatalogDirty({});
    } catch {
      setCatalog([]);
      setCatalogDrafts({});
      setCatalogDirty({});
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch("/api/crm/products", { credentials: "same-origin" });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as { products?: ProductRecord[] };
      if (!Array.isArray(data.products)) return;
      setProducts(data.products);
      const next: Record<string, ProductDraft> = {};
      data.products.forEach((product) => {
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
      setProductDrafts(next);
      setProductDirty({});
    } catch {
      setProducts([]);
      setProductDrafts({});
      setProductDirty({});
    }
  }

  async function loadMedia() {
    try {
      const response = await fetch("/api/admin/media", { credentials: "same-origin" });
      if (!response.ok) return;
      const data = (await response.json()) as { files?: string[]; mapping?: Record<string, MediaAsset[]> };
      setMediaFiles(Array.isArray(data.files) ? data.files : []);
      setMediaMapping(data.mapping || {});
    } catch {
      setMediaFiles([]);
      setMediaMapping({});
    }
  }

  async function loadAll() {
    await Promise.all([
      loadOrders({ q, city: city || undefined, from: from || undefined, to: to || undefined, paymentMethod: paymentMethodFilter || undefined }),
      loadCatalog(),
      loadProducts(),
      loadMedia()
    ]);
  }

  useEffect(() => {
    void loadAll();
  }, [q, city, from, to, paymentMethodFilter]);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadOrders({ q, city: city || undefined, from: from || undefined, to: to || undefined, paymentMethod: paymentMethodFilter || undefined });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (!response.ok) throw new Error("Contraseña invalida");
      setAuthenticated(true);
      setPassword("");
      await loadAll();
    } catch {
      setAuthenticated(false);
      setError("Contraseña incorrecta. Vuelve a intentar.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    setAuthenticated(false);
    setOrders([]);
    setPassword("");
    setError("");
    setNotice("");
  }

  async function updateOrderStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (!response.ok) throw new Error("No se pudo actualizar estado");
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
      setNotice(`Pedido ${id.slice(0, 8)} actualizado a ${status}.`);
    } catch {
      setError("No se pudo actualizar estado del pedido.");
    } finally {
      setUpdatingId("");
    }
  }

  function markCatalogDraft(productId: string, variantId: string, changes: Partial<CatalogDraft>) {
    const key = `${productId}:${variantId}`;
    setCatalogDrafts((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { stockAvailable: "", priceOverride: "", isActive: true }), ...changes }
    }));
    setCatalogDirty((prev) => ({ ...prev, [key]: true }));
  }

  async function saveCatalogChanges() {
    const dirtyKeys = Object.keys(catalogDirty);
    if (dirtyKeys.length === 0) {
      setNotice("No hay cambios pendientes en el catálogo.");
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
        const response = await fetch("/api/catalog", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            variantId,
            stockAvailable: draft.stockAvailable === "" ? null : Number(draft.stockAvailable),
            isActive: draft.isActive,
            priceOverride: draft.priceOverride === "" ? null : Number(draft.priceOverride)
          })
        });
        if (!response.ok) throw new Error(`No se pudo guardar la variante ${variantId}`);
      }
      await loadCatalog();
      setNotice(`Inventario actualizado (${dirtyKeys.length} cambios).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar inventario.");
    } finally {
      setSavingCatalog(false);
    }
  }

  function markProductDraft(productId: string, changes: Partial<ProductDraft>) {
    setProductDrafts((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || newProductDraft), ...changes }
    }));
    setProductDirty((prev) => ({ ...prev, [productId]: true }));
  }

  async function saveProductChanges() {
    const dirtyIds = Object.keys(productDirty);
    if (dirtyIds.length === 0) {
      setNotice("No hay cambios pendientes en productos.");
      return;
    }
    setSavingProducts(true);
    setError("");
    setNotice("");
    try {
      for (const id of dirtyIds) {
        const draft = productDrafts[id];
        if (!draft) continue;
        const response = await fetch("/api/crm/products", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            name: draft.name,
            category: draft.category,
            description: draft.description,
            basePrice: Number(draft.basePrice),
            stock: draft.stock === "" ? null : Number(draft.stock),
            active: draft.active,
            gradeLabel: draft.gradeLabel,
            unitLabel: draft.unitLabel,
            notes: draft.notes
          })
        });
        if (!response.ok) throw new Error(`No se pudo guardar ${draft.name || id}`);
      }
      await loadProducts();
      setNotice(`Productos actualizados (${dirtyIds.length} cambios).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los productos.");
    } finally {
      setSavingProducts(false);
    }
  }

  async function createProduct() {
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/crm/products", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductDraft.name,
          category: newProductDraft.category,
          description: newProductDraft.description,
          basePrice: Number(newProductDraft.basePrice),
          stock: newProductDraft.stock === "" ? null : Number(newProductDraft.stock),
          active: newProductDraft.active,
          gradeLabel: newProductDraft.gradeLabel,
          unitLabel: newProductDraft.unitLabel,
          notes: newProductDraft.notes
        })
      });
      if (!response.ok) throw new Error("No se pudo crear el producto");
      await loadProducts();
      setNewProductDraft({
        name: "",
        category: "neocaridinas",
        description: "",
        basePrice: "0",
        stock: "",
        active: true,
        gradeLabel: "",
        unitLabel: "",
        notes: ""
      });
      setNotice("Producto creado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el producto.");
    }
  }

  async function deleteProduct(id: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/crm/products", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error("No se pudo eliminar el producto");
      await loadProducts();
      setNotice("Producto eliminado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el producto.");
    }
  }

  function getProductAssets(productId: string) {
    return mediaMapping[productId] || [];
  }

  async function assignMedia(productId: string, filename: string, slot?: string, grade?: string, title?: string) {
    await fetch("/api/admin/media/mapping", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, filename, slot, grade, title })
    });
    await loadMedia();
  }

  async function removeMedia(productId: string, filename: string) {
    await fetch("/api/admin/media/mapping", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, filename })
    });
    await loadMedia();
  }

  async function assignSiteMedia(filename: string, slot: "hero" | "banner", title?: string) {
    await fetch("/api/admin/media/mapping", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: "__site__", filename, slot, title })
    });
    await loadMedia();
  }

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "PENDING").length, [orders]);
  const catalogDirtyCount = useMemo(() => Object.keys(catalogDirty).length, [catalogDirty]);
  const productDirtyCount = useMemo(() => Object.keys(productDirty).length, [productDirty]);
  const homeHeroImage = mediaMapping.__site__?.find((asset) => asset.slot === "hero")?.filename || "";
  const homeBannerImage = mediaMapping.__site__?.find((asset) => asset.slot === "banner")?.filename || "";
  const categorySummary = useMemo(() => {
    const counts = new Map<string, number>();
    catalog.forEach((product) => counts.set(product.category, (counts.get(product.category) || 0) + 1));
    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }, [catalog]);
  const filteredCatalog = useMemo(() => {
    if (catalogCategoryFilter === "all") return catalog;
    return catalog.filter((product) => product.category === catalogCategoryFilter);
  }, [catalog, catalogCategoryFilter]);

  function formatOrderItem(item: Order["items"][number]) {
    const baseName = item.name || item.productId || item.packId || "Producto";
    return item.variantLabel ? `${baseName} - ${item.variantLabel}` : baseName;
  }

  return (
    <main className="container section" style={{ paddingTop: 24, paddingBottom: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
        <aside className="card" style={{ position: "sticky", top: 16, alignSelf: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span className="badge">Acceso privado</span>
              <h1 style={{ marginTop: 10, marginBottom: 6 }}>Admin Ecommerce</h1>
              <p className="muted">Pedidos, catálogo, productos e imágenes en una sola plataforma.</p>
            </div>
            {authenticated ? <button type="button" className="secondary" onClick={handleLogout}>Cerrar sesión</button> : null}
            <div style={{ display: "grid", gap: 8 }}>
              {adminTabs.map((tab) => (
                <button key={tab.id} type="button" className={activeTab === tab.id ? "accent" : "secondary"} onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            {authenticated ? (
              <div className="grid" style={{ gap: 8 }}>
                <article className="card admin-kpi"><p className="muted">Pedidos</p><strong>{orders.length}</strong></article>
                <article className="card admin-kpi"><p className="muted">Pendientes</p><strong>{pendingOrders}</strong></article>
                <article className="card admin-kpi"><p className="muted">Ingresos</p><strong>Q {totalRevenue.toFixed(2)}</strong></article>
              </div>
            ) : null}
          </div>
        </aside>

        <section style={{ display: "grid", gap: 16 }}>
          {!authenticated ? (
            <form className="card admin-login" onSubmit={handleLogin}>
              <h3>Ingresar contraseña</h3>
              <p className="muted">Solo tú puedes ver y administrar esta información.</p>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña del admin" autoComplete="current-password" required />
              <button type="submit" disabled={authLoading}>{authLoading ? "Validando..." : "Entrar"}</button>
              {error ? <p className="muted">{error}</p> : null}
            </form>
          ) : (
            <>
              {notice ? <p className="admin-notice">{notice}</p> : null}
              {error ? <p className="admin-error">{error}</p> : null}

              {activeTab === "overview" ? (
                <div style={{ display: "grid", gap: 16 }}>
                  <section className="card">
                    <div className="admin-section-head">
                      <div>
                        <h3>Resumen general</h3>
                        <p className="muted">Estado operativo de la tienda.</p>
                      </div>
                      <button type="button" onClick={() => setActiveTab("orders")}>Ver pedidos</button>
                    </div>
                    <section className="grid admin-kpi-grid" style={{ marginTop: 12 }}>
                      <article className="card admin-kpi"><p className="muted">Pedidos totales</p><strong>{orders.length}</strong></article>
                      <article className="card admin-kpi"><p className="muted">Variantes editadas</p><strong>{catalogDirtyCount}</strong></article>
                      <article className="card admin-kpi"><p className="muted">Productos editables</p><strong>{products.length}</strong></article>
                      <article className="card admin-kpi"><p className="muted">Imágenes cargadas</p><strong>{mediaFiles.length}</strong></article>
                    </section>
                  </section>

                  <section className="card">
                    <div className="admin-section-head">
                      <div>
                        <h3>Banners del inicio</h3>
                        <p className="muted">Portada superior y anuncio rectangular inferior para la home.</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 12 }}>
                      {[
                        { slot: "hero" as const, title: "Portada superior", current: homeHeroImage },
                        { slot: "banner" as const, title: "Anuncio inferior", current: homeBannerImage }
                      ].map((item) => (
                        <div key={item.slot} className="card">
                          <strong>{item.title}</strong>
                          <p className="muted">Imagen rectangular visible en la página principal.</p>
                          {item.current ? (
                            <div style={{ margin: "10px 0" }}>
                              <img src={`/photos/${item.current}`} alt={item.title} style={{ width: "100%", aspectRatio: item.slot === "banner" ? "21 / 9" : "16 / 9", objectFit: "cover", borderRadius: 12 }} />
                            </div>
                          ) : null}
                          <select id={`site-file-${item.slot}`} defaultValue="">
                            <option value="">Seleccionar imagen...</option>
                            {mediaFiles.map((file) => <option key={file} value={file}>{file}</option>)}
                          </select>
                          <button
                            type="button"
                            style={{ marginTop: 8 }}
                            onClick={async () => {
                              const select = document.getElementById(`site-file-${item.slot}`) as HTMLSelectElement | null;
                              if (!select?.value) return;
                              await assignSiteMedia(select.value, item.slot, item.title);
                            }}
                          >
                            Guardar {item.title}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="card">
                    <h3>Categorías del catálogo</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      {categorySummary.map((item) => <span key={item.category} className="badge">{item.category} · {item.count}</span>)}
                    </div>
                  </section>
                </div>
              ) : null}

              {activeTab === "orders" ? (
                <section className="card">
                  <div className="admin-section-head">
                    <div>
                      <h3>Pedidos</h3>
                      <p className="muted">Filtra y revisa pedidos sin salir del panel.</p>
                    </div>
                  </div>
                  <form className="order-form" onSubmit={handleFilter}>
                    <div className="admin-grid-5">
                      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente o WhatsApp" />
                      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filtrar por ciudad" />
                      <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
                        <option value="">Todas las formas de pago</option>
                        <option value="DEPOSITO_PREVIO">Depósito previo</option>
                        <option value="PAGO_CONTRAENTREGA">Pago contra entrega</option>
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
                    {!loading ? orders.map((order) => (
                      <article key={order.id} className="card admin-order-card">
                        <div>
                          <h3>{order.customerName}</h3>
                          <p className="muted">{order.city} · {order.whatsapp}</p>
                          <p className="muted">Fecha: {new Date(order.createdAt).toLocaleString()}</p>
                          <p className="cart-total">Q {Number(order.total || 0).toFixed(2)}</p>
                        </div>
                        <div className="admin-order-actions">
                          <a className="secondary" href={`/admin/order/${order.id}`}>Ver detalle</a>
                          {statusOptions.map((status) => (
                            <button key={`${order.id}-${status}`} type="button" className={status === order.status ? "secondary" : ""} disabled={updatingId === order.id || status === order.status} onClick={() => updateOrderStatus(order.id, status)}>
                              {status}
                            </button>
                          ))}
                        </div>
                        <ul>
                          {Array.isArray(order.items) ? order.items.map((item, idx) => <li key={`${order.id}-${idx}`}>{formatOrderItem(item)} x {item.quantity}</li>) : null}
                        </ul>
                        {order.notes ? <p className="muted">Notas: {order.notes}</p> : null}
                      </article>
                    )) : null}
                  </div>
                </section>
              ) : null}

              {activeTab === "catalog" ? (
                <section className="card">
                  <div className="admin-section-head">
                    <div>
                      <h3>Catálogo</h3>
                      <p className="muted">Edita stock, precio y media por producto desde una sola vista por categoría.</p>
                    </div>
                    <button type="button" onClick={() => void saveCatalogChanges()} disabled={savingCatalog}>
                      {savingCatalog ? "Guardando inventario..." : `Guardar cambios (${catalogDirtyCount})`}
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0 18px" }}>
                    {productCategories.map((category) => (
                      <button key={category} type="button" className={catalogCategoryFilter === category ? "accent" : "secondary"} onClick={() => setCatalogCategoryFilter(category)}>
                        {category === "all" ? "Todas" : category}
                      </button>
                    ))}
                  </div>

                  <div className="grid" style={{ gap: 16 }}>
                    {filteredCatalog.map((product) => {
                      const assets = getProductAssets(product.id);
                      const fileSelectId = `file-${product.id}`;
                      const slotSelectId = `slot-${product.id}`;
                      const gradeInputId = `grade-${product.id}`;
                      const titleInputId = `title-${product.id}`;
                      return (
                        <article key={product.id} className="card">
                          <div className="admin-section-head">
                            <div>
                              <h3>{product.name}</h3>
                              <p className="muted">{product.category} · {product.variants.length} variantes</p>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
                            <div>
                              <strong>Media del producto</strong>
                              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                                <select id={fileSelectId} defaultValue="">
                                  <option value="">Seleccionar imagen...</option>
                                  {mediaFiles.map((file) => <option key={file} value={file}>{file}</option>)}
                                </select>
                                <select id={slotSelectId} defaultValue="cover">
                                  {mediaSlots.map((slot) => <option key={slot.key} value={slot.key}>{slot.label}</option>)}
                                </select>
                                <input id={gradeInputId} placeholder="Grado o etiqueta opcional" />
                                <input id={titleInputId} placeholder="Título opcional" />
                                <button type="button" onClick={async () => {
                                  const fileInput = document.getElementById(fileSelectId) as HTMLSelectElement | null;
                                  const slotInput = document.getElementById(slotSelectId) as HTMLSelectElement | null;
                                  const gradeInput = document.getElementById(gradeInputId) as HTMLInputElement | null;
                                  const titleInput = document.getElementById(titleInputId) as HTMLInputElement | null;
                                  if (!fileInput?.value) return;
                                  await assignMedia(product.id, fileInput.value, slotInput?.value, gradeInput?.value || undefined, titleInput?.value || undefined);
                                }}>Asignar imagen</button>
                              </div>

                              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                                {assets.length === 0 ? <p className="muted">Sin imágenes asignadas.</p> : null}
                                {assets.map((asset) => (
                                  <div key={`${product.id}-${asset.filename}-${asset.slot || "slot"}`} className="card" style={{ padding: 10 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 10, alignItems: "center" }}>
                                      <img src={`/photos/${asset.filename}`} alt={asset.title || asset.filename} style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover" }} />
                                      <div>
                                        <strong>{asset.slot || "galería"}</strong>
                                        <p className="muted">{asset.grade || asset.title || asset.filename}</p>
                                        <button type="button" className="secondary" onClick={() => void removeMedia(product.id, asset.filename)}>Quitar</button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <strong>Variantes</strong>
                              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                                {product.variants.map((variant) => {
                                  const key = `${product.id}:${variant.id}`;
                                  const draft = catalogDrafts[key] || { stockAvailable: "", priceOverride: String(variant.price), isActive: variant.isActive !== false };
                                  return (
                                    <div key={key} className="card" style={{ padding: 12 }}>
                                      <p className="muted">{variant.gradeLabel || "Sin grado"} · {variant.label}</p>
                                      <div className="admin-edit-grid">
                                        <input type="number" min="0" value={draft.stockAvailable} placeholder="Stock" onChange={(event) => markCatalogDraft(product.id, variant.id, { stockAvailable: event.target.value })} />
                                        <input type="number" min="0" step="0.01" value={draft.priceOverride} placeholder="Precio" onChange={(event) => markCatalogDraft(product.id, variant.id, { priceOverride: event.target.value })} />
                                        <label className="admin-checkbox">
                                          <input type="checkbox" checked={draft.isActive} onChange={(event) => markCatalogDraft(product.id, variant.id, { isActive: event.target.checked })} />
                                          Activa
                                        </label>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {activeTab === "products" ? (
                <section className="card">
                  <div className="admin-section-head">
                    <div>
                      <h3>Productos</h3>
                      <p className="muted">Crear, editar y eliminar productos para el catálogo.</p>
                    </div>
                    <button type="button" onClick={() => void saveProductChanges()} disabled={savingProducts}>
                      {savingProducts ? "Guardando..." : `Guardar cambios (${productDirtyCount})`}
                    </button>
                  </div>

                  <div className="card" style={{ marginTop: 12 }}>
                    <h4>Nuevo producto</h4>
                    <div className="admin-grid-2">
                      <input value={newProductDraft.name} placeholder="Nombre" onChange={(event) => setNewProductDraft((prev) => ({ ...prev, name: event.target.value }))} />
                      <select value={newProductDraft.category} onChange={(event) => setNewProductDraft((prev) => ({ ...prev, category: event.target.value }))}>
                        <option value="caridinas">caridinas</option>
                        <option value="neocaridinas">neocaridinas</option>
                        <option value="accesorios">accesorios</option>
                        <option value="insumos">insumos</option>
                        <option value="suplementos">suplementos</option>
                        <option value="plantas">plantas</option>
                      </select>
                      <input type="number" min="0" step="0.01" value={newProductDraft.basePrice} placeholder="Precio" onChange={(event) => setNewProductDraft((prev) => ({ ...prev, basePrice: event.target.value }))} />
                      <input type="number" min="0" value={newProductDraft.stock} placeholder="Stock" onChange={(event) => setNewProductDraft((prev) => ({ ...prev, stock: event.target.value }))} />
                      <input value={newProductDraft.gradeLabel} placeholder="Grado" onChange={(event) => setNewProductDraft((prev) => ({ ...prev, gradeLabel: event.target.value }))} />
                      <input value={newProductDraft.unitLabel} placeholder="Unidad" onChange={(event) => setNewProductDraft((prev) => ({ ...prev, unitLabel: event.target.value }))} />
                    </div>
                    <textarea rows={2} value={newProductDraft.description} placeholder="Descripción" onChange={(event) => setNewProductDraft((prev) => ({ ...prev, description: event.target.value }))} />
                    <textarea rows={2} value={newProductDraft.notes} placeholder="Notas" onChange={(event) => setNewProductDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                    <label className="admin-checkbox">
                      <input type="checkbox" checked={newProductDraft.active} onChange={(event) => setNewProductDraft((prev) => ({ ...prev, active: event.target.checked }))} />
                      Activo
                    </label>
                    <button type="button" onClick={() => void createProduct()}>Crear producto</button>
                  </div>

                  <div className="grid" style={{ gap: 12, marginTop: 12 }}>
                    {products.length === 0 ? <p className="muted">No hay productos registrados.</p> : null}
                    {products.map((product) => {
                      const draft = productDrafts[product.id];
                      if (!draft) return null;
                      return (
                        <article key={product.id} className="card">
                          <div className="admin-grid-2">
                            <input value={draft.name} placeholder="Nombre" onChange={(event) => markProductDraft(product.id, { name: event.target.value })} />
                            <input value={draft.category} placeholder="Categoría" onChange={(event) => markProductDraft(product.id, { category: event.target.value })} />
                            <input type="number" min="0" step="0.01" value={draft.basePrice} placeholder="Precio" onChange={(event) => markProductDraft(product.id, { basePrice: event.target.value })} />
                            <input type="number" min="0" value={draft.stock} placeholder="Stock" onChange={(event) => markProductDraft(product.id, { stock: event.target.value })} />
                            <input value={draft.gradeLabel} placeholder="Grado" onChange={(event) => markProductDraft(product.id, { gradeLabel: event.target.value })} />
                            <input value={draft.unitLabel} placeholder="Unidad" onChange={(event) => markProductDraft(product.id, { unitLabel: event.target.value })} />
                          </div>
                          <textarea rows={2} value={draft.description} placeholder="Descripción" onChange={(event) => markProductDraft(product.id, { description: event.target.value })} />
                          <textarea rows={2} value={draft.notes} placeholder="Notas internas" onChange={(event) => markProductDraft(product.id, { notes: event.target.value })} />
                          <label className="admin-checkbox">
                            <input type="checkbox" checked={draft.active} onChange={(event) => markProductDraft(product.id, { active: event.target.checked })} />
                            Activo
                          </label>
                          <div style={{ marginTop: 12 }}>
                            <strong>Media del producto</strong>
                            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <select id={`prod-file-${product.id}`} defaultValue="">
                                  <option value="">Seleccionar imagen...</option>
                                  {mediaFiles.map((file) => <option key={file} value={file}>{file}</option>)}
                                </select>
                                <select id={`prod-slot-${product.id}`} defaultValue="cover">
                                  {mediaSlots.map((slot) => <option key={slot.key} value={slot.key}>{slot.label}</option>)}
                                </select>
                              </div>
                              <input id={`prod-grade-${product.id}`} placeholder="Grado o etiqueta" />
                              <input id={`prod-title-${product.id}`} placeholder="Título de imagen" />
                              <button type="button" onClick={async () => {
                                const fileInput = document.getElementById(`prod-file-${product.id}`) as HTMLSelectElement | null;
                                const slotInput = document.getElementById(`prod-slot-${product.id}`) as HTMLSelectElement | null;
                                const gradeInput = document.getElementById(`prod-grade-${product.id}`) as HTMLInputElement | null;
                                const titleInput = document.getElementById(`prod-title-${product.id}`) as HTMLInputElement | null;
                                if (!fileInput?.value) return;
                                await assignMedia(product.id, fileInput.value, slotInput?.value, gradeInput?.value || undefined, titleInput?.value || undefined);
                              }}>Asignar media</button>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                              {getProductAssets(product.id).map((asset) => (
                                <div key={`${product.id}-${asset.filename}-${asset.slot || "slot"}`} className="card" style={{ width: 140, padding: 8 }}>
                                  <img src={`/photos/${asset.filename}`} alt={asset.title || asset.filename} style={{ width: "100%", height: 88, objectFit: "cover", borderRadius: 10 }} />
                                  <p className="muted" style={{ marginTop: 8 }}>{asset.slot || "galería"}</p>
                                  <button type="button" className="secondary" onClick={() => void removeMedia(product.id, asset.filename)}>Quitar</button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                            <button type="button" className="secondary" onClick={() => void deleteProduct(product.id)}>Eliminar</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {activeTab === "stats" ? (
                <section className="grid admin-kpi-grid">
                  <article className="card admin-kpi"><p className="muted">Pedidos totales</p><strong>{orders.length}</strong></article>
                  <article className="card admin-kpi"><p className="muted">Pendientes</p><strong>{pendingOrders}</strong></article>
                  <article className="card admin-kpi"><p className="muted">Ingresos estimados</p><strong>Q {totalRevenue.toFixed(2)}</strong></article>
                  <article className="card admin-kpi"><p className="muted">Variantes editadas</p><strong>{catalogDirtyCount}</strong></article>
                  <article className="card admin-kpi"><p className="muted">Productos editables</p><strong>{products.length}</strong></article>
                  <article className="card admin-kpi"><p className="muted">Imágenes cargadas</p><strong>{mediaFiles.length}</strong></article>
                </section>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}