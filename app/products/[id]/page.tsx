"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Product, ProductVariant } from "@/lib/types";
import { getVariantDisplayLabel } from "@/lib/catalog";

type CartLine = {
  productId: string;
  variantId: string;
  qty: number;
};

const CART_STORAGE_KEY = "gg_cart_v1";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/catalog");
        if (!response.ok) {
          const text = await response.text();
          console.error("Product detail failed: GET /api/catalog", {
            status: response.status,
            body: text,
            productId
          });
          throw new Error(text || "No se pudo cargar el producto.");
        }

        const data = (await response.json()) as { products?: Product[] };
        const found = (data.products || []).find((item) => item.id === productId) || null;

        if (!cancelled) {
          setProduct(found);
          setSelectedVariantId(found?.variants[0]?.id || "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el producto.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (productId) {
      void loadProduct();
    } else {
      setLoading(false);
      setError("Producto inválido.");
    }

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!product) return null;
    return product.variants.find((item) => item.id === selectedVariantId) || product.variants[0] || null;
  }, [product, selectedVariantId]);

  function addToCart() {
    if (!product || !selectedVariant) return;

    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      const cart: CartLine[] = raw ? (JSON.parse(raw) as CartLine[]) : [];
      const index = cart.findIndex((line) => line.productId === product.id && line.variantId === selectedVariant.id);
      if (index >= 0) {
        cart[index] = { ...cart[index], qty: cart[index].qty + qty };
      } else {
        cart.push({ productId: product.id, variantId: selectedVariant.id, qty });
      }
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      setMessage("Producto agregado al carrito.");
    } catch {
      setMessage("No se pudo actualizar el carrito.");
    }
  }

  return (
    <main className="container section" style={{ paddingTop: 24, paddingBottom: 32, display: "grid", gap: 16 }}>
      <Link href="/products" className="badge" style={{ width: "fit-content", textDecoration: "none" }}>
        Volver al catálogo
      </Link>

      {loading ? <p className="muted">Cargando producto...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error && !product ? (
        <article className="card">
          <h3>Próximamente</h3>
          <p className="muted">Este producto no está disponible en este momento.</p>
        </article>
      ) : null}

      {product ? (
        <article className="card" style={{ display: "grid", gap: 16 }}>
          {product.media?.photos?.[0] ? (
            <Image src={product.media.photos[0]} alt={product.name} width={1200} height={800} sizes="(max-width: 1000px) 100vw, 960px" />
          ) : null}

          <div>
            <h1 style={{ marginTop: 0 }}>{product.name}</h1>
            <p className="muted">{product.description}</p>
            {product.note ? <p className="muted">{product.note}</p> : null}
          </div>

          <label>
            Variante
            <select value={selectedVariantId} onChange={(event) => setSelectedVariantId(event.target.value)}>
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {getVariantDisplayLabel(variant)} · Q {variant.price.toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Cantidad
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(event) => setQty(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>

          <button type="button" onClick={addToCart}>
            Agregar al carrito
          </button>

          {selectedVariant ? (
            <p className="muted">
              Precio unitario: Q {selectedVariant.price.toFixed(2)} · Total: Q {(selectedVariant.price * qty).toFixed(2)}
            </p>
          ) : null}

          {message ? <p className="muted">{message}</p> : null}
        </article>
      ) : null}
    </main>
  );
}
