"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/types";

type AvailabilityFilter = "all" | "in-stock" | "out-of-stock";

function getCover(product: Product) {
  return product.media?.photos?.[0] || "";
}

function getMinPrice(product: Product) {
  if (!product.variants.length) return null;
  return Math.min(...product.variants.map((variant) => variant.price));
}

function getStock(product: Product) {
  const values = product.variants
    .map((variant) => (typeof variant.stockAvailable === "number" ? variant.stockAvailable : null))
    .filter((value): value is number => value !== null);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/catalog");
        if (!response.ok) {
          const text = await response.text();
          console.error("Products page failed: GET /api/catalog", {
            status: response.status,
            body: text
          });
          throw new Error(text || "No se pudo cargar el catálogo.");
        }

        const data = (await response.json()) as { products?: Product[] };
        if (!cancelled) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo.");
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const values = Array.from(new Set(products.map((product) => product.category)));
    return ["all", ...values];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const maxPriceValue = maxPrice.trim() === "" ? null : Number(maxPrice);

    return products.filter((product) => {
      if (category !== "all" && product.category !== category) return false;

      const stock = getStock(product);
      if (availability === "in-stock") {
        if (stock !== null && stock <= 0) return false;
      }
      if (availability === "out-of-stock") {
        if (stock === null || stock > 0) return false;
      }

      if (maxPriceValue !== null && Number.isFinite(maxPriceValue)) {
        const minPrice = getMinPrice(product);
        if (minPrice !== null && minPrice > maxPriceValue) return false;
      }

      return true;
    });
  }, [products, category, availability, maxPrice]);

  return (
    <main className="container section" style={{ paddingTop: 24, paddingBottom: 32, display: "grid", gap: 16 }}>
      <header className="card" style={{ display: "grid", gap: 10 }}>
        <Link href="/" className="badge" style={{ width: "fit-content", textDecoration: "none" }}>
          Volver al inicio
        </Link>
        <h1 style={{ margin: 0 }}>Productos</h1>
        <p className="muted" style={{ margin: 0 }}>
          Explora el catálogo completo con filtros por categoría, precio y disponibilidad.
        </p>
      </header>

      <section className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            Categoría
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Todas" : item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Disponibilidad
            <select value={availability} onChange={(event) => setAvailability(event.target.value as AvailabilityFilter)}>
              <option value="all">Todas</option>
              <option value="in-stock">Con stock</option>
              <option value="out-of-stock">Agotados</option>
            </select>
          </label>

          <label>
            Precio máximo (Q)
            <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Ej. 200" />
          </label>
        </div>
      </section>

      {loading ? <p className="muted">Cargando catálogo...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error && filteredProducts.length === 0 ? (
        <article className="card">
          <h3>Próximamente</h3>
          <p className="muted">No hay productos disponibles con estos filtros en este momento.</p>
        </article>
      ) : null}

      <section className="product-grid">
        {filteredProducts.map((product) => {
          const minPrice = getMinPrice(product);
          const stock = getStock(product);
          const cover = getCover(product);

          return (
            <article key={product.id} className="storefront-product-card">
              {cover ? (
                <div className="storefront-product-visual">
                  <Image src={cover} alt={product.name} width={640} height={520} sizes="(max-width: 700px) 92vw, 320px" />
                </div>
              ) : null}

              <div className="storefront-card-copy">
                <div className="storefront-card-labels">
                  <span className="line-tag">{product.category}</span>
                  <span className="product-price">{minPrice === null ? "Próximamente" : `Q ${minPrice.toFixed(2)}`}</span>
                </div>
                <h3>{product.name}</h3>
                <p className="muted">{product.description}</p>
                <p className="muted">{stock === null ? "Stock por confirmar" : stock > 0 ? `Stock total: ${stock}` : "Agotado"}</p>
              </div>

              <div className="storefront-card-footer">
                <Link className="checkout-link" href={`/products/${product.id}`}>
                  Ver producto
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
