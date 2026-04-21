"use client";

import { FormEvent, useMemo, useState } from "react";
import { products } from "@/lib/data";
import { OrderItem, Product, ProductVariant } from "@/lib/types";

interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}

export default function HomePage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [quickViewVariantId, setQuickViewVariantId] = useState<string | null>(null);

  const progressCards = useMemo(
    () => [
      {
        label: "Catalogo vivo",
        value: `${products.length} productos`,
        detail: "Bloody Mary, Cherry, Golden Bee e insumos"
      },
      {
        label: "Pedidos activos",
        value: "Formulario funcional",
        detail: "Carrito fijo, checkout guiado y envio a la API"
      },
      {
        label: "Back office",
        value: "Estados de pedido",
        detail: "PENDING, CONFIRMED y DELIVERED desde admin"
      }
    ],
    []
  );

  const ideaCards = useMemo(
    () => [
      {
        title: "Inventario con stock real",
        description: "Stock visible por producto y alerta visual cuando quedan pocas unidades."
      },
      {
        title: "Pedidos con estados",
        description: "Cada pedido inicia en PENDING y se actualiza a CONFIRMED o DELIVERED."
      },
      {
        title: "Contacto rapido",
        description: "Boton directo a WhatsApp para cerrar compras en minutos."
      },
      {
        title: "Vista rapida",
        description: "Cada producto tiene una vista con espacio para galeria de fotos y videos."
      }
    ],
    []
  );

  const quickViewProduct = useMemo(
    () => products.find((item) => item.id === quickViewProductId) || null,
    [quickViewProductId]
  );

  const quickViewVariant = useMemo(() => {
    if (!quickViewProduct || !quickViewVariantId) return null;
    return quickViewProduct.variants.find((variant) => variant.id === quickViewVariantId) || null;
  }, [quickViewProduct, quickViewVariantId]);

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
    const lines = cartDetail.map(
      (item) => `- ${item.product.name} (${item.variant.label}) x ${item.qty}`
    );
    const text = lines.length > 0
      ? `Hola GuateGambas, quiero cotizar:%0A${lines.join("%0A")}%0A%0ATotal estimado: Q ${total.toFixed(2)}`
      : "Hola GuateGambas, quiero informacion de disponibilidad y precios.";
    return `https://wa.me/?text=${text}`;
  }, [cartDetail, total]);

  const catalogSections = useMemo(
    () => [
      {
        id: "camarones",
        title: "Camarones",
        description: "Bloody Mary, Cherry y Golden Bee disponibles para venta."
      },
      {
        id: "insumos",
        title: "Insumos",
        description: "Sustrato, Salty Shrimp, filtros de pulmón y hojas de catappa."
      }
    ],
    []
  );

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

  function removeProduct(productId: string, variantId: string) {
    setCart((prev) => prev.filter((item) => !(item.productId === productId && item.variantId === variantId)));
  }

  function openQuickView(product: Product) {
    setQuickViewProductId(product.id);
    setQuickViewVariantId(product.variants[0]?.id || null);
  }

  function closeQuickView() {
    setQuickViewProductId(null);
    setQuickViewVariantId(null);
  }

  function minPrice(product: Product) {
    return Math.min(...product.variants.map((variant) => variant.price));
  }

  function productStockAlert(product: Product) {
    const limited = product.variants.filter((variant) => typeof variant.stockAvailable === "number");
    if (limited.length === 0) return null;
    const variant = limited[0];
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

      setMessage("Pedido registrado correctamente. Estado inicial: PENDING.");
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
          <div className="brand">Guate<span>Gambas</span></div>
          <nav className="nav">
            <a href="#catalogo">Catálogo</a>
            <a href="#checkout">Checkout</a>
            <a href="/admin">Admin</a>
          </nav>
        </div>
      </header>

      <main className="container with-floating-cart">
        <section className="hero">
          <span className="badge">Portafolio en construccion</span>
          <h1>Lo que llevamos hasta hoy: inventario real, pedidos y una base lista para crecer</h1>
          <p>
            Esta portada resume el estado actual del proyecto para que puedas ver rapido el avance, detectar huecos y decidir que ideas sumar despues.
          </p>
          <div className="hero-summary">
            {progressCards.map((card) => (
              <article key={card.label} className="summary-card">
                <span className="summary-label">{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>
          <div className="hero-tags">
            <span>Inventario real</span>
            <span>Pedidos en linea</span>
            <span>Carrito fijo</span>
            <span>Admin interno</span>
            <span>CI/CD listo</span>
            <span>Neon + Prisma</span>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <h2>Estado del proyecto</h2>
              <p className="muted">Una vista rapida de lo que ya existe y de lo que conviene pensar para la siguiente fase.</p>
            </div>
          </div>
          <div className="feature-grid">
            <article className="card feature-card accent">
              <span className="badge">Listo</span>
              <h3>Catalogo y carrito</h3>
              <p className="muted">Los productos ya estan organizados por categoria y se agregan al carrito antes de confirmar el pedido.</p>
            </article>
            <article className="card feature-card">
              <span className="badge">Listo</span>
              <h3>API de pedidos</h3>
              <p className="muted">Los pedidos se registran en la base de datos y quedan disponibles para revisarlos en el panel admin.</p>
            </article>
            <article className="card feature-card">
              <span className="badge">Base</span>
              <h3>Infraestructura</h3>
              <p className="muted">El proyecto ya cuenta con despliegue, CI/CD y esquema de datos preparado para seguir creciendo.</p>
            </article>
          </div>
        </section>

        <section id="catalogo" className="section">
          <div className="section-head">
            <div>
              <h2>Catálogo disponible</h2>
              <p className="muted">Selecciona los productos y agrégalos al carrito para cotizar tu pedido.</p>
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
                      <div className="product-card-top">
                        <span className="badge">{product.highlight || product.variants[0]?.unitLabel}</span>
                        <span className="product-price">Desde Q {minPrice(product).toFixed(2)}</span>
                      </div>
                      <h3>{product.name}</h3>
                      <p className="muted">{product.description}</p>
                      <p className="product-meta">Opciones: {product.variants.length}</p>
                      {product.note ? <p className="product-note">{product.note}</p> : null}
                      {productStockAlert(product) ? <p className="stock-chip">{productStockAlert(product)}</p> : null}
                      <ul className="variant-list">
                        {product.variants.map((variant) => (
                          <li key={variant.id}>
                            <span>
                              {variant.label} ({variant.unitLabel})
                            </span>
                            <strong>Q {variant.price.toFixed(2)}</strong>
                          </li>
                        ))}
                      </ul>
                      <div className="actions">
                        <button type="button" onClick={() => addProduct(product.id, product.variants[0].id)}>
                          Agregar opcion principal
                        </button>
                        <button type="button" className="secondary" onClick={() => openQuickView(product)}>
                          Vista rapida
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <h2>Ideas para la siguiente fase</h2>
              <p className="muted">Aqui puedes ver el tipo de mejoras que tendria sentido priorizar despues de esta base.</p>
            </div>
          </div>
          <div className="idea-grid">
            {ideaCards.map((idea) => (
              <article key={idea.title} className="card idea-card">
                <h3>{idea.title}</h3>
                <p className="muted">{idea.description}</p>
              </article>
            ))}
          </div>
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
              <p className="muted">Al confirmar se registra en estado PENDING y luego lo actualizas en admin.</p>
            </form>

            <article className="card">
              <h3>Contacto rapido</h3>
              <p className="muted">Si prefieres cerrar por chat, envianos el carrito por WhatsApp.</p>
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
                  <span>x {item.qty}</span>
                  <span>Q {item.subTotal.toFixed(2)}</span>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => removeProduct(item.product.id, item.variant.id)}
                  >
                    Quitar
                  </button>
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
        WhatsApp
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
              <div className="card">
                <h4>Galeria de fotos</h4>
                {quickViewProduct.media?.photos.length ? (
                  <ul>
                    {quickViewProduct.media.photos.map((photo) => (
                      <li key={photo}>{photo}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Pendiente de subir fotos.</p>
                )}
              </div>
              <div className="card">
                <h4>Videos</h4>
                {quickViewProduct.category === "camarones" ? (
                  quickViewProduct.media?.videos.length ? (
                    <ul>
                      {quickViewProduct.media.videos.map((video) => (
                        <li key={video}>{video}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">Pendiente de subir videos.</p>
                  )
                ) : (
                  <p className="muted">Este producto no requiere video por ahora.</p>
                )}
              </div>
            </div>
            <div className="variant-picker">
              {quickViewProduct.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={quickViewVariantId === variant.id ? "secondary" : ""}
                  onClick={() => setQuickViewVariantId(variant.id)}
                >
                  {variant.label} - Q {variant.price.toFixed(2)}
                </button>
              ))}
            </div>
            <div className="actions">
              <button
                type="button"
                onClick={() => {
                  if (!quickViewVariant) return;
                  addProduct(quickViewProduct.id, quickViewVariant.id);
                }}
              >
                Agregar al carrito
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
