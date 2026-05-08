"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { products } from "@/lib/data";
import { OrderItem, Product, ProductVariant } from "@/lib/types";
import { getVariantAvailabilityLabel, getVariantDisplayLabel, getVariantMedia, groupVariantsByGrade } from "@/lib/catalog";
import { calculateShipping } from "@/lib/shipping";

interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}

const CART_STORAGE_KEY = "gg_cart_v1";
const CART_OPEN_STORAGE_KEY = "gg_cart_open_v1";
const CART_SESSION_STORAGE_KEY = "gg_cart_session_v1";
const LAST_WHATSAPP_STORAGE_KEY = "gg_last_whatsapp_v1";
const WHATSAPP_CART_PREFIX = "gg_cart_whatsapp_";

function createCartSessionKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeWhatsapp(value: string) {
  return value.replace(/\D/g, "");
}

function getWhatsappCartKey(value: string) {
  const digits = normalizeWhatsapp(value);
  if (digits.length < 8) return "";
  return `${WHATSAPP_CART_PREFIX}${digits}`;
}

interface MediaSlide {
  type: "photo" | "video";
  src: string;
}

type PaymentMethod = "DEPOSITO_PREVIO" | "PAGO_CONTRAENTREGA" | "TARJETA_CUBO";

const WHATSAPP_NUMBER = "50243132549";

