"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const statusOptions = ["PENDING", "CONFIRMED", "DELIVERED"] as const;
type OrderStatus = (typeof statusOptions)[number];

type Order = {
  id: string;
  customerName: string;
  whatsapp: string;
  city: string;
  notes?: string;
  paymentMethod?: string;
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
  description?: string;
  highlight?: string;
  note?: string;
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

type ProductVariantDraft = {
  id: string;
  grade: string;
  unitLabel: string;
  unitPrice: string;
  packPrice: string;
  stock: string;
};

type ProductWizardState = {
  mode: "new" | "edit";
  step: number;
  productId?: string;
  name: string;
  category: string;
  active: boolean;
  description: string;
  variants: ProductVariantDraft[];
  photoPreviews: Array<{ id: string; src: string; file?: File; filename?: string }>;
  existingPhotos: string[];
  notes: string;
};

type CatalogDraft = {
  stockAvailable: string;
  priceOverride: string;
  isActive: boolean;
};

type CatalogMetaDraft = {
  name: string;
  category: string;
  description: string;
  highlight: string;
  note: string;
};

type MediaAsset = {
  filename: string;
  grade?: string;
  slot?: string;
  title?: string;
};

type SiteMediaSlot = "hero" | "banner" | "promo";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const adminTabs = [
  { id: "overview", label: "Resumen" },
  { id: "orders", label: "Pedidos" },
  { id: "catalog", label: "Catálogo" },
  { id: "products", label: "Productos" },
  { id: "stats", label: "Estadísticas" }
] as const;

const productCategories = ["all", "caridinas", "neocaridinas", "accesorios", "insumos", "suplementos", "plantas"] as const;

function createWizardVariantDraft(overrides?: Partial<ProductVariantDraft>): ProductVariantDraft {
  return {
    id: `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    grade: "Grado alto",
    unitLabel: "unidad",
    unitPrice: "0",
    packPrice: "0",
    stock: "0",
    ...overrides
  };
}

async function readErrorResponse(response: Response, context: string, payload?: unknown) {
  const text = await response.text();
  console.error(`Admin fetch failed: ${context}`, {
    status: response.status,
    statusText: response.statusText,
    payload,
    body: text
  });
  return text;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [mediaMapping, setMediaMapping] = useState<Record<string, MediaAsset[]>>({});
  const [catalogDrafts, setCatalogDrafts] = useState<Record<string, CatalogDraft>>({});
  const [catalogDirty, setCatalogDirty] = useState<Record<string, true>>({});
  const [catalogMetaDrafts, setCatalogMetaDrafts] = useState<Record<string, CatalogMetaDraft>>({});
  const [catalogMetaDirty, setCatalogMetaDirty] = useState<Record<string, true>>({});
  const [productDrafts, setProductDrafts] = useState<Record<string, ProductDraft>>({});
  const [productDirty, setProductDirty] = useState<Record<string, true>>({});
  const [newProductDraft] = useState<ProductDraft>({
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
  const [productWizard, setProductWizard] = useState<ProductWizardState | null>(null);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [wizardError, setWizardError] = useState("");
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
  const [selectedGradeByProduct, setSelectedGradeByProduct] = useState<Record<string, string>>({});
  const [uploadingProductId, setUploadingProductId] = useState("");
  const [uploadingSiteSlot, setUploadingSiteSlot] = useState<SiteMediaSlot | "">("");
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");

  const loadOrders = useCallback(async (filters?: { city?: string; from?: string; to?: string; q?: string; paymentMethod?: string }) => {
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
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      const response = await fetch("/api/catalog", { credentials: "same-origin" });
      if (!response.ok) {
        const text = await readErrorResponse(response, "GET /api/catalog");
        setError(text || "No autorizado");
        return;
      }
      const data = (await response.json()) as { products?: CatalogProduct[] };
      if (!Array.isArray(data.products)) return;
      setCatalog(data.products);
      const next: Record<string, CatalogDraft> = {};
      const nextMeta: Record<string, CatalogMetaDraft> = {};
      data.products.forEach((product) => {
        nextMeta[product.id] = {
          name: product.name,
          category: product.category,
          description: product.description || "",
          highlight: product.highlight || "",
          note: product.note || ""
        };
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
      setCatalogMetaDrafts(nextMeta);
      setCatalogDirty({});
      setCatalogMetaDirty({});
    } catch {
      setCatalog([]);
      setCatalogDrafts({});
      setCatalogDirty({});
      setCatalogMetaDrafts({});
      setCatalogMetaDirty({});
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/crm/products", { credentials: "same-origin" });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) {
        const text = await readErrorResponse(response, "GET /api/crm/products");
        setError(text || "No se pudo cargar productos.");
        return;
      }
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
  }, []);

  function createProductWizardState(mode: "new" | "edit", product?: ProductRecord): ProductWizardState {
    if (mode === "edit" && product) {
      return {
        mode: "edit",
        step: 1,
        productId: product.id,
        name: product.name,
        category: product.category,
        active: product.active,
        description: product.description || "",
        variants: [
          createWizardVariantDraft({
            grade: product.gradeLabel || "Grado alto",
            unitLabel: product.unitLabel || "unidad",
            unitPrice: String(product.basePrice ?? 0),
            packPrice: String(product.basePrice ? Math.round(product.basePrice * 4.5) : 0),
            stock: product.stock === null || product.stock === undefined ? "" : String(product.stock)
          })
        ],
        photoPreviews: [],
        existingPhotos: getProductAssets(product.id).map((asset) => asset.filename),
        notes: product.notes || ""
      };
    }

    return {
      mode: "new",
      step: 1,
      name: "",
      category: "neocaridinas",
      active: true,
      description: "",
      variants: [createWizardVariantDraft()],
      photoPreviews: [],
      existingPhotos: [],
      notes: ""
    };
  }

  function openNewProductWizard() {
    setWizardError("");
    setProductWizard(createProductWizardState("new"));
  }

  function openEditProductWizard(product: ProductRecord) {
    setWizardError("");
    setProductWizard(createProductWizardState("edit", product));
  }

  function closeProductWizard() {
    setProductWizard(null);
    setWizardError("");
  }

  function updateWizardField<K extends keyof Omit<ProductWizardState, "variants" | "photoPreviews" | "existingPhotos">>(key: K, value: ProductWizardState[K]) {
    setProductWizard((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateWizardVariant(variantId: string, changes: Partial<ProductVariantDraft>) {
    setProductWizard((prev) =>
      prev
        ? {
            ...prev,
            variants: prev.variants.map((variant) => (variant.id === variantId ? { ...variant, ...changes } : variant))
          }
        : prev
    );
  }

  function addWizardVariant() {
    setProductWizard((prev) =>
      prev
        ? {
            ...prev,
            variants: [...prev.variants, createWizardVariantDraft({ grade: `Grado ${prev.variants.length + 1}` })]
          }
        : prev
    );
  }

  function removeWizardVariant(variantId: string) {
    setProductWizard((prev) =>
      prev
        ? {
            ...prev,
            variants: prev.variants.length <= 1 ? prev.variants : prev.variants.filter((variant) => variant.id !== variantId)
          }
        : prev
    );
  }

  function addWizardPhoto(file: File) {
    const src = URL.createObjectURL(file);
    setProductWizard((prev) =>
      prev
        ? {
            ...prev,
            photoPreviews: [...prev.photoPreviews, { id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`, src, file }]
          }
        : prev
    );
  }

  function removeWizardPhoto(photoId: string) {
    setProductWizard((prev) =>
      prev
        ? {
            ...prev,
            photoPreviews: prev.photoPreviews.filter((photo) => photo.id !== photoId)
          }
        : prev
    );
  }

  async function uploadWizardPhotos(productId: string, wizard: ProductWizardState) {
    const firstGrade = wizard.variants[0]?.grade || undefined;
    for (const photo of wizard.photoPreviews.filter((item) => item.file)) {
      if (!photo.file) continue;
      const filename = `${productId}-${Date.now()}-${photo.file.name}`;
      const uploaded = await uploadMediaFile(photo.file, filename);
      await assignMedia(productId, uploaded.filename, firstGrade, firstGrade);
    }
    await loadMedia();
  }

  async function saveWizardProduct() {
    if (!productWizard) return;
    setWizardError("");
    setWizardSaving(true);
    const primaryVariant = productWizard.variants[0];
    if (!primaryVariant) {
      setWizardError("Agrega al menos un grado con precio.");
      setWizardSaving(false);
      return;
    }

    const payload = {
      name: productWizard.name,
      category: productWizard.category,
      description: productWizard.description,
      basePrice: Number(primaryVariant.unitPrice),
      stock: primaryVariant.stock === "" ? null : Number(primaryVariant.stock),
      active: productWizard.active,
      gradeLabel: primaryVariant.grade,
      unitLabel: primaryVariant.unitLabel,
      notes: productWizard.notes
    };

    try {
      if (productWizard.mode === "new") {
        const response = await fetch("/api/crm/products", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const text = await readErrorResponse(response, "POST /api/crm/products (wizard)", {
            name: payload.name,
            category: payload.category
          });
          throw new Error(text || "No se pudo crear el producto.");
        }
        const data = (await response.json()) as { product?: ProductRecord };
        if (!data.product) throw new Error("No se pudo crear el producto.");
        await uploadWizardPhotos(data.product.id, productWizard);
        await loadProducts();
        setNotice("Producto creado correctamente.");
        closeProductWizard();
      } else if (productWizard.mode === "edit" && productWizard.productId) {
        const response = await fetch("/api/crm/products", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: productWizard.productId, ...payload })
        });
        if (!response.ok) {
          const text = await readErrorResponse(response, "PATCH /api/crm/products (wizard)", {
            id: productWizard.productId,
            name: payload.name,
            category: payload.category
          });
          throw new Error(text || "No se pudo actualizar el producto.");
        }
        await uploadWizardPhotos(productWizard.productId, productWizard);
        await loadProducts();
        await loadMedia();
        setNotice("Producto actualizado correctamente.");
        closeProductWizard();
      }
    } catch (err) {
      setWizardError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
    } finally {
      setWizardSaving(false);
    }
  }

  const loadMedia = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/media", { credentials: "same-origin" });
      if (!response.ok) {
        const text = await readErrorResponse(response, "GET /api/admin/media");
        setError(text || "No autorizado");
        return;
      }
      const data = (await response.json()) as { files?: string[]; mapping?: Record<string, MediaAsset[]> };
      setMediaFiles(Array.isArray(data.files) ? data.files : []);
      setMediaMapping(data.mapping || {});
    } catch {
      setMediaFiles([]);
      setMediaMapping({});
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadOrders({ q, city: city || undefined, from: from || undefined, to: to || undefined, paymentMethod: paymentMethodFilter || undefined }),
      loadCatalog(),
      loadProducts(),
      loadMedia()
    ]);
  }, [city, from, loadCatalog, loadMedia, loadOrders, loadProducts, paymentMethodFilter, q, to]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

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
      if (!response.ok) {
        const text = await readErrorResponse(response, "POST /api/admin/login");
        throw new Error(text || "Contraseña inválida");
      }
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

  function markCatalogMetaDraft(productId: string, changes: Partial<CatalogMetaDraft>) {
    setCatalogMetaDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { name: "", category: "", description: "", highlight: "", note: "" }),
        ...changes
      }
    }));
    setCatalogMetaDirty((prev) => ({ ...prev, [productId]: true }));
  }

  function resetCatalogMetaDraft(product: CatalogProduct) {
    setCatalogMetaDrafts((prev) => ({
      ...prev,
      [product.id]: {
        name: product.name,
        category: product.category,
        description: product.description || "",
        highlight: product.highlight || "",
        note: product.note || ""
      }
    }));
    setCatalogMetaDirty((prev) => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
  }

  async function saveCatalogChanges() {
    const dirtyKeys = Object.keys(catalogDirty);
    const dirtyProductIds = Object.keys(catalogMetaDirty);
    if (dirtyKeys.length === 0 && dirtyProductIds.length === 0) {
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
        if (!response.ok) {
          const text = await readErrorResponse(response, "PATCH /api/catalog", {
            productId,
            variantId,
            stockAvailable: draft.stockAvailable,
            isActive: draft.isActive,
            priceOverride: draft.priceOverride
          });
          throw new Error(text || `No se pudo guardar la variante ${variantId}`);
        }
      }

      for (const productId of dirtyProductIds) {
        const draft = catalogMetaDrafts[productId];
        if (!draft) continue;
        const response = await fetch("/api/admin/catalog", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            name: draft.name,
            category: draft.category,
            description: draft.description,
            highlight: draft.highlight,
            note: draft.note
          })
        });
        if (!response.ok) {
          const text = await readErrorResponse(response, "PATCH /api/admin/catalog", { productId, name: draft.name, category: draft.category });
          throw new Error(text || `No se pudo guardar ${draft.name || productId}`);
        }
      }

      await loadCatalog();
      setNotice(`Catálogo actualizado (${dirtyKeys.length + dirtyProductIds.length} cambios).`);
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
        if (!response.ok) {
          const text = await readErrorResponse(response, "PATCH /api/crm/products", { id, name: draft.name, category: draft.category });
          throw new Error(text || `No se pudo guardar ${draft.name || id}`);
        }
      }
      await loadProducts();
      setNotice(`Productos actualizados (${dirtyIds.length} cambios).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los productos.");
    } finally {
      setSavingProducts(false);
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
      if (!response.ok) {
        const text = await readErrorResponse(response, "DELETE /api/crm/products", { id });
        throw new Error(text || "No se pudo eliminar el producto");
      }
      await loadProducts();
      setNotice("Producto eliminado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el producto.");
    }
  }

  function getProductAssets(productId: string) {
    return mediaMapping[productId] || [];
  }

  function getProductGradeOptions(product: CatalogProduct) {
    const grades = new Set<string>();
    product.variants.forEach((variant) => {
      const grade = variant.gradeLabel?.trim() || variant.label?.trim();
      if (grade) grades.add(grade);
    });
    getProductAssets(product.id).forEach((asset) => {
      if (asset.grade?.trim()) grades.add(asset.grade.trim());
    });
    return Array.from(grades);
  }

  async function assignMedia(productId: string, filename: string, grade?: string, title?: string) {
    const response = await fetch("/api/admin/media/mapping", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, filename, grade, slot: "gallery", title })
    });
    if (!response.ok) {
      const text = await readErrorResponse(response, "POST /api/admin/media/mapping", { productId, filename, grade, title });
      setError(text || "No se pudo asignar el archivo.");
      return;
    }
    await loadMedia();
  }

  async function removeMedia(productId: string, filename: string) {
    const response = await fetch("/api/admin/media/mapping", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, filename })
    });
    if (!response.ok) {
      const text = await readErrorResponse(response, "DELETE /api/admin/media/mapping", { productId, filename });
      setError(text || "No se pudo eliminar el archivo.");
      return;
    }
    await loadMedia();
  }

  async function assignSiteMedia(filename: string, slot: "hero" | "banner" | "promo", title?: string) {
    const response = await fetch("/api/admin/media/mapping", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: "__site__", filename, slot, title })
    });
    if (!response.ok) {
      const text = await readErrorResponse(response, "POST /api/admin/media/mapping (site)", { filename, slot, title });
      setError(text || "No se pudo asignar el archivo al sitio.");
      return;
    }
    await loadMedia();
  }

  function isVideoFile(filename: string) {
    return /\.(mp4|webm|mov|m4v)$/i.test(filename);
  }

  function getMediaUrl(filename: string) {
    if (!filename) return "";
    if (filename.startsWith("/")) return filename;
    return `/api/media/${filename.split("/").map(encodeURIComponent).join("/")}`;
  }

  function getMediaLabel(filename: string) {
    return filename.split(/[\\/]/).pop() || filename;
  }

  async function uploadMediaFile(file: File, filename: string) {
    const formData = new FormData();
    formData.append("filename", filename);
    formData.append("file", file);

    const response = await fetch("/api/admin/media", {
      method: "POST",
      credentials: "same-origin",
      body: formData
    });

    if (!response.ok) {
      const text = await readErrorResponse(response, "POST /api/admin/media", {
        filename,
        size: file.size,
        mimeType: file.type
      });
      throw new Error(text || "No se pudo subir el archivo.");
    }

    return (await response.json()) as { filename: string; url: string; mimeType: string };
  }

  async function handleUploadSiteMedia(slot: SiteMediaSlot, title: string, file: File) {
    if (!file.type.startsWith("image/")) {
      if (!file.type.startsWith("video/")) {
        setError("Por favor selecciona una imagen o video válido");
        return;
      }
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Por favor selecciona una imagen o video válido");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Archivo demasiado grande. Máximo permitido: 5MB.");
      return;
    }

    setUploadingSiteSlot(slot);
    try {
      const filename = `site-${slot}-${Date.now()}-${file.name}`;
      const uploaded = await uploadMediaFile(file, filename);
      await assignSiteMedia(uploaded.filename, slot, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo.");
    } finally {
      setUploadingSiteSlot((current) => (current === slot ? "" : current));
    }
  }

  function getImagesByProductAndGrade(productId: string, grade?: string): MediaAsset[] {
    const assets = mediaMapping[productId] || [];
    if (!grade) return [];
    return assets.filter((asset) => asset.grade === grade);
  }

  async function handleUploadImage(productId: string, grade: string, file: File) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Por favor selecciona una imagen o video válido");
      return;
    }

    if (!grade) {
      setError("Selecciona un grado antes de subir la imagen.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Archivo demasiado grande. Máximo permitido: 5MB.");
      return;
    }

    setUploading(true);
    setUploadingProductId(productId);

    try {
      const filename = `${productId}-${Date.now()}-${file.name}`;
      const uploaded = await uploadMediaFile(file, filename);
      await assignMedia(productId, uploaded.filename, grade, grade);
      setSelectedGradeByProduct((prev) => ({ ...prev, [productId]: grade }));
      setNotice("Archivo subido y asignado al grado seleccionado.");
      await loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar archivo");
    } finally {
      setUploading(false);
      setUploadingProductId("");
    }
  }

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "PENDING").length, [orders]);
  const catalogDirtyCount = useMemo(() => Object.keys(catalogDirty).length, [catalogDirty]);
  const catalogMetaDirtyCount = useMemo(() => Object.keys(catalogMetaDirty).length, [catalogMetaDirty]);
  const productDirtyCount = useMemo(() => Object.keys(productDirty).length, [productDirty]);
  const homeHeroImage = mediaMapping.__site__?.find((asset) => asset.slot === "hero")?.filename || "";
  const homeBannerImage = mediaMapping.__site__?.find((asset) => asset.slot === "banner")?.filename || "";
  const homePromoImage = mediaMapping.__site__?.find((asset) => asset.slot === "promo")?.filename || "";
  const categorySummary = useMemo(() => {
    const counts = new Map<string, number>();
    catalog.forEach((product) => counts.set(product.category, (counts.get(product.category) || 0) + 1));
    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }, [catalog]);

  // Advanced stats
  const ordersByStatus = useMemo(() => {
    const statuses: Record<OrderStatus, number> = { PENDING: 0, CONFIRMED: 0, DELIVERED: 0 };
    orders.forEach((order) => { statuses[order.status]++; });
    return statuses;
  }, [orders]);

  const topProducts = useMemo(() => {
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId || item.packId || item.name || "unknown";
        const current = productSales.get(key) || { name: item.name || key, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += (item.unitPrice || 0) * item.quantity;
        productSales.set(key, current);
      });
    });
    return Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  }, [orders]);
  const filteredCatalog = useMemo(() => {
    if (catalogCategoryFilter === "all") return catalog;
    return catalog.filter((product) => product.category === catalogCategoryFilter);
  }, [catalog, catalogCategoryFilter]);

  function formatOrderItem(item: Order["items"][number]) {
    const baseName = item.name || item.productId || item.packId || "Producto";
    return item.variantLabel ? `${baseName} - ${item.variantLabel}` : baseName;
  }

  function renderMediaPreview(filename: string, alt: string, className?: string) {
    if (isVideoFile(filename)) {
      return <video className={className} src={getMediaUrl(filename)} aria-label={alt} muted loop playsInline controls={false} preload="metadata" />;
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={getMediaUrl(filename)} alt={alt} />;
  }

  const siteMediaSlots: Array<{ slot: SiteMediaSlot; title: string; current: string; description: string; aspectRatio: string }> = [
    { slot: "hero", title: "Portada superior", current: homeHeroImage, description: "Portada principal de la tienda.", aspectRatio: "16 / 9" },
    { slot: "banner", title: "Anuncio inferior", current: homeBannerImage, description: "Banner ancho para el bloque inferior.", aspectRatio: "21 / 9" },
    { slot: "promo", title: "Banner de anuncios", current: homePromoImage, description: "Banner para promociones y publicaciones.", aspectRatio: "16 / 8" }
  ];

  return (
    <main className="container section" style={{ paddingTop: 24, paddingBottom: 32 }}>
      {!authenticated ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 160px)" }}>
          <form className="card admin-login" onSubmit={handleLogin} style={{ width: "min(420px, 100%)" }}>
            <span className="badge">Acceso privado</span>
            <h1 style={{ marginTop: 10, marginBottom: 6 }}>Admin Ecommerce</h1>
            <p className="muted">Pedidos, catálogo, productos e imágenes en una sola plataforma.</p>
            <h3 style={{ marginTop: 18 }}>Ingresar contraseña</h3>
            <p className="muted">Solo tú puedes ver y administrar esta información.</p>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña del admin" autoComplete="current-password" required />
            <button type="submit" disabled={authLoading}>{authLoading ? "Validando..." : "Entrar"}</button>
            <Link className="secondary" href="/" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Volver a la tienda
            </Link>
            {error ? <p className="muted">{error}</p> : null}
          </form>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
          <aside className="card" style={{ position: "sticky", top: 16, alignSelf: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <Link href="/" className="badge" style={{ display: "inline-flex", width: "fit-content", textDecoration: "none" }}>GuateGambas</Link>
                <h1 style={{ marginTop: 10, marginBottom: 6 }}>Admin Ecommerce</h1>
                <p className="muted">Pedidos, catálogo, productos e imágenes en una sola plataforma.</p>
              </div>
              <button type="button" className="secondary" onClick={handleLogout}>Cerrar sesión</button>
              <Link href="/" className="secondary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                Ir a la página principal
              </Link>
              <div style={{ display: "grid", gap: 8 }}>
                {adminTabs.map((tab) => (
                  <button key={tab.id} type="button" className={activeTab === tab.id ? "accent" : "secondary"} onClick={() => setActiveTab(tab.id)}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="grid" style={{ gap: 8 }}>
                <article className="card admin-kpi"><p className="muted">Pedidos</p><strong>{orders.length}</strong></article>
                <article className="card admin-kpi"><p className="muted">Pendientes</p><strong>{pendingOrders}</strong></article>
                <article className="card admin-kpi"><p className="muted">Ingresos</p><strong>Q {totalRevenue.toFixed(2)}</strong></article>
              </div>
            </div>
          </aside>

          <section style={{ display: "grid", gap: 16 }}>
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
                        <p className="muted">Sube una imagen o video, o elige uno ya guardado en la biblioteca visual.</p>
                      </div>
                    </div>
                    <div className="admin-banner-grid" style={{ marginTop: 12 }}>
                      {siteMediaSlots.map((item) => (
                        <div key={item.slot} className="card admin-banner-card">
                          <div className="admin-banner-card-head">
                            <div>
                              <strong>{item.title}</strong>
                              <p className="muted">{item.description}</p>
                            </div>
                            <span className="badge">{item.current ? getMediaLabel(item.current) : "Sin imagen"}</span>
                          </div>

                          <div className="admin-banner-preview" style={{ aspectRatio: item.aspectRatio }}>
                            {item.current ? (
                              renderMediaPreview(item.current, item.title, "admin-banner-preview-media")
                            ) : (
                              <div className="admin-banner-empty">
                                <strong>Sin banner asignado</strong>
                                <p className="muted">Elige un medio existente o sube uno nuevo.</p>
                              </div>
                            )}
                          </div>

                          <label className="admin-upload-dropzone">
                            <span className="admin-upload-chip">Subir imagen o video</span>
                            <strong>{uploadingSiteSlot === item.slot ? "Subiendo..." : `Archivo para ${item.title.toLowerCase()}`}</strong>
                            <span className="muted">JPG, PNG, WEBP, MP4 o WEBM. Se guardará para este banner.</span>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              disabled={uploadingSiteSlot === item.slot}
                              onChange={async (event) => {
                                const input = event.currentTarget;
                                const file = event.target.files?.[0];
                                if (!file) return;
                                await handleUploadSiteMedia(item.slot, item.title, file);
                                input.value = "";
                              }}
                            />
                          </label>

                          <div className="admin-media-picker">
                            {mediaFiles.length > 0 ? mediaFiles.map((file) => (
                              <button
                                key={`${item.slot}-${file}`}
                                type="button"
                                className="admin-media-card"
                                onClick={async () => {
                                  await assignSiteMedia(file, item.slot, item.title);
                                }}
                              >
                                <div className="admin-media-card-preview">
                                  {renderMediaPreview(file, file, "admin-media-card-media")}
                                </div>
                                <span title={file}>{getMediaLabel(file)}</span>
                              </button>
                            )) : <p className="muted">No hay archivos guardados todavía.</p>}
                          </div>
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
                      {savingCatalog ? "Guardando catálogo..." : `Guardar cambios (${catalogDirtyCount + catalogMetaDirtyCount})`}
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
                      const gradeOptions = getProductGradeOptions(product);
                      const selectedGrade = selectedGradeByProduct[product.id] || gradeOptions[0] || "";
                      const gradeAssets = getImagesByProductAndGrade(product.id, selectedGrade);
                      const gradeInputId = `grade-${product.id}`;
                      return (
                        <article key={product.id} className="card">
                          <div className="admin-section-head">
                            <div>
                              <h3>{product.name}</h3>
                              <p className="muted">{product.category} · {product.variants.length} variantes</p>
                            </div>
                            <span className="badge">{catalogMetaDirty[product.id] ? "Sin guardar" : "Actualizado"}</span>
                          </div>

                          <div className="admin-grid-2" style={{ gap: 10, marginTop: 12 }}>
                            <input value={catalogMetaDrafts[product.id]?.name || ""} placeholder="Nombre del producto" onChange={(event) => markCatalogMetaDraft(product.id, { name: event.target.value })} />
                            <input value={catalogMetaDrafts[product.id]?.category || ""} placeholder="Categoría" onChange={(event) => markCatalogMetaDraft(product.id, { category: event.target.value })} />
                            <input value={catalogMetaDrafts[product.id]?.highlight || ""} placeholder="Etiqueta o highlight" onChange={(event) => markCatalogMetaDraft(product.id, { highlight: event.target.value })} />
                            <input value={catalogMetaDrafts[product.id]?.note || ""} placeholder="Nota corta" onChange={(event) => markCatalogMetaDraft(product.id, { note: event.target.value })} />
                          </div>
                          <textarea
                            rows={3}
                            value={catalogMetaDrafts[product.id]?.description || ""}
                            placeholder="Descripción del producto"
                            onChange={(event) => markCatalogMetaDraft(product.id, { description: event.target.value })}
                            style={{ marginTop: 10 }}
                          />
                          <div className="actions" style={{ marginTop: 10 }}>
                            <button type="button" className="secondary" onClick={() => resetCatalogMetaDraft(product)}>
                              Revertir
                            </button>
                          </div>
                          <div className="admin-image-panel">
                            <div className="admin-image-card">
                              <div>
                                <strong>Imágenes del producto</strong>
                                <p className="muted">Sube una foto por grado para controlar qué se ve en el catálogo y en el detalle.</p>
                              </div>
                              <div style={{ display: "grid", gap: 10 }}>
                                <select
                                  id={gradeInputId}
                                  value={selectedGrade}
                                  onChange={(event) => setSelectedGradeByProduct((prev) => ({ ...prev, [product.id]: event.target.value }))}
                                >
                                  <option value="">Seleccionar grado...</option>
                                  {gradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                                </select>
                                <label className="admin-upload-dropzone">
                                  <span className="admin-upload-chip">Arrastra o elige una imagen</span>
                                  <strong>{selectedGrade || "Selecciona un grado primero"}</strong>
                                  <span className="muted">JPG o PNG. Se guardará asociada al grado seleccionado.</span>
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    disabled={!selectedGrade || uploading && uploadingProductId === product.id}
                                    onChange={async (event) => {
                                      const input = event.currentTarget;
                                      const file = event.target.files?.[0];
                                      if (!file || !selectedGrade) return;
                                      await handleUploadImage(product.id, selectedGrade, file);
                                      input.value = "";
                                    }}
                                  />
                                </label>
                              </div>

                              <div className="admin-image-list">
                                {!selectedGrade ? <p className="muted">Selecciona un grado para ver sus imágenes.</p> : null}
                                {selectedGrade && gradeAssets.length === 0 ? <p className="muted">Sin imágenes asignadas a este grado.</p> : null}
                                {gradeAssets.map((asset) => (
                                  <div key={`${product.id}-${asset.filename}-${asset.grade || "grade"}`} className="admin-image-item">
                                        {isVideoFile(asset.filename) ? (
                                          <video src={getMediaUrl(asset.filename)} aria-label={asset.title || asset.filename} muted loop playsInline controls={false} />
                                        ) : (
                                          <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={getMediaUrl(asset.filename)} alt={asset.title || asset.filename} />
                                          </>
                                        )}
                                    <div>
                                      <strong>{asset.grade || "Sin grado"}</strong>
                                      <p className="muted">{asset.title || asset.filename}</p>
                                      <button type="button" className="secondary" onClick={() => void removeMedia(product.id, asset.filename)}>Quitar</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="admin-image-card">
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
                <section className="card admin-products-panel">
                  <div className="admin-section-head">
                    <div>
                      <h3>Productos</h3>
                      <p className="muted">Crear, editar y eliminar productos para el catálogo.</p>
                    </div>
                    <div className="admin-product-actions">
                      <button type="button" className="admin-button primary" onClick={openNewProductWizard}>Nuevo producto</button>
                      <button type="button" className="admin-button secondary" onClick={() => void saveProductChanges()} disabled={savingProducts}>
                        {savingProducts ? "Guardando..." : `Guardar cambios (${productDirtyCount})`}
                      </button>
                    </div>
                  </div>

                  {productWizard ? (
                    <div className="admin-product-wizard">
                      <div className="wizard-main">
                        <div className="wizard-form">
                          <div className="wizard-stepper">
                            {[
                              { step: 1, label: "Información básica" },
                              { step: 2, label: "Grados y precios" },
                              { step: 3, label: "Fotos" },
                              { step: 4, label: "Revisión" }
                            ].map((item) => {
                              const isActive = productWizard.step === item.step;
                              const isDone = productWizard.step > item.step;
                              return (
                                <button
                                  key={item.step}
                                  type="button"
                                  className={`wizard-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                                  onClick={() => setProductWizard((prev) => (prev ? { ...prev, step: item.step } : prev))}
                                >
                                  <span className="wizard-step-number">{isDone ? "✓" : item.step}</span>
                                  <span>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="wizard-stage">
                            {productWizard.step === 1 ? (
                              <div className="wizard-panel">
                                <h4>1. Información básica</h4>
                                <div className="admin-grid-2">
                                  <label>
                                    Nombre del producto
                                    <input
                                      value={productWizard.name}
                                      onChange={(event) => updateWizardField("name", event.target.value)}
                                      placeholder="Ej: Bloody Mary"
                                    />
                                  </label>
                                  <label>
                                    Categoría
                                    <select
                                      value={productWizard.category}
                                      onChange={(event) => updateWizardField("category", event.target.value)}
                                    >
                                      <option value="caridinas">Caridinas</option>
                                      <option value="neocaridinas">Neocaridinas</option>
                                      <option value="accesorios">Accesorios</option>
                                      <option value="insumos">Insumos</option>
                                      <option value="suplementos">Suplementos</option>
                                      <option value="plantas">Plantas</option>
                                    </select>
                                  </label>
                                </div>

                                <label>
                                  Estado del producto
                                  <select
                                    value={productWizard.active ? "Disponible" : "Agotado"}
                                    onChange={(event) => updateWizardField("active", event.target.value === "Disponible")}
                                  >
                                    <option value="Disponible">Disponible</option>
                                    <option value="Agotado">Agotado</option>
                                  </select>
                                </label>

                                <label>
                                  Descripción corta
                                  <textarea
                                    rows={4}
                                    value={productWizard.description}
                                    onChange={(event) => updateWizardField("description", event.target.value)}
                                    placeholder="Describe brevemente el producto"
                                  />
                                </label>
                              </div>
                            ) : null}

                            {productWizard.step === 2 ? (
                              <div className="wizard-panel">
                                <div className="wizard-panel-head">
                                  <h4>2. Grados y precios</h4>
                                  <p className="muted">Agrega cada grado que vendes y controla precio de unidad, pack y stock.</p>
                                </div>
                                <div className="wizard-variant-list">
                                  {productWizard.variants.map((variant, index) => (
                                    <div key={variant.id} className="variant-card">
                                      <div className="variant-card-title">
                                        <strong>{`Grado ${index + 1}`}</strong>
                                        {productWizard.variants.length > 1 ? (
                                          <button type="button" className="variant-remove" onClick={() => removeWizardVariant(variant.id)}>
                                            Eliminar
                                          </button>
                                        ) : null}
                                      </div>
                                      <div className="admin-edit-grid" style={{ marginTop: 10 }}>
                                        <label>
                                          Nombre del grado
                                          <input
                                            value={variant.grade}
                                            onChange={(event) => updateWizardVariant(variant.id, { grade: event.target.value })}
                                            placeholder="Grado alto"
                                          />
                                        </label>
                                        <label>
                                          Precio unidad
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={variant.unitPrice}
                                            onChange={(event) => updateWizardVariant(variant.id, { unitPrice: event.target.value })}
                                            placeholder="Q 45.00"
                                          />
                                        </label>
                                        <label>
                                          Precio pack de 5
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={variant.packPrice}
                                            onChange={(event) => updateWizardVariant(variant.id, { packPrice: event.target.value })}
                                            placeholder="Q 200.00"
                                          />
                                        </label>
                                        <label>
                                          Stock disponible
                                          <input
                                            type="number"
                                            min="0"
                                            value={variant.stock}
                                            onChange={(event) => updateWizardVariant(variant.id, { stock: event.target.value })}
                                            placeholder="32"
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button type="button" className="wizard-add-variant" onClick={addWizardVariant}>
                                  + Agregar otro grado
                                </button>
                              </div>
                            ) : null}

                            {productWizard.step === 3 ? (
                                <div className="wizard-panel wizard-panel-card">
                                <div className="wizard-panel-head">
                                  <h4>3. Fotos</h4>
                                  <p className="muted">Arrastra imágenes o súbelas desde tu galería. La primera foto se usa como imagen principal.</p>
                                </div>
                                <div
                                  className="wizard-dropzone"
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={(event) => {
                                    event.preventDefault();
                                    const files = Array.from(event.dataTransfer.files || []);
                                    files.filter((file) => file.type.startsWith("image/")).forEach(addWizardPhoto);
                                  }}
                                >
                                  <div className="wizard-dropzone-icon">📷</div>
                                  <div className="wizard-dropzone-text">
                                    Arrastra fotos aquí o toca para subir
                                  </div>
                                  <div className="wizard-dropzone-subtext">JPG, PNG o video, hasta 5 archivos</div>
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    className="wizard-file-input"
                                    onChange={(event) => {
                                      const files = Array.from(event.target.files || []);
                                      files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/")).forEach(addWizardPhoto);
                                      event.currentTarget.value = "";
                                    }}
                                  />
                                </div>
                                <div className="wizard-thumbs">
                                  {productWizard.existingPhotos.map((filename) => (
                                    <div key={filename} className="wizard-thumb">
                                      {isVideoFile(filename) ? (
                                        <video src={getMediaUrl(filename)} aria-label={filename} muted loop playsInline controls={false} />
                                      ) : (
                                        <>
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={getMediaUrl(filename)} alt={filename} />
                                        </>
                                      )}
                                    </div>
                                  ))}
                                  {productWizard.photoPreviews.map((photo) => (
                                    <div key={photo.id} className="wizard-thumb">
                                      {photo.file && photo.file.type.startsWith("video/") ? (
                                        <video src={photo.src} aria-label="Archivo seleccionado" muted loop playsInline controls={false} />
                                      ) : (
                                        <>
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={photo.src} alt="Foto seleccionada" />
                                        </>
                                      )}
                                      <button type="button" className="thumb-remove" onClick={() => removeWizardPhoto(photo.id)}>×</button>
                                    </div>
                                  ))}
                                  {productWizard.existingPhotos.length + productWizard.photoPreviews.length === 0 ? (
                                    <p className="muted">Aún no hay fotos agregadas.</p>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            {productWizard.step === 4 ? (
                              <div className="wizard-panel">
                                <h4>4. Revisión</h4>
                                <p className="muted">Revisa los datos antes de publicar o actualizar el producto.</p>
                                <div className="review-grid">
                                  <div>
                                    <strong>Nombre</strong>
                                    <p>{productWizard.name || "Sin nombre"}</p>
                                  </div>
                                  <div>
                                    <strong>Categoría</strong>
                                    <p>{productWizard.category}</p>
                                  </div>
                                  <div>
                                    <strong>Estado</strong>
                                    <p>{productWizard.active ? "Disponible" : "Agotado"}</p>
                                  </div>
                                  <div>
                                    <strong>Descripción</strong>
                                    <p>{productWizard.description || "Sin descripción"}</p>
                                  </div>
                                </div>
                                <div className="review-grid review-variants">
                                  {productWizard.variants.map((variant, index) => (
                                    <div key={variant.id} className="review-variant">
                                      <strong>{variant.grade || `Grado ${index + 1}`}</strong>
                                      <p>Unidad: Q {variant.unitPrice || "0"}</p>
                                      <p>Pack 5: Q {variant.packPrice || "0"}</p>
                                      <p>Stock: {variant.stock || "0"}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="review-photos">
                                  <strong>Fotos</strong>
                                  <p>{productWizard.existingPhotos.length + productWizard.photoPreviews.length} archivos cargados</p>
                                </div>
                                {wizardError ? <p className="admin-error" style={{ marginTop: 12 }}>{wizardError}</p> : null}
                              </div>
                            ) : null}

                            <div className="wizard-actions">
                              <button type="button" className="admin-button secondary" onClick={productWizard.step === 1 ? closeProductWizard : () => setProductWizard((prev) => (prev ? { ...prev, step: prev.step - 1 } : prev))}>
                                {productWizard.step === 1 ? "Cancelar" : "Anterior"}
                              </button>
                              <button
                                type="button"
                                className="admin-button primary"
                                onClick={async () => {
                                  if (!productWizard) return;
                                  if (productWizard.step < 4) {
                                    setProductWizard((prev) => (prev ? { ...prev, step: prev.step + 1 } : prev));
                                  } else {
                                    await saveWizardProduct();
                                  }
                                }}
                                disabled={wizardSaving}
                              >
                                {productWizard.step < 4 ? "Siguiente" : productWizard.mode === "new" ? "Publicar producto" : "Actualizar producto"}
                              </button>
                            </div>
                          </div>
                        </div>

                        <aside className="wizard-preview">
                          <div className="preview-card">
                            <span className="preview-tag">Así se ve en el catálogo</span>
                            <div className="preview-img">🦐</div>
                            <h3>{productWizard.name || "Nombre del producto"}</h3>
                            <p className="preview-desc">{productWizard.description || "Describe el producto para que los clientes lo entiendan rápido."}</p>
                            <div className="preview-grades">
                              {productWizard.variants.slice(0, 2).map((variant) => (
                                <span key={variant.id} className="preview-grade">{variant.grade || "Grado"}</span>
                              ))}
                            </div>
                            <div className="preview-price-row">
                              <span>desde</span>
                              <strong>Q {productWizard.variants[0]?.unitPrice || "0"}</strong>
                            </div>
                            <div className="checklist">
                              <div className={`checklist-item ${productWizard.name.trim() ? "done" : ""}`}><span className="check-dot">✓</span> Nombre del producto</div>
                              <div className={`checklist-item ${productWizard.variants.some((variant) => Number(variant.unitPrice) > 0) ? "done" : ""}`}><span className="check-dot">✓</span> Al menos un grado con precio</div>
                              <div className={`checklist-item ${productWizard.description.trim() ? "done" : ""}`}><span className="check-dot">✓</span> Descripción agregada</div>
                              <div className={`checklist-item ${(productWizard.existingPhotos.length + productWizard.photoPreviews.length) > 0 ? "done" : ""}`}><span className="check-dot">✓</span> Al menos una foto</div>
                            </div>
                          </div>
                        </aside>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid" style={{ gap: 12, marginTop: 12 }}>
                    {products.length === 0 ? <p className="muted">No hay productos registrados.</p> : null}
                    {products.map((product) => {
                      const draft = productDrafts[product.id];
                      if (!draft) return null;
                      const gradeOptions = Array.from(
                        new Set([
                          draft.gradeLabel?.trim(),
                          ...getProductAssets(product.id)
                            .map((asset) => asset.grade?.trim())
                            .filter((grade): grade is string => Boolean(grade))
                        ].filter((grade): grade is string => Boolean(grade)))
                      );
                      const selectedGrade = selectedGradeByProduct[product.id] || gradeOptions[0] || "";
                      const gradeAssets = getImagesByProductAndGrade(product.id, selectedGrade);
                      return (
                        <article key={product.id} className="card admin-product-card">
                          <div className="admin-product-card-head">
                            <div>
                              <h4>{product.name}</h4>
                              <p className="muted">{product.category} · {product.gradeLabel || "Sin grado"}</p>
                            </div>
                            <div className="admin-product-card-actions">
                              <button type="button" className="admin-button secondary" onClick={() => openEditProductWizard(product)}>Editar</button>
                              <button type="button" className="admin-button secondary" onClick={() => void deleteProduct(product.id)}>Eliminar</button>
                            </div>
                          </div>
                          <div className="admin-grid-2" style={{ gap: 10 }}>
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
                            <strong>Imágenes del producto</strong>
                            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                              <select
                                value={selectedGrade}
                                onChange={(event) => setSelectedGradeByProduct((prev) => ({ ...prev, [product.id]: event.target.value }))}
                              >
                                <option value="">Seleccionar grado...</option>
                                {gradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                              </select>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                disabled={!selectedGrade || (uploading && uploadingProductId === product.id)}
                                onChange={async (event) => {
                                  const input = event.currentTarget;
                                  const file = event.target.files?.[0];
                                  if (!file || !selectedGrade) return;
                                  await handleUploadImage(product.id, selectedGrade, file);
                                  input.value = "";
                                }}
                              />
                              <p className="muted" style={{ fontSize: 12 }}>
                                Sube una imagen para este producto y grado.
                              </p>
                            </div>
                            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                              {!selectedGrade ? <p className="muted">Selecciona un grado para ver sus imágenes.</p> : null}
                              {selectedGrade && gradeAssets.length === 0 ? <p className="muted">Sin imágenes asignadas a este grado.</p> : null}
                              {gradeAssets.map((asset) => (
                                <div key={`${product.id}-${asset.filename}-${asset.grade || "grade"}`} className="card" style={{ padding: 10 }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 10, alignItems: "center" }}>
                                    {isVideoFile(asset.filename) ? (
                                      <video src={getMediaUrl(asset.filename)} aria-label={asset.title || asset.filename} style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover" }} muted loop playsInline controls={false} />
                                    ) : (
                                      <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={getMediaUrl(asset.filename)} alt={asset.title || asset.filename} style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover" }} />
                                      </>
                                    )}
                                    <div>
                                      <strong>{asset.grade || "Sin grado"}</strong>
                                      <p className="muted">{asset.title || asset.filename}</p>
                                      <button type="button" className="secondary" onClick={() => void removeMedia(product.id, asset.filename)}>Quitar</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {activeTab === "stats" ? (
                <div style={{ display: "grid", gap: 20 }}>
                  <section className="grid admin-kpi-grid">
                    <article className="card admin-kpi"><p className="muted">Pedidos totales</p><strong>{orders.length}</strong></article>
                    <article className="card admin-kpi"><p className="muted">Pendientes</p><strong style={{ color: "#ff6b35" }}>{ordersByStatus.PENDING}</strong></article>
                    <article className="card admin-kpi"><p className="muted">Confirmados</p><strong style={{ color: "#004e89" }}>{ordersByStatus.CONFIRMED}</strong></article>
                    <article className="card admin-kpi"><p className="muted">Entregados</p><strong style={{ color: "#1b998b" }}>{ordersByStatus.DELIVERED}</strong></article>
                    <article className="card admin-kpi"><p className="muted">Ingresos total</p><strong>Q {totalRevenue.toFixed(2)}</strong></article>
                    <article className="card admin-kpi"><p className="muted">Ticket promedio</p><strong>Q {(orders.length > 0 ? totalRevenue / orders.length : 0).toFixed(2)}</strong></article>
                  </section>

                  <section className="card">
                    <h3>Top 5 productos vendidos</h3>
                    <div style={{ marginTop: 12 }}>
                      {topProducts.length > 0 ? (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                              <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Producto</th>
                              <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Cantidad</th>
                              <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Ingresos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topProducts.map((product, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td style={{ padding: 8 }}>{product.name}</td>
                                <td style={{ padding: 8, textAlign: "right" }}>×{product.quantity}</td>
                                <td style={{ padding: 8, textAlign: "right", fontWeight: 500 }}>Q {product.revenue.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="muted">Sin datos de ventas</p>
                      )}
                    </div>
                  </section>

                  <section className="card">
                    <h3>Órdenes recientes</h3>
                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                      {recentOrders.slice(0, 5).map((order) => (
                        <div key={order.id} style={{ padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8, borderLeft: "4px solid #004e89" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <div>
                              <strong>{order.customerName}</strong>
                              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{order.whatsapp} · {order.city}</p>
                            </div>
                            <span className="badge" style={{ backgroundColor: order.status === "DELIVERED" ? "#1b998b" : order.status === "CONFIRMED" ? "#004e89" : "#ff6b35" }}>
                              {order.status === "DELIVERED" ? "Entregado" : order.status === "CONFIRMED" ? "Confirmado" : "Pendiente"}
                            </span>
                          </div>
                          <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 4 }}>{order.items.length} artículos</p>
                          <strong style={{ color: "#1b998b" }}>Q {Number(order.total || 0).toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}
          </section>
        </div>
      )}
    </main>
  );
}