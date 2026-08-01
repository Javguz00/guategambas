"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { products } from "@/lib/data";
import { OrderItem, Product, ProductVariant } from "@/lib/types";
import { getVariantDisplayLabel, getVariantMedia, groupVariantsByGrade } from "@/lib/catalog";
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
const LAST_ORDER_STORAGE_KEY = "gg_last_order_v1";

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

type MediaAsset = {
  filename: string;
  grade?: string;
  slot?: string;
  title?: string;
};

type PaymentMethod = "DEPOSITO_PREVIO" | "PAGO_CONTRAENTREGA";

const catalogSkeletonCards = Array.from({ length: 4 }, (_, index) => index);

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
  const [confirmModal, setConfirmModal] = useState<null | { payload: ConfirmPayload; finalTotal: number }>(null);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  const [catalogProducts, setCatalogProducts] = useState(products);
  const [catalogLoading, setCatalogLoading] = useState(true);
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
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [mediaMapping, setMediaMapping] = useState<Record<string, MediaAsset[]>>({});
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [cartReady, setCartReady] = useState(false);
  const loadedWhatsappCartRef = useRef("");

  async function readErrorResponse(response: Response, context: string, payload?: unknown) {
    const text = await response.text();
    console.error(`Storefront fetch failed: ${context}`, {
      status: response.status,
      statusText: response.statusText,
      payload,
      body: text
    });
    return text;
  }

  function showToast(message: string, variant: "success" | "info" = "success") {
    setToast({ message, variant });
  }

  const quickViewProduct = useMemo(
    () => catalogProducts.find((item) => item.id === quickViewProductId) || null,
    [catalogProducts, quickViewProductId]
  );

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);

    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog");
        if (!response.ok) {
          await readErrorResponse(response, "GET /api/catalog");
          if (!cancelled) {
            setCatalogProducts(products);
            setCatalogLoading(false);
          }
          return;
        }

        const data = (await response.json()) as { products?: Product[] };
        if (!cancelled && Array.isArray(data.products)) {
          setCatalogProducts(data.products);
          setCatalogLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCatalogProducts(products);
          setCatalogLoading(false);
        }
      }
    }

    void loadCatalog();

    (async () => {
      try {
        const response = await fetch("/api/site-media");
        if (!response.ok) {
          await readErrorResponse(response, "GET /api/site-media");
          return;
        }
        const json = (await response.json()) as { mapping?: Record<string, MediaAsset[]> };
        if (!cancelled) {
          setMediaMapping(json.mapping || {});
        }
      } catch {
        // ignore
      }
    })();

    // load social link metadata for the footer/header if needed later
    (async () => {
      try {
        const resp = await fetch("/api/social");
        if (!resp.ok) {
          await readErrorResponse(resp, "GET /api/social");
          return;
        }
        await resp.json();
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
          } else {
            await readErrorResponse(whatsappResponse, "GET /api/cart (whatsapp cart)", { whatsappKey });
          }
        }

        const sessionResponse = await fetch(`/api/cart?key=${encodeURIComponent(cartSessionKey)}`);
        if (sessionResponse.ok) {
          const sessionData = (await sessionResponse.json()) as { cart?: { data?: unknown } };
          const sessionCart = Array.isArray(sessionData.cart?.data) ? (sessionData.cart.data as CartLine[]) : [];

          if (!cancelled && sessionCart.length > 0) {
            setCart(sessionCart);
          }
        } else {
          await readErrorResponse(sessionResponse, "GET /api/cart (session cart)", { cartSessionKey });
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
      void (async () => {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ key: cartSessionKey, data: cart })
        });
        if (!response.ok) {
          await readErrorResponse(response, "POST /api/cart (session save)", { cartSessionKey, items: cart.length });
        }
      })();
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

      void (async () => {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ key: whatsappKey, data: cart })
        });
        if (!response.ok) {
          await readErrorResponse(response, "POST /api/cart (whatsapp save)", { whatsappKey, items: cart.length });
        }
      })();
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

  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);

  const contactWhatsappHref = `https://wa.me/${WHATSAPP_NUMBER}`;

  const catalogSections = useMemo(() => {
    const descriptions: Record<string, string> = {
      neocaridinas: "Líneas resistentes y variadas para acuarios plantados.",
      caridinas: "Selección de caridinas para coleccionistas y proyectos especializados.",
      suplementos: "Aditivos, bacterias y polvos para mantenimiento y salud de colonias.",
      accesorios: "Equipos, sustratos, redes y accesorios esenciales.",
      insumos: "Materiales de apoyo para mantener el acuario en óptimas condiciones.",
      plantas: "Plantas y elementos vivos para ecosistemas más estables."
    };

    const categories = Array.from(new Set(catalogProducts.map((product) => product.category)));
    return categories.map((category) => ({
      id: category,
      title: category.charAt(0).toUpperCase() + category.slice(1),
      description: descriptions[category] || "Categoría gestionada desde el panel admin."
    }));
  }, [catalogProducts]);

  const categoryAnchors = useMemo(
    () =>
      catalogSections.map((section) => ({
        ...section,
        count: catalogProducts.filter((product) => product.category === section.id).length
      })),
    [catalogSections, catalogProducts]
  );

  const filteredCatalogProducts = useMemo(
    () =>
      activeFilter === "all"
        ? catalogProducts
        : catalogProducts.filter((product) => product.category === activeFilter),
    [activeFilter, catalogProducts]
  );

  function getProductMediaAssets(productId: string) {
    return mediaMapping[productId] || [];
  }

  function getSiteMedia(slot: "hero" | "banner" | "promo") {
    return mediaMapping.__site__?.find((asset) => asset.slot === slot)?.filename || "";
  }

  function isVideoFile(filename: string) {
    return /\.(mp4|webm|mov|m4v)$/i.test(filename);
  }

  function getMediaUrl(filename: string) {
    if (!filename) return "";
    if (filename.startsWith("/")) return filename;
    return `/api/media/${filename.split("/").map(encodeURIComponent).join("/")}`;
  }

  function renderSiteMedia(filename: string, alt: string, className: string, width: number, height: number, sizes: string, priority = false) {
    if (!filename) return null;
    if (isVideoFile(filename)) {
      return <video className={className} src={getMediaUrl(filename)} aria-label={alt} autoPlay muted loop playsInline controls={false} />;
    }
    return <Image className={className} src={getMediaUrl(filename)} alt={alt} width={width} height={height} sizes={sizes} priority={priority} />;
  }

  function pickProductCardImage(product: Product, variant: ProductVariant) {
    const assigned = getProductMediaAssets(product.id);
    const grade = (variant.gradeLabel || variant.highlight || "").trim();
    const matchesGrade = assigned.filter((asset) => asset.grade && asset.grade.trim() === grade);
    const coverImage = assigned.find((asset) => asset.slot === "cover" && (!asset.grade || asset.grade.trim() === grade));
    const buttonImage = assigned.find((asset) => asset.slot === "button" && (!asset.grade || asset.grade.trim() === grade));
    const heroLike = assigned.find((asset) => !asset.slot || asset.slot === "gallery");
    return (
      coverImage?.filename ||
      buttonImage?.filename ||
      matchesGrade[0]?.filename ||
      heroLike?.filename ||
      getVariantMedia(product, variant)?.photos?.[0] ||
      product.media?.photos?.[0] ||
      ""
    );
  }

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
    let toastMessage = "";
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
        toastMessage = `Agregaste ${product.name} - ${variant.label} al carrito.`;
        return prev.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      toastMessage = `Agregaste ${product.name} - ${variant.label} al carrito.`;
      return [...prev, { productId, variantId, qty: 1 }];
    });
    if (toastMessage) showToast(toastMessage);
  }

  function addProductQuantity(productId: string, variantId: string, quantity: number) {
    if (quantity <= 0) return;
    let toastMessage = "";
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId && item.variantId === variantId);
      const product = catalogProducts.find((item) => item.id === productId);
      const variant = product?.variants.find((item) => item.id === variantId);

      if (!product || !variant) {
        return prev;
      }

      const nextQty = (existing?.qty || 0) + quantity;
      if (variant.isActive === false || (typeof variant.stockAvailable === "number" && nextQty > variant.stockAvailable)) {
        setMessage(`Sin stock suficiente para ${product.name} - ${variant.label}.`);
        return prev;
      }

      if (existing) {
        toastMessage = `Agregaste ${quantity} unidades de ${product.name}.`;
        return prev.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, qty: item.qty + quantity }
            : item
        );
      }

      toastMessage = `Agregaste ${quantity} unidades de ${product.name}.`;
      return [...prev, { productId, variantId, qty: quantity }];
    });
    if (toastMessage) showToast(toastMessage);
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
    setQuickViewQty(1);
  }

  function closeQuickView() {
    setQuickViewProductId(null);
    setQuickViewSlide(0);
    setQuickViewQty(1);
  }

  function isShrimpProduct(product: Product) {
    return product.category === "caridinas" || product.category === "neocaridinas";
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
    const address = String(form.get("address") || "").trim();
    const email = String(form.get("email") || "").trim();
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
      city: address,
      departamento,
      paymentMethod,
      notes: email ? `${notes}\nEmail: ${email}`.trim() : notes,
      items,
      total,
      shippingCost: shippingInfo.shippingCost
    };

    setConfirmModal({ payload, finalTotal });
  }

  async function confirmAndSend(payload: ConfirmPayload) {
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
        const txt = await readErrorResponse(response, "POST /api/orders", payload);
        throw new Error(txt || "Error al crear pedido");
      }

      const result = (await response.json()) as { whatsappUrl?: string; order?: { id?: string } };
      const whatsappUrl = typeof result.whatsappUrl === "string" ? result.whatsappUrl : "";
      const orderId = typeof result.order?.id === "string" ? result.order.id : "";

      const shouldOpenWhatsapp = true;

      if (shouldOpenWhatsapp && whatsappUrl) {
        const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (!popup) window.location.assign(whatsappUrl);
      }

      try {
        window.localStorage.setItem(
          LAST_ORDER_STORAGE_KEY,
          JSON.stringify({
            orderId,
            payload,
            finalTotal,
            whatsappUrl,
            createdAt: new Date().toISOString(),
            shippingMessage: shippingInfo.message || ""
          })
        );
      } catch {
        // ignore
      }

      setMessage("Pedido registrado.");
      setCart([]);
      setDepartamento("Guatemala");
      setPaymentMethod("PAGO_CONTRAENTREGA");
      setConfirmModal(null);
      if (orderId) {
        window.location.assign(`/pedido-confirmado?orderId=${encodeURIComponent(orderId)}`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo enviar el pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {toast ? (
        <div className={`toast-banner ${toast.variant}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="brand">Guate<span>Gambas</span></Link>
          <nav className="nav">
            <a href="#neocaridinas">Neocaridinas</a>
            <a href="#caridinas">Caridinas</a>
            <a href="#suplementos">Suplementos</a>
            <a href="#accesorios">Accesorios</a>
            <a href="#checkout">Pedido</a>
            <a href="/admin">Admin</a>
          </nav>
        </div>
      </header>

      <main className="container with-floating-cart storefront-page">
        <section className="hero storefront-hero">
          <div className="hero-copy">
            <span className="eyebrow">Cría local · Zona 8, Ciudad de Guatemala</span>
            <h1>Gambas ornamentales criadas con <em>cuidado real</em>.</h1>
            <p className="hero-intro">Neocaridinas y caridinas de grado seleccionado, accesorios para acuarios plantados y envío directo por WhatsApp.</p>
            <div className="hero-ctas">
              <a className="btn-primary" href="#catalogo">Ver catálogo</a>
              <a className="btn-ghost" href="#checkout">Escribir por WhatsApp</a>
            </div>
            <div className="hero-trust">
              <div className="trust-item"><span className="mono">{catalogProducts.length}</span> productos activos</div>
              <div className="trust-item"><span className="mono">Q 50</span> envío local desde</div>
              <div className="trust-item"><span className="mono">2</span> grados por línea</div>
            </div>
          </div>

          <div className="hero-visual">
            {getSiteMedia("hero") ? (
              renderSiteMedia(getSiteMedia("hero"), "Portada principal", "home-banner-media", 1400, 1400, "(max-width: 900px) 100vw, 55vw", true)
            ) : (
              <span className="hero-visual-glyph">🦐</span>
            )}
          </div>
        </section>

        <section className="section storefront-strip">
          <div className="strip-item">
            <span className="tag">Ubicación</span>
            <h3>Retiro en Zona 8</h3>
            <p>Retira tu pedido en nuestras instalaciones en Ciudad de Guatemala.</p>
          </div>
          <div className="strip-item">
            <span className="tag">Envío</span>
            <h3>Gratis desde Q 50</h3>
            <p>Entrega a domicilio en zona 8 y alrededores sin costo adicional.</p>
          </div>
          <div className="strip-item">
            <span className="tag">Pedido</span>
            <p>Agrega al carrito, confirma por WhatsApp y paga al retirar o por depósito previo.</p>
          </div>
        </section>

        <section className="section storefront-categories">
          <div className="section-head">
            <div>
              <span className="label">Explora por línea</span>
              <h2>Categorías</h2>
            </div>
          </div>
          <div className="cat-rail">
            {catalogSections.map((section) => {
              const cardClass = section.id === "neocaridinas" ? "c1" : section.id === "caridinas" ? "c2" : section.id === "suplementos" ? "c3" : "c4";
              return (
                <a key={section.id} href={`#${section.id}`} className={`cat-card ${cardClass}`}>
                  <span className="count">{categoryAnchors.find((item) => item.id === section.id)?.count ?? 0} productos</span>
                  <div>
                    <h3>{section.title}</h3>
                    <div className="sub">{section.description}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="section storefront-filters">
          <div className="filter-row">
            {[{ id: "all", label: "Todas" }, ...catalogSections.map((section) => ({ id: section.id, label: section.title }))].map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`chip${activeFilter === filter.id ? " active" : ""}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="section announcement">
          <div className="card accent-card announcement-card">
            <div className="announcement-card-head">
              <div>
                <h3>Anuncios y publicaciones</h3>
                <p className="muted">Banner editable para promociones, anuncios y piezas destacadas.</p>
              </div>
              <a href="https://instagram.com/guategambas" target="_blank" rel="noreferrer">Instagram</a>
            </div>

            {getSiteMedia("promo") ? (
              <div className="announcement-banner">
                {renderSiteMedia(getSiteMedia("promo"), "Banner de anuncios", "home-banner-media", 1600, 600, "(max-width: 1100px) 100vw, 1120px")}
              </div>
            ) : (
              <div className="announcement-banner announcement-banner-empty">
                <div>
                  <strong>Banner de anuncios</strong>
                  <p className="muted">Sube aquí imágenes específicas para promociones y publicaciones del sitio.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="catalogo" className="section">
          <div className="section-head">
            <div>
              <h2>Productos disponibles</h2>
              <p className="muted">Filtra por línea, elige variante y agrégala al carrito en un clic.</p>
            </div>
          </div>

          {catalogLoading ? (
            <div className="product-grid" aria-busy="true" aria-live="polite">
              {catalogSkeletonCards.map((index) => (
                <article key={index} className="storefront-product-card skeleton-card">
                  <div className="skeleton skeleton-media" />
                  <div className="storefront-card-copy">
                    <div className="storefront-card-labels">
                      <span className="skeleton skeleton-pill" />
                      <span className="skeleton skeleton-pill short" />
                    </div>
                    <div className="skeleton skeleton-line title" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                  <div className="storefront-card-footer">
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-line button" />
                  </div>
                </article>
              ))}
            </div>
          ) : catalogSections.map((section) => {
            const sectionProducts = filteredCatalogProducts.filter((product) => product.category === section.id);
            if (sectionProducts.length === 0) return null;
            return (
              <div key={section.id} id={section.id} className="catalog-group">
                <div className="catalog-group-head">
                  <div>
                    <h3>{section.title}</h3>
                    <p className="muted">{section.description}</p>
                  </div>
                  <span className="group-count">{sectionProducts.length} productos</span>
                </div>
                <div className="product-grid">
                  {sectionProducts.map((product) => (
                    <article key={product.id} className="storefront-product-card">
                      {(() => {
                        const selectedVariant = getSelectedVariant(product);
                        const selectedQty = getCartQty(product.id, selectedVariant.id);
                        const stockAvailable = selectedVariant.stockAvailable;
                        const coverPhoto = pickProductCardImage(product, selectedVariant);
                        const canAdd =
                          selectedVariant.isActive !== false &&
                          (typeof stockAvailable !== "number" || stockAvailable > selectedQty);
                        return (
                          <>
                            {coverPhoto ? (
                              <div className="storefront-product-visual">
                                <Image
                                  src={coverPhoto.startsWith("/") ? coverPhoto : getMediaUrl(coverPhoto)}
                                  alt={product.name}
                                  width={640}
                                  height={520}
                                  sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 320px"
                                />
                              </div>
                            ) : null}
                            <div className="storefront-card-copy">
                              <div className="storefront-card-labels">
                                <span className="line-tag">{product.category}</span>
                                <span className="product-price">Q {selectedVariant.price.toFixed(2)}</span>
                              </div>
                              <h3>{product.name}</h3>
                              <p className="muted">{product.description}</p>
                              {product.note ? <p className="product-note">{product.note}</p> : null}
                            </div>
                            <div className="storefront-grade-grid">
                              {(isShrimpProduct(product)
                                ? groupVariantsByGrade(product).flatMap(([, variants]) => variants)
                                : product.variants
                              ).map((variant) => (
                                <button
                                  key={variant.id}
                                  type="button"
                                  className={`storefront-grade-pill${selectedVariant.id === variant.id ? " active" : ""}`}
                                  aria-pressed={selectedVariant.id === variant.id}
                                  onClick={() => setSelectedVariant(product.id, variant.id)}
                                >
                                  <span>{getVariantDisplayLabel(variant)}</span>
                                  <strong>Q {variant.price.toFixed(2)}</strong>
                                </button>
                              ))}
                            </div>
                            <div className="storefront-card-footer">
                              <div className="storefront-card-meta">
                                <span>{selectedVariant.unitLabel}</span>
                              </div>
                              <div className="storefront-card-actions">
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
                                  Ver detalle
                                </button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredCatalogProducts.length === 0 ? (
            <article className="card" style={{ marginTop: 12 }}>
              <h3>Próximamente</h3>
              <p className="muted">No hay productos publicados todavía para este filtro. Vuelve pronto para ver nuevas gambas y accesorios.</p>
            </article>
          ) : null}
        </section>

        {getSiteMedia("banner") ? (
          <section className="section">
            <div className="home-banner home-banner-bottom">
              {renderSiteMedia(getSiteMedia("banner"), "Anuncio principal", "home-banner-media", 1600, 500, "(max-width: 1100px) 100vw, 1120px")}
            </div>
          </section>
        ) : null}

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
              <input name="address" placeholder="Dirección (zona/colonia/referencia)" required />
              
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
                        <button type="button" onClick={() => confirmAndSend(confirmModal.payload)} disabled={isSubmitting}>
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

      {quickViewProduct ? (
        <div className="modal-overlay" onClick={closeQuickView}>
          <article className="modal-card storefront-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">{quickViewProduct.category}</span>
                <h3>{quickViewProduct.name}</h3>
                <p className="muted">{quickViewProduct.description}</p>
              </div>
              <button type="button" className="secondary" onClick={closeQuickView}>
                Cerrar
              </button>
            </div>

            <div className="storefront-detail-grid">
              <div>
                <div className="gallery-main">
                  {quickViewSlides.length > 0 && quickViewSlides[quickViewSlide]?.type === "photo" ? (
                    <Image
                      src={quickViewSlides[quickViewSlide].src}
                      alt={quickViewProduct.name}
                      width={960}
                      height={960}
                      sizes="(max-width: 900px) 92vw, 600px"
                    />
                  ) : quickViewSlides.length > 0 && quickViewSlides[quickViewSlide]?.type === "video" ? (
                    <video controls src={quickViewSlides[quickViewSlide].src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className="gallery-empty">📷</div>
                  )}
                </div>
                <div className="thumbs">
                  {quickViewSlides.length ? (
                    quickViewSlides.map((slide, index) => (
                      <button
                        key={`${slide.src}-${index}`}
                        type="button"
                        className={index === quickViewSlide ? "thumb active" : "thumb"}
                        onClick={() => setQuickViewSlide(index)}
                      >
                        {slide.type === "photo" ? "Foto" : "Video"} {index + 1}
                      </button>
                    ))
                  ) : (
                    <p className="muted">Pronto habrá más imágenes.</p>
                  )}
                </div>
              </div>

              <div className="storefront-detail-sidebar">
                <div className="storefront-detail-price">
                  <span>Precio</span>
                  <strong>Q {getSelectedVariant(quickViewProduct).price.toFixed(2)}</strong>
                  <span className="unit-label">{getSelectedVariant(quickViewProduct).unitLabel}</span>
                </div>

                <div className="selector-block">
                  <div className="selector-label">
                    <span className="name">Grado</span>
                    <span className="hint">Elige tu presentación</span>
                  </div>
                  <div className="grade-options">
                    {quickViewProduct.variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        className={selectedVariants[quickViewProduct.id] === variant.id ? "grade-opt selected" : "grade-opt"}
                        onClick={() => setSelectedVariant(quickViewProduct.id, variant.id)}
                        aria-pressed={selectedVariants[quickViewProduct.id] === variant.id}
                      >
                        <span className="gname">{variant.label}</span>
                        <span className="qprice">Q {variant.price.toFixed(2)}</span>
                        <small>{variant.unitLabel}</small>
                        {selectedVariants[quickViewProduct.id] === variant.id ? <span className="check">✓</span> : null}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="selector-block">
                  <div className="selector-label">
                    <span className="name">Cantidad</span>
                    <span className="hint">Ajusta antes de agregar</span>
                  </div>
                  <div className="stepper">
                    <button type="button" onClick={() => setQuickViewQty((qty) => Math.max(1, qty - 1))}>–</button>
                    <span className="count">{quickViewQty}</span>
                    <button type="button" onClick={() => setQuickViewQty((qty) => qty + 1)}>+</button>
                  </div>
                </div>

                <div className="cta-row">
                  <button
                    type="button"
                    className="btn-add"
                    onClick={() => addProductQuantity(quickViewProduct.id, getSelectedVariant(quickViewProduct).id, quickViewQty)}
                  >
                    Agregar {quickViewQty} · Q {(getSelectedVariant(quickViewProduct).price * quickViewQty).toFixed(2)}
                  </button>
                  <button type="button" className="btn-wa" onClick={() => window.open(`https://wa.me/50243132549`, "_blank", "noopener,noreferrer")}>💬</button>
                </div>

                <div className="meta-row">
                  <div className="meta-item"><span className="mono">{getSelectedVariant(quickViewProduct).unitLabel}</span>Unidad seleccionada</div>
                  <div className="meta-item"><span className="mono">Zona 8</span>Retiro local</div>
                  <div className="meta-item"><span className="mono">Q 0</span>Envío desde Q 50</div>
                </div>

                <div className="note">📌 El precio y el total del carrito se actualizarán al seleccionar grado y cantidad.</div>
              </div>
            </div>
          </article>
        </div>
      ) : null}

      {/* Compact floating cart icon for mobile */}
      <button
        type="button"
        className="floating-cart-icon"
        onClick={() => setIsCartOpen((s) => !s)}
        aria-label={isCartOpen ? "Cerrar carrito" : "Abrir carrito"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M6 6h15l-1.5 9h-11L6 6z" fill="#fff" opacity="0.95" />
          <circle cx="10" cy="19" r="1.5" fill="#fff" />
          <circle cx="18" cy="19" r="1.5" fill="#fff" />
        </svg>
        {totalItems > 0 ? <span className="floating-cart-count">{totalItems}</span> : null}
      </button>
    </>
  );
}