export default function HomePage() {
  type ConfirmPayload = {
    customerName: string;
    whatsapp: string;
    city: string;
    departamento?: string;
    paymentMethod: PaymentMethod;
    notes: string;
    items: OrderItem[];
    total: number;
    shippingCost: number;
    hp?: string;
  };
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const raw = typeof window === "undefined" ? null : window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CartLine[];
    } catch {
      // ignore
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(() => {
    try {
      const raw = typeof window === "undefined" ? null : window.localStorage.getItem(CART_OPEN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });
  const [cartSessionKey] = useState(() => {
    try {
      const raw = typeof window === "undefined" ? null : window.localStorage.getItem(CART_SESSION_STORAGE_KEY);
      if (raw) return raw;
    } catch {
      // ignore
    }

    return createCartSessionKey();
  });
  const [checkoutWhatsapp, setCheckoutWhatsapp] = useState(() => {
    try {
      return typeof window === "undefined" ? "" : window.localStorage.getItem(LAST_WHATSAPP_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentModal, setPaymentModal] = useState<null | { orderId: string; amount: number; customerName?: string }>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<null | { payload: ConfirmPayload; whatsappUrl: string; finalTotal: number }>(null);
  const [message, setMessage] = useState("");
  const [catalogProducts, setCatalogProducts] = useState(products);
  const [departamento, setDepartamento] = useState("Guatemala");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAGO_CONTRAENTREGA");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() =>
    products.reduce<Record<string, string>>((acc, product) => {
      acc[product.id] = product.variants[0]?.id || "";
      return acc;
    }, {})
  );
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [quickViewSlide, setQuickViewSlide] = useState(0);
  const [cartReady, setCartReady] = useState(false);
  const loadedWhatsappCartRef = useRef("");

  const quickViewProduct = useMemo(
    () => catalogProducts.find((item) => item.id === quickViewProductId) || null,
    [catalogProducts, quickViewProductId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog");
        if (!response.ok) return;

        const data = (await response.json()) as { products?: Product[] };
        if (!cancelled && Array.isArray(data.products)) {
          setCatalogProducts(data.products);
        }
      } catch {
        if (!cancelled) {
          setCatalogProducts(products);
        }
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_SESSION_STORAGE_KEY, cartSessionKey);
    } catch {
      // ignore
    }
  }, [cartSessionKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAST_WHATSAPP_STORAGE_KEY, checkoutWhatsapp);
    } catch {
      // ignore
    }
  }, [checkoutWhatsapp]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCart() {
      try {
        const whatsappKey = getWhatsappCartKey(checkoutWhatsapp);

        if (whatsappKey) {
          const whatsappResponse = await fetch(`/api/cart?key=${encodeURIComponent(whatsappKey)}`);
          if (whatsappResponse.ok) {
            const whatsappData = (await whatsappResponse.json()) as { cart?: { data?: unknown } };
            const whatsappCart = Array.isArray(whatsappData.cart?.data) ? (whatsappData.cart.data as CartLine[]) : [];

            if (!cancelled && whatsappCart.length > 0) {
              loadedWhatsappCartRef.current = whatsappKey;
              setCart(whatsappCart);
              setCartReady(true);
              return;
            }

            loadedWhatsappCartRef.current = whatsappKey;
          }
        }

        const sessionResponse = await fetch(`/api/cart?key=${encodeURIComponent(cartSessionKey)}`);
        if (sessionResponse.ok) {
          const sessionData = (await sessionResponse.json()) as { cart?: { data?: unknown } };
          const sessionCart = Array.isArray(sessionData.cart?.data) ? (sessionData.cart.data as CartLine[]) : [];

          if (!cancelled && sessionCart.length > 0) {
            setCart(sessionCart);
          }
        }
      } catch {
        // ignore hydration issues and fall back to local state
      } finally {
        if (!cancelled) {
          setCartReady(true);
        }
      }
    }

    void hydrateCart();

    return () => {
      cancelled = true;
    };
  }, [cartSessionKey, checkoutWhatsapp]);

  // persist cart to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_OPEN_STORAGE_KEY, JSON.stringify(isCartOpen));
    } catch {
      // ignore
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (!cartReady) return;

    const timer = window.setTimeout(() => {
      void fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key: cartSessionKey, data: cart })
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cart, cartReady, cartSessionKey]);

  useEffect(() => {
    if (!cartReady) return;

    const whatsappKey = getWhatsappCartKey(checkoutWhatsapp);
    if (!whatsappKey) {
      loadedWhatsappCartRef.current = "";
      return;
    }

    const timer = window.setTimeout(() => {
      if (cart.length === 0 && loadedWhatsappCartRef.current !== whatsappKey) {
        return;
      }

      void fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key: whatsappKey, data: cart })
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cart, cartReady, checkoutWhatsapp]);

  const cartDetail = useMemo(() => {
    return cart
      .map((line) => {
        const found = catalogProducts.find((product) => product.id === line.productId);
        if (!found) return null;
        const foundVariant = found.variants.find((variant) => variant.id === line.variantId);
        if (!foundVariant) return null;

        return {
          product: found,
          variant: foundVariant,
          qty: line.qty,
          subTotal: foundVariant.price * line.qty
        };
      })
      .filter(Boolean) as Array<{ product: Product; variant: ProductVariant; qty: number; subTotal: number }>;
  }, [cart, catalogProducts]);

  const total = useMemo(() => cartDetail.reduce((acc, item) => acc + item.subTotal, 0), [cartDetail]);

  const shippingInfo = useMemo(() => {
    const cartItems = cartDetail.map((item) => ({
      productId: item.product.id,
      variantId: item.variant.id,
      quantity: item.qty,
      price: item.variant.price
    }));

    return calculateShipping({
      departamento,
      paymentMethod,
      orderTotal: total,
      cartItems
    });
  }, [departamento, paymentMethod, total, cartDetail]);

  const finalTotal = useMemo(() => total + (shippingInfo.isValid ? shippingInfo.shippingCost : 0), [total, shippingInfo]);

  const totalItems = useMemo(
    () => cartDetail.reduce((acc, item) => acc + item.qty, 0),
    [cartDetail]
  );

  const contactWhatsappHref = `https://wa.me/${WHATSAPP_NUMBER}`;

  const catalogSections = useMemo(
    () => [
      {
        id: "neocaridinas",
        title: "Neocaridinas",
        description: "Líneas resistentes y variadas para acuarios plantados."
      },
      {
        id: "caridinas",
        title: "Caridinas",
        description: "Selección de caridinas para coleccionistas y proyectos especializados."
      },
      {
        id: "suplementos",
        title: "Suplementos",
        description: "Aditivos, bacterias y polvos para mantenimiento y salud de colonias."
      },
      {
        id: "accesorios",
        title: "Accesorios",
        description: "Equipos, sustratos, redes y accesorios esenciales."
      }
    ],
    []
  );

  const categoryAnchors = useMemo(
    () =>
      catalogSections.map((section) => ({
        ...section,
        count: catalogProducts.filter((product) => product.category === section.id).length
      })),
    [catalogSections, catalogProducts]
  );

  const getSelectedVariant = useCallback(
    (product: Product) => {
      const selected = selectedVariants[product.id];
      return product.variants.find((variant) => variant.id === selected) || product.variants[0];
    },
    [selectedVariants]
  );

  const quickViewSlides = useMemo<MediaSlide[]>(() => {
    if (!quickViewProduct) return [];
    const selectedVariant = getSelectedVariant(quickViewProduct);
    const media = getVariantMedia(quickViewProduct, selectedVariant);
    if (!media) return [];
    return [
      ...media.photos.map((src) => ({ type: "photo" as const, src })),
      ...media.videos.map((src) => ({ type: "video" as const, src }))
    ];
  }, [quickViewProduct, getSelectedVariant]);

  function setSelectedVariant(productId: string, variantId: string) {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  }

  function getCartQty(productId: string, variantId: string) {
    return cart.find((item) => item.productId === productId && item.variantId === variantId)?.qty || 0;
  }

  function addProduct(productId: string, variantId: string) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId && item.variantId === variantId);
      const product = catalogProducts.find((item) => item.id === productId);
      const variant = product?.variants.find((item) => item.id === variantId);

      if (!product || !variant) {
        return prev;
      }

      const nextQty = (existing?.qty || 0) + 1;
      if (variant.isActive === false || (typeof variant.stockAvailable === "number" && nextQty > variant.stockAvailable)) {
        setMessage(`Sin stock suficiente para ${product.name} - ${variant.label}.`);
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { productId, variantId, qty: 1 }];
    });
  }

  function decreaseProduct(productId: string, variantId: string) {
    setCart((prev) => {
      const current = prev.find((item) => item.productId === productId && item.variantId === variantId);
      if (!current) return prev;
      if (current.qty <= 1) {
        return prev.filter((item) => !(item.productId === productId && item.variantId === variantId));
      }
      return prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, qty: item.qty - 1 }
          : item
      );
    });
  }

  function openQuickView(product: Product) {
    setQuickViewProductId(product.id);
    setQuickViewSlide(0);
  }

  function closeQuickView() {
    setQuickViewProductId(null);
    setQuickViewSlide(0);
  }

  function productStockAlert(variant: ProductVariant) {
    return getVariantAvailabilityLabel(variant);
  }

  function isShrimpProduct(product: Product) {
    return product.category === "caridinas";
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (cartDetail.length === 0) {
      setMessage("Agrega al menos un producto al carrito para enviar tu pedido.");
      return;
    }

    // Validar que la orden sea válida (no tiene gambitas en inter-departamental)
    if (!shippingInfo.isValid) {
      setMessage(shippingInfo.message || "No se puede completar este pedido.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const customerName = String(form.get("customerName") || "");
    const customerWhatsapp = String(form.get("whatsapp") || checkoutWhatsapp || "").trim();
    const city = String(form.get("city") || "");
    const notes = String(form.get("notes") || "");

    if (!customerWhatsapp) {
      setMessage("Ingresa tu WhatsApp antes de continuar.");
      return;
    }

    setCheckoutWhatsapp(customerWhatsapp);
    const items = cartDetail.map<OrderItem>((item) => ({
      productId: item.product.id,
      variantId: item.variant.id,
      name: item.product.name,
      variantLabel: getVariantDisplayLabel(item.variant),
      category: item.product.category,
      unit: item.variant.unitLabel,
      unitPrice: item.variant.price,
      quantity: item.qty
    }));

    const payload = {
      customerName,
      whatsapp: customerWhatsapp,
      city,
      departamento,
      paymentMethod,
      notes,
      items,
      total,
      shippingCost: shippingInfo.shippingCost
    };

    const shippingLine = shippingInfo.shippingCost > 0 ? `Envío FORZA Delivery (+3.8%): Q ${shippingInfo.shippingCost.toFixed(2)}` : "Envío: Incluido / Deposito previo";

    const whatsappLines = [
      "Hola, quiero confirmar este pedido:",
      ...cartDetail.map((item) => `${item.product.name} - ${getVariantDisplayLabel(item.variant)} x ${item.qty}`),
      "",
      `Cliente: ${customerName}`,
      `WhatsApp: ${customerWhatsapp}`,
      `Ciudad: ${city}`,
      `Departamento: ${departamento}`,
      `Método de pago: ${paymentMethod === "DEPOSITO_PREVIO" ? "Depósito previo" : paymentMethod === "TARJETA_CUBO" ? "Tarjeta Cubo" : "Pago contra entrega"}`,
      notes ? `Notas: ${notes}` : "",
      "---",
      `Subtotal: Q ${total.toFixed(2)}`,
      shippingLine,
      `Total: Q ${finalTotal.toFixed(2)}`
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappLines.join("\n"))}`;

    // open confirmation modal with payload
    setConfirmModal({ payload, whatsappUrl, finalTotal });
  }

  async function confirmAndSend(payload: ConfirmPayload, whatsappUrl: string, finalTotal: number) {
    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || "Error al crear pedido");
      }

      const createdOrder = (await response.json()) as { order?: { id?: string } };
      let shouldOpenWhatsapp = true;

      if (paymentMethod === "TARJETA_CUBO" && createdOrder.order?.id) {
        setPaymentModal({ orderId: createdOrder.order.id, amount: finalTotal, customerName: payload.customerName });
        shouldOpenWhatsapp = false;
      }

      if (shouldOpenWhatsapp) {
        const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (!popup) window.location.assign(whatsappUrl);
      }

      setMessage("Pedido registrado.");
      setCart([]);
      setDepartamento("Guatemala");
      setPaymentMethod("PAGO_CONTRAENTREGA");
      setConfirmModal(null);
    } catch (err) {
      setMessage(String(err) || "No se pudo enviar el pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePayWithCubo(orderId: string, amount: number) {
    setPaymentProcessing(true);
    try {
      const resp = await fetch("/api/payments/cubo/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount, currency: "GTQ" })
      });
      if (!resp.ok) throw new Error("No se pudo iniciar pago");
      const data = await resp.json() as { checkoutUrl?: string; message?: string };
      if (data.checkoutUrl) {
        // redirect to hosted checkout
        window.location.assign(data.checkoutUrl);
      } else {
        setMessage(data.message || "No se pudo iniciar el pago en línea.");
      }
    } catch (err) {
      setMessage(String(err) || "Error al iniciar pago");
    } finally {
      setPaymentProcessing(false);
      setPaymentModal(null);
    }
  }

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="brand">Guate<span>Gambas</span></div>
          <nav className="nav">
            <a href="#catalogo">Catálogo</a>
            <a href="#checkout">Pedido</a>
            <a href="/admin">Admin</a>
          </nav>
        </div>
      </header>

      <main className="container with-floating-cart">
        <section className="hero">
          <div className="hero-bar">
            <div>
              <span className="badge">Venta directa</span>
              <h1>Gambas y accesorios para tu acuario.</h1>
            </div>
            <a className="quick-link" href="#catalogo">
              Ver catálogo
            </a>
          </div>
          <div className="hero-summary">
            <article className="summary-card accent-card">
              <span className="summary-label">Ubicación</span>
              <strong>Zona 8 - Entrega y compra en local</strong>
              <p>Retira tus pedidos directamente en nuestras instalaciones en Ciudad de Guatemala.</p>
            </article>
            <article className="summary-card">
              <span className="summary-label">Envío gratis</span>
              <strong>Costo Q 0 con compras desde Q 50</strong>
              <p>Entrega rápida a domicilio en zona 8 y alrededores sin costo adicional.</p>
            </article>
            <article className="summary-card">
              <span className="summary-label">Pedido seguro</span>
              <strong>Confirma por WhatsApp, paga al retirar</strong>
              <p>Proceso simple: agrega al carrito, confirma por WhatsApp y completa tu compra.</p>
            </article>
          </div>
          <div className="hero-tags hero-tags-tight">
            <a href="#catalogo">Explorar productos</a>
            <a href="#checkout">Finalizar pedido</a>
            <a href="/admin">Administración</a>
          </div>
        </section>

        <section className="section section-anchors">
          <div className="anchor-strip">
            {categoryAnchors.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="anchor-pill">
                <span>{section.title}</span>
                <strong>{section.count}</strong>
              </a>
            ))}
          </div>
        </section>

        <section id="catalogo" className="section">
          <div className="section-head">
            <div>
              <h2>Productos disponibles</h2>
              <p className="muted">Selecciona una categoría, elige variante y agrégala al carrito.</p>
            </div>
          </div>

          {catalogSections.map((section) => (
            <div key={section.id} id={section.id} className="catalog-group">
              <div className="catalog-group-head">
                <div>
                  <h3>{section.title}</h3>
                  <p className="muted">{section.description}</p>
                </div>
                <span className="group-count">{categoryAnchors.find((item) => item.id === section.id)?.count} productos</span>
              </div>
              <div className="product-grid">
                {catalogProducts
                  .filter((product) => product.category === section.id)
                  .map((product) => (
                    <article key={product.id} className="product-card">
                      {(() => {
                        const selectedVariant = getSelectedVariant(product);
                        const selectedQty = getCartQty(product.id, selectedVariant.id);
                        const stockLabel = getVariantAvailabilityLabel(selectedVariant);
                        const stockAvailable = selectedVariant.stockAvailable;
                        const canAdd =
                          selectedVariant.isActive !== false &&
                          (typeof stockAvailable !== "number" || stockAvailable > selectedQty);
                        return (
                          <>
                            <div className="product-card-top">
                              <span className={`badge badge-soft ${stockLabel === "Agotado" || stockLabel === "No disponible" ? "badge-danger" : ""}`}>
                                {stockLabel}
                              </span>
                              <span className="product-price">Q {selectedVariant.price.toFixed(2)}</span>
                            </div>
                            <h3>{product.name}</h3>
                            <p className="muted">{product.description}</p>
                            {product.note ? <p className="product-note">{product.note}</p> : null}
                            {isShrimpProduct(product) ? (
                              <div className="variant-stack">
                                {groupVariantsByGrade(product).map(([grade, variants]) => (
                                  <div key={grade} className="variant-group">
                                    <div className="variant-group-title">{grade}</div>
                                    <div className="variant-picker variant-picker-card">
                                      {variants.map((variant) => (
                                        <button
                                          key={variant.id}
                                          type="button"
                                          className={selectedVariant.id === variant.id ? "variant-button active" : "variant-button"}
                                          aria-pressed={selectedVariant.id === variant.id}
                                          onClick={() => setSelectedVariant(product.id, variant.id)}
                                        >
                                          {getVariantDisplayLabel(variant)} - Q {variant.price.toFixed(2)}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="variant-picker variant-picker-card">
                                {product.variants.map((variant) => (
                                  <button
                                    key={variant.id}
                                    type="button"
                                    className={selectedVariant.id === variant.id ? "variant-button active" : "variant-button"}
                                    aria-pressed={selectedVariant.id === variant.id}
                                    onClick={() => setSelectedVariant(product.id, variant.id)}
                                  >
                                    {variant.label} - Q {variant.price.toFixed(2)}
                                  </button>
                                ))}
                              </div>
                            )}
                            <p className="product-meta">{selectedVariant.unitLabel}</p>
                            {productStockAlert(selectedVariant) ? (
                              <p className="stock-chip">{productStockAlert(selectedVariant)}</p>
                            ) : null}
                            <div className="actions">
                              {selectedQty === 0 ? (
                                <button type="button" disabled={!canAdd} onClick={() => addProduct(product.id, selectedVariant.id)}>
                                  {canAdd ? "Agregar al carrito" : "Agotado"}
                                </button>
                              ) : (
                                <div className="qty-control">
                                  <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => decreaseProduct(product.id, selectedVariant.id)}
                                  >
                                    -
                                  </button>
                                  <span>{selectedQty}</span>
                                  <button type="button" disabled={!canAdd} onClick={() => addProduct(product.id, selectedVariant.id)}>
                                    +
                                  </button>
                                </div>
                              )}
                              <button type="button" className="secondary" onClick={() => openQuickView(product)}>
                                Ver multimedia
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </section>

        <section id="checkout" className="section">
          <h2>Finalizar pedido</h2>
          <div className="checkout-grid">
            <form className="card order-form" onSubmit={submitOrder}>
                <input name="hp" style={{ display: "none" }} />
              <input name="customerName" placeholder="Tu nombre" required />
              <input
                name="whatsapp"
                value={checkoutWhatsapp}
                onChange={(event) => setCheckoutWhatsapp(event.target.value)}
                placeholder="Tu WhatsApp"
                autoComplete="tel"
                required
              />
              <input name="email" placeholder="Correo electrónico (opcional)" />
              <input name="city" placeholder="Ciudad o zona" required />
              
              <fieldset>
                <legend>Departamento</legend>
                <select value={departamento} onChange={(e) => setDepartamento(e.target.value)} required>
                  <option value="Guatemala">Guatemala (sin cargo)</option>
                  <option value="Alta Verapaz">Alta Verapaz</option>
                  <option value="Baja Verapaz">Baja Verapaz</option>
                  <option value="Chimaltenango">Chimaltenango</option>
                  <option value="Chiquimula">Chiquimula</option>
                  <option value="El Progreso">El Progreso</option>
                  <option value="Escuintla">Escuintla</option>
                  <option value="Huehuetenango">Huehuetenango</option>
                  <option value="Izabal">Izabal</option>
                  <option value="Jalapa">Jalapa</option>
                  <option value="Jutiapa">Jutiapa</option>
                  <option value="Petén">Petén</option>
                  <option value="Quetzaltenango">Quetzaltenango</option>
                  <option value="Quiché">Quiché</option>
                  <option value="Retalhuleu">Retalhuleu</option>
                  <option value="Sacatepéquez">Sacatepéquez</option>
                  <option value="San Marcos">San Marcos</option>
                  <option value="Santa Rosa">Santa Rosa</option>
                  <option value="Santiago Sacatepéquez">Santiago Sacatepéquez</option>
                  <option value="Sololá">Sololá</option>
                  <option value="Suchitepéquez">Suchitepéquez</option>
                  <option value="Totonicapán">Totonicapán</option>
                  <option value="Zacapa">Zacapa</option>
                </select>
              </fieldset>

              <fieldset>
                <legend>Forma de pago</legend>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="DEPOSITO_PREVIO"
                      checked={paymentMethod === "DEPOSITO_PREVIO"}
                      onChange={() => setPaymentMethod("DEPOSITO_PREVIO")}
                    />
                    Depósito previo (precio catálogo)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="TARJETA_CUBO"
                      checked={paymentMethod === "TARJETA_CUBO"}
                      onChange={() => setPaymentMethod("TARJETA_CUBO")}
                    />
                    Tarjeta con Cubo
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PAGO_CONTRAENTREGA"
                      checked={paymentMethod === "PAGO_CONTRAENTREGA"}
                      onChange={() => setPaymentMethod("PAGO_CONTRAENTREGA")}
                    />
                    Pago contra entrega
                  </label>
                </div>
              </fieldset>

              {shippingInfo.message && (
                <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                  {shippingInfo.message}
                </div>
              )}

              <textarea name="notes" rows={4} placeholder="Notas de entrega, horario o referencia" />
              <button type="submit" disabled={isSubmitting || cartDetail.length === 0}>
                {isSubmitting ? "Enviando por WhatsApp..." : "Enviar pedido por WhatsApp"}
              </button>
              {message ? <p className="muted">{message}</p> : null}
              <p className="muted">El pedido se abre en WhatsApp con tu resumen y también queda registrado.</p>
            </form>

              {confirmModal ? (
                <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
                  <article className="modal-card" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-head">
                      <h3>Confirmar pedido</h3>
                      <button type="button" className="secondary" onClick={() => setConfirmModal(null)}>Cerrar</button>
                    </div>
                    <div className="card">
                      <p className="muted">Total a pagar: Q {confirmModal.finalTotal.toFixed(2)}</p>
                      <p className="muted">Revisa los datos antes de confirmar. El pedido quedará registrado en el sistema.</p>
                      <div className="actions">
                        <button type="button" onClick={() => confirmAndSend(confirmModal.payload, confirmModal.whatsappUrl, confirmModal.finalTotal)} disabled={isSubmitting}>
                          {isSubmitting ? "Enviando..." : "Confirmar y enviar pedido"}
                        </button>
                        <button type="button" className="secondary" onClick={() => setConfirmModal(null)}>Volver</button>
                      </div>
                    </div>
                  </article>
                </div>
              ) : null}

            <article className="card">
              <h3>Compra asistida</h3>
              <p className="muted">Si prefieres cerrar por chat, usa el botón de pedido o escríbenos al 43132549.</p>
              <p className="muted">Atención directa por WhatsApp para confirmaciones y dudas.</p>
            </article>
          </div>
        </section>
      </main>

      <aside className={"floating-cart card" + (isCartOpen ? " open" : " closed")}>
        <div className="cart-head">
          <h3>Tu carrito ({totalItems})</h3>
          <div className="cart-actions">
            <button type="button" className="secondary" onClick={() => setIsCartOpen((s) => !s)}>
              {isCartOpen ? "Minimizar" : "Abrir"}
            </button>
          </div>
        </div>
        {cartDetail.length === 0 ? (
          <p className="muted">Agrega productos para empezar a comprar.</p>
        ) : (
          <ul>
            {cartDetail.map((item) => (
              <li key={`${item.product.id}-${item.variant.id}`}>
                <div>
                  <strong>{item.product.name}</strong>
                  <p className="muted">{getVariantDisplayLabel(item.variant)}</p>
                </div>
                <div className="floating-cart-line">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => decreaseProduct(item.product.id, item.variant.id)}
                  >
                    -
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => addProduct(item.product.id, item.variant.id)}>+</button>
                  <span>Q {item.subTotal.toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="cart-total">Subtotal: Q {total.toFixed(2)}</p>
        {shippingInfo.shippingCost > 0 && (
          <p className="cart-total" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Envío (+3.8%): Q {shippingInfo.shippingCost.toFixed(2)}
          </p>
        )}
        <p className="cart-total" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Total: Q {finalTotal.toFixed(2)}
        </p>
        <a className="checkout-link" href="#checkout">
          Finalizar pedido
        </a>
      </aside>

      <a className="whatsapp-float" href={contactWhatsappHref} target="_blank" rel="noreferrer">
        WhatsApp 43132549
      </a>

      {totalItems > 0 ? (
        <div className="mobile-checkout-cta">
          <a className="quick-link" href="#checkout">Finalizar pedido · Q {finalTotal.toFixed(2)}</a>
        </div>
      ) : null}

      {paymentModal ? (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <article className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Pago con tarjeta</h3>
              <button type="button" className="secondary" onClick={() => setPaymentModal(null)}>Cerrar</button>
            </div>
            <p className="muted">Orden: {paymentModal.orderId}</p>
            <div className="card">
              <h4>Resumen de pago</h4>
              <p>Importe a pagar: Q {paymentModal.amount.toFixed(2)}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => handlePayWithCubo(paymentModal.orderId, paymentModal.amount)} disabled={paymentProcessing}>
                  {paymentProcessing ? "Procesando…" : "Pagar con tarjeta"}
                </button>
                <button type="button" className="secondary" onClick={() => { setPaymentModal(null); window.open(contactWhatsappHref, "_blank", "noopener"); }}>
                  Pagar por WhatsApp
                </button>
              </div>
            </div>
          </article>
        </div>
      ) : null}

      {quickViewProduct ? (
        <div className="modal-overlay" onClick={closeQuickView}>
          <article className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>{quickViewProduct.name}</h3>
              <button type="button" className="secondary" onClick={closeQuickView}>
                Cerrar
              </button>
            </div>
            <p className="muted">{quickViewProduct.description}</p>
            <div className="modal-media">
              {quickViewSlides.length ? (
                <>
                  <div className="carousel-stage">
                    {quickViewSlides[quickViewSlide]?.type === "photo" ? (
                      <Image
                        src={quickViewSlides[quickViewSlide].src}
                        alt={quickViewProduct.name}
                        width={960}
                        height={540}
                        sizes="(max-width: 900px) 92vw, 800px"
                      />
                    ) : (
                      <video controls src={quickViewSlides[quickViewSlide].src} />
                    )}
                  </div>
                  <div className="carousel-controls">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setQuickViewSlide((prev) =>
                          prev === 0 ? quickViewSlides.length - 1 : prev - 1
                        )
                      }
                    >
                      Anterior
                    </button>
                    <span>
                      {quickViewSlide + 1} / {quickViewSlides.length}
                    </span>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setQuickViewSlide((prev) =>
                          prev === quickViewSlides.length - 1 ? 0 : prev + 1
                        )
                      }
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="carousel-thumbs">
                    {quickViewSlides.map((slide, index) => (
                      <button
                        key={`${slide.src}-${index}`}
                        type="button"
                        className={index === quickViewSlide ? "secondary" : ""}
                        onClick={() => setQuickViewSlide(index)}
                      >
                        {slide.type === "photo" ? `Foto ${index + 1}` : `Video ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="muted">Proximamente, ya ire subiendo fotos y videos para este producto.</p>
              )}
              <div className="card">
                <h4>Opciones disponibles</h4>
                <div className="variant-picker">
                  {quickViewProduct.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      className={selectedVariants[quickViewProduct.id] === variant.id ? "secondary" : ""}
                      onClick={() => setSelectedVariant(quickViewProduct.id, variant.id)}
                    >
                      {variant.label} - Q {variant.price.toFixed(2)}
                    </button>
                  ))}
                </div>
                <div className="actions">
                  <button
                    type="button"
                    onClick={() => addProduct(quickViewProduct.id, getSelectedVariant(quickViewProduct).id)}
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
