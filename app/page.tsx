"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { products } from "@/lib/data";
import { OrderItem, Product, ProductVariant } from "@/lib/types";

interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}

interface MediaSlide {
  type: "photo" | "video";
  src: string;
}

const WHATSAPP_NUMBER = "50243132549";

export default function HomePage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() =>
    products.reduce<Record<string, string>>((acc, product) => {
      acc[product.id] = product.variants[0]?.id || "";
      return acc;
    }, {})
  );
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [quickViewSlide, setQuickViewSlide] = useState(0);

  const quickViewProduct = useMemo(
    () => products.find((item) => item.id === quickViewProductId) || null,
    [quickViewProductId]
  );

  const quickViewSlides = useMemo<MediaSlide[]>(() => {
    if (!quickViewProduct?.media) return [];
    return [
      ...quickViewProduct.media.photos.map((src) => ({ type: "photo" as const, src })),
      ...quickViewProduct.media.videos.map((src) => ({ type: "video" as const, src }))
    ];
  }, [quickViewProduct]);

  const cartDetail = useMemo(() => {
    return cart
      .map((line) => {
        const found = products.find((product) => product.id === line.productId);
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
  }, [cart]);

  const total = useMemo(() => cartDetail.reduce((acc, item) => acc + item.subTotal, 0), [cartDetail]);

  const totalItems = useMemo(
    () => cartDetail.reduce((acc, item) => acc + item.qty, 0),
    [cartDetail]
  );

  const whatsappHref = useMemo(() => {
    const lines = cartDetail.map((item) => `${item.product.name} - ${item.variant.label} x ${item.qty}`);
    const text = lines.length
      ? `Hola, quiero confirmar este pedido:\n${lines.join("\n")}\n\nTotal estimado: Q ${total.toFixed(2)}`
      : "Hola, quiero informacion de disponibilidad y precios.";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }, [cartDetail, total]);

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

  function getSelectedVariant(product: Product) {
    const selected = selectedVariants[product.id];
    return product.variants.find((variant) => variant.id === selected) || product.variants[0];
  }

  function setSelectedVariant(productId: string, variantId: string) {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  }

  function getCartQty(productId: string, variantId: string) {
    return cart.find((item) => item.productId === productId && item.variantId === variantId)?.qty || 0;
  }

  function addProduct(productId: string, variantId: string) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId && item.variantId === variantId);
      const product = products.find((item) => item.id === productId);
      const variant = product?.variants.find((item) => item.id === variantId);

      if (!product || !variant) {
        return prev;
      }

      const nextQty = (existing?.qty || 0) + 1;
      if (typeof variant.stockAvailable === "number" && nextQty > variant.stockAvailable) {
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
    if (typeof variant.stockAvailable !== "number") return null;
    if (variant.stockAvailable <= 0) return "Agotado";
    if (typeof variant.lowStockThreshold === "number" && variant.stockAvailable <= variant.lowStockThreshold) {
      return `Pocas unidades: ${variant.stockAvailable}`;
    }
    return `Disponibles: ${variant.stockAvailable}`;
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (cartDetail.length === 0) {
      setMessage("Agrega al menos un producto al carrito para enviar tu pedido.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: String(form.get("customerName") || ""),
      whatsapp: String(form.get("whatsapp") || ""),
      city: String(form.get("city") || ""),
      notes: String(form.get("notes") || ""),
      items: cartDetail.map<OrderItem>((item) => ({
        productId: item.product.id,
        variantId: item.variant.id,
        name: item.product.name,
        variantLabel: item.variant.label,
        category: item.product.category,
        unit: item.variant.unitLabel,
        unitPrice: item.variant.price,
        quantity: item.qty
      })),
      total
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Error al crear pedido");
      }

      setMessage("Pedido recibido correctamente. Si deseas, puedes confirmarlo tambien por WhatsApp.");
      setCart([]);
      event.currentTarget.reset();
    } catch {
      setMessage("No se pudo enviar el pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="brand">Guate<span>Shrimp</span></div>
          <nav className="nav">
            <a href="#catalogo">Catálogo</a>
            <a href="#checkout">Checkout</a>
            <a href="/admin">Admin</a>
          </nav>
        </div>
      </header>

      <main className="container with-floating-cart">
        <section className="hero">
          <span className="badge">Catálogo en línea</span>
          <h1>Neocaridinas, caridinas e insumos con pedido directo y checkout rápido</h1>
          <p>
            Selecciona cada producto por su opción disponible, agrega cantidades y confirma tu compra por checkout o por WhatsApp.
          </p>
          <div className="hero-tags">
            <span>Stock actualizado</span>
            <span>Opciones por producto</span>
            <span>Carrito fijo</span>
            <span>Checkout inmediato</span>
            <span>WhatsApp directo</span>
          </div>
          <a className="quick-link" href={whatsappHref} target="_blank" rel="noreferrer">
            Contactar por WhatsApp
          </a>
        </section>

        <section id="catalogo" className="section">
          <div className="section-head">
            <div>
              <h2>Catálogo disponible</h2>
              <p className="muted">Selecciona la opcion del producto, agrégalo al carrito y ajusta cantidades con los controles.</p>
            </div>
          </div>

          {catalogSections.map((section) => (
            <div key={section.id} className="catalog-group">
              <div className="catalog-group-head">
                <div>
                  <h3>{section.title}</h3>
                  <p className="muted">{section.description}</p>
                </div>
              </div>
              <div className="product-grid">
                {products
                  .filter((product) => product.category === section.id)
                  .map((product) => (
                    <article key={product.id} className="product-card">
                      {(() => {
                        const selectedVariant = getSelectedVariant(product);
                        const selectedQty = getCartQty(product.id, selectedVariant.id);
                        return (
                          <>
                            <div className="product-card-top">
                              <span className="badge">{product.highlight || "Disponible"}</span>
                              <span className="product-price">Q {selectedVariant.price.toFixed(2)}</span>
                            </div>
                            <h3>{product.name}</h3>
                            <p className="muted">{product.description}</p>
                            {product.note ? <p className="product-note">{product.note}</p> : null}
                            <div className="variant-picker variant-picker-card">
                              {product.variants.map((variant) => (
                                <button
                                  key={variant.id}
                                  type="button"
                                  className={selectedVariant.id === variant.id ? "secondary" : ""}
                                  onClick={() => setSelectedVariant(product.id, variant.id)}
                                >
                                  {variant.label} - Q {variant.price.toFixed(2)}
                                </button>
                              ))}
                            </div>
                            <p className="product-meta">{selectedVariant.unitLabel}</p>
                            {productStockAlert(selectedVariant) ? (
                              <p className="stock-chip">{productStockAlert(selectedVariant)}</p>
                            ) : null}
                            <div className="actions">
                              {selectedQty === 0 ? (
                                <button type="button" onClick={() => addProduct(product.id, selectedVariant.id)}>
                                  Agregar al carrito
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
                                  <button type="button" onClick={() => addProduct(product.id, selectedVariant.id)}>
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
          <h2>Checkout</h2>
          <div className="checkout-grid">
            <form className="card order-form" onSubmit={submitOrder}>
              <input name="customerName" placeholder="Nombre" required />
              <input name="whatsapp" placeholder="WhatsApp" required />
              <input name="city" placeholder="Ciudad" required />
              <textarea name="notes" rows={4} placeholder="Notas (opcional): zona, horario, referencia" />
              <button type="submit" disabled={isSubmitting || cartDetail.length === 0}>
                {isSubmitting ? "Enviando..." : "Confirmar Pedido"}
              </button>
              {message ? <p className="muted">{message}</p> : null}
              <p className="muted">Tu pedido queda registrado y se confirma por contacto directo.</p>
            </form>

            <article className="card">
              <h3>Contacto rapido</h3>
              <p className="muted">Si prefieres cerrar por chat, envia el detalle directamente al 43132549.</p>
              <a className="quick-link" href={whatsappHref} target="_blank" rel="noreferrer">
                Enviar carrito por WhatsApp
              </a>
            </article>
          </div>
        </section>
      </main>

      <aside className="floating-cart card">
        <h3>Carrito ({totalItems})</h3>
        {cartDetail.length === 0 ? (
          <p className="muted">Agrega productos para iniciar tu pedido.</p>
        ) : (
          <ul>
            {cartDetail.map((item) => (
              <li key={`${item.product.id}-${item.variant.id}`}>
                <div>
                  <strong>{item.product.name}</strong>
                  <p className="muted">{item.variant.label}</p>
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
        <p className="cart-total">Total: Q {total.toFixed(2)}</p>
        <a className="checkout-link" href="#checkout">
          Ir al checkout
        </a>
      </aside>

      <a className="whatsapp-float" href={whatsappHref} target="_blank" rel="noreferrer">
        WhatsApp 43132549
      </a>

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
