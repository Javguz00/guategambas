"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { packs, speciesCatalog, instagramProfile } from "@/lib/data";
import { OrderItem, SocialPost } from "@/lib/types";

interface CartLine {
  packId: string;
  qty: number;
}

export default function HomePage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/social")
      .then((res) => res.json())
      .then((data: { posts: SocialPost[] }) => setPosts(data.posts))
      .catch(() => setPosts([]));
  }, []);

  const cartDetail = useMemo(() => {
    return cart
      .map((line) => {
        const found = packs.find((pack) => pack.id === line.packId);
        if (!found) return null;
        return {
          ...found,
          qty: line.qty,
          subTotal: found.price * line.qty
        };
      })
      .filter(Boolean) as Array<(typeof packs)[number] & { qty: number; subTotal: number }>;
  }, [cart]);

  const total = useMemo(() => cartDetail.reduce((acc, item) => acc + item.subTotal, 0), [cartDetail]);

  function addPack(packId: string) {
    setCart((prev) => {
      const existing = prev.find((item) => item.packId === packId);
      if (existing) {
        return prev.map((item) =>
          item.packId === packId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { packId, qty: 1 }];
    });
  }

  function removePack(packId: string) {
    setCart((prev) => prev.filter((item) => item.packId !== packId));
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (cartDetail.length === 0) {
      setMessage("Agrega al menos un pack al carrito para enviar tu pedido.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: String(form.get("customerName") || ""),
      whatsapp: String(form.get("whatsapp") || ""),
      city: String(form.get("city") || ""),
      notes: String(form.get("notes") || ""),
      items: cartDetail.map<OrderItem>((item) => ({
        packId: item.id,
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

      setMessage("Pedido registrado correctamente. Te contactaremos por WhatsApp.");
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
            <a href="#especies">Especies</a>
            <a href="#packs">Packs</a>
            <a href="#pedidos">Pedidos</a>
            <a href="#social">Social</a>
            <a href="/admin">Admin</a>
          </nav>
          <a href={instagramProfile} target="_blank" rel="noreferrer">
            <button className="secondary">Instagram</button>
          </a>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <span className="badge">Frontend + Backend + API</span>
          <h1>Proyecto Full Stack para portafolio: Neocaridinas y Caridinas</h1>
          <p>
            Catalogo enfocado en Bloody Mary, Golden Bee y Tibee con sistema de pedidos,
            integracion social y arquitectura lista para evolucionar a produccion.
          </p>
        </section>

        <section id="especies" className="section">
          <h2>Especies</h2>
          <div className="grid grid-3">
            {speciesCatalog.map((species) => (
              <article key={species.key} className="card">
                <span className="badge">{species.scientificName}</span>
                <h3>{species.name}</h3>
                <p className="muted">{species.description}</p>
                <div className="gallery-block">
                  <div className="gallery-grid">
                    {species.photos.length > 0 ? (
                      species.photos.map((photo) => (
                        <div key={photo} className="gallery-item">
                          <Image src={photo} alt={species.name} width={320} height={180} />
                        </div>
                      ))
                    ) : (
                      <div className="gallery-item">
                        <div className="muted" style={{ padding: 12 }}>
                          Sube fotos en public/photos/golden-bee
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="video-list">
                  {species.videos.map((video, idx) => (
                    <a key={`${species.key}-${idx}`} className="video-pill" href={video} target="_blank" rel="noreferrer">
                      Video {idx + 1}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="packs" className="section">
          <h2>Packs de Venta</h2>
          <div className="pack-list">
            {packs.map((pack) => (
              <article key={pack.id} className="pack">
                <strong>
                  {pack.label} - {pack.quantity} unidades
                </strong>
                <p className="muted">{pack.species}</p>
                <p>Q {pack.price.toFixed(2)}</p>
                <div className="actions">
                  <button onClick={() => addPack(pack.id)}>Agregar al carrito</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pedidos" className="section">
          <h2>Pedidos</h2>
          <div className="layout-buy">
            <form className="card order-form" onSubmit={submitOrder}>
              <input name="customerName" placeholder="Nombre" required />
              <input name="whatsapp" placeholder="WhatsApp" required />
              <input name="city" placeholder="Ciudad" required />
              <textarea name="notes" rows={4} placeholder="Notas (opcional)" />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Confirmar Pedido"}
              </button>
              {message ? <p className="muted">{message}</p> : null}
            </form>

            <aside className="card cart">
              <h3>Carrito</h3>
              {cartDetail.length === 0 ? (
                <p className="muted">No hay packs agregados.</p>
              ) : (
                <ul>
                  {cartDetail.map((item) => (
                    <li key={item.id}>
                      {item.label} x {item.qty} - Q {item.subTotal.toFixed(2)}
                      <button className="secondary" style={{ marginLeft: 8 }} onClick={() => removePack(item.id)}>
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="cart-total">Total: Q {total.toFixed(2)}</p>
            </aside>
          </div>
        </section>

        <section id="social" className="section">
          <h2>Novedades de Instagram</h2>
          <div className="social-list">
            {posts.map((post) => (
              <article key={post.id} className="card">
                {post.thumbnailUrl ? (
                  <div className="social-thumb">
                    <Image src={post.thumbnailUrl} alt={post.title} width={640} height={360} />
                  </div>
                ) : null}
                <span className="badge">{post.type}</span>
                <h3>{post.title}</h3>
                <p className="muted">Publicado: {post.publishedAt}</p>
                <a href={post.url} target="_blank" rel="noreferrer">
                  <button>Ver en Instagram</button>
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
