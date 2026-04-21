import { Product, SocialPost } from "@/lib/types";

export const instagramProfile = "https://instagram.com/guategambas";

export const products: Product[] = [
  {
    id: "bloody-mary",
    name: "Bloody Mary",
    category: "neocaridinas",
    description: "Linea roja intensa de Neocaridina para acuarios plantados y comunitarios.",
    highlight: "Disponible",
    note: "Promocion activa por lanzamiento.",
    variants: [
      {
        id: "bm-unit",
        label: "Unidad",
        unitLabel: "1 unidad",
        price: 25,
        highlight: "Desde Q25"
      },
      {
        id: "bm-5-plus-1",
        label: "Promo 5 + 1",
        unitLabel: "6 unidades",
        price: 150,
        highlight: "Oferta lanzamiento"
      }
    ],
    media: {
      photos: [
        "/photos/bloody-mary/20251009_210314.jpg",
        "/photos/bloody-mary/20251115_160225.jpg",
        "/photos/bloody-mary/20251115_160333.jpg"
      ],
      videos: []
    }
  },
  {
    id: "cherry",
    name: "Cherry",
    category: "neocaridinas",
    description: "Neocaridina Cherry para colonias estables y de facil mantenimiento.",
    highlight: "Entrada",
    note: "Disponible por unidad y pack promocional.",
    variants: [
      {
        id: "cherry-unit",
        label: "Unidad",
        unitLabel: "1 unidad",
        price: 15
      },
      {
        id: "cherry-pack-10",
        label: "Pack 10",
        unitLabel: "10 unidades",
        price: 100,
        highlight: "Oferta"
      }
    ],
    media: {
      photos: [],
      videos: []
    }
  },
  {
    id: "golden-bee",
    name: "Golden Bee",
    category: "caridinas",
    description: "Caridina selecta con patron dorado para proyectos especializados.",
    highlight: "Selecta",
    note: "Venta por pack de 5.",
    variants: [
      {
        id: "gb-pack-5",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 200
      }
    ],
    media: {
      photos: [],
      videos: []
    }
  },
  {
    id: "fluval-stratum",
    name: "Fluval Stratum",
    category: "insumos",
    description: "Sustrato activo para estabilidad de parametros en acuarios de invertebrados.",
    highlight: "Stock real",
    note: "Actualmente hay 5 libras disponibles.",
    variants: [
      {
        id: "stratum-lb",
        label: "Libra",
        unitLabel: "1 libra",
        price: 59,
        stockAvailable: 5,
        lowStockThreshold: 3
      }
    ],
    media: {
      photos: [],
      videos: []
    }
  },
  {
    id: "salty-shrimp-gh",
    name: "Salty Shrimp GH+",
    category: "insumos",
    description: "Mineralizador GH+ para preparar agua desmineralizada en sistemas de caridinas.",
    highlight: "Ajuste",
    variants: [
      {
        id: "gh-single",
        label: "Porcion individual",
        unitLabel: "1 porcion",
        price: 10
      },
      {
        id: "gh-pack-3",
        label: "Pack 3",
        unitLabel: "3 porciones",
        price: 25,
        highlight: "Ahorro"
      }
    ],
    media: {
      photos: [],
      videos: []
    }
  },
  {
    id: "sponge-filter",
    name: "Filtro de pulmon",
    category: "insumos",
    description: "Sistema de filtracion con material Bio Beds y bolitas hollow para bacterias.",
    highlight: "Equipo",
    note: "No incluye bomba oxigenadora.",
    variants: [
      {
        id: "filter-kit",
        label: "Kit completo",
        unitLabel: "1 kit",
        price: 125
      }
    ],
    media: {
      photos: [],
      videos: []
    }
  },
  {
    id: "catappa-leaves",
    name: "Hojas de catappa",
    category: "insumos",
    description: "Aporte natural de taninos para acondicionamiento de agua.",
    highlight: "Natural",
    note: "2 bolsas de 10 por Q50 con envio incluido a zonas aledanas.",
    variants: [
      {
        id: "catappa-unit",
        label: "Unidad",
        unitLabel: "1 hoja",
        price: 3.5
      },
      {
        id: "catappa-2bags",
        label: "2 bolsas de 10",
        unitLabel: "20 hojas",
        price: 50,
        highlight: "Envio incluido",
        shippingNote: "En zonas aledanas"
      }
    ],
    media: {
      photos: [],
      videos: []
    }
  }
];

export const socialPosts: SocialPost[] = [
  {
    id: "1",
    type: "reel",
    title: "Bloody Mary feeding time",
    url: instagramProfile,
    publishedAt: "2026-03-20"
  },
  {
    id: "2",
    type: "post",
    title: "Golden Bee macro shot",
    url: instagramProfile,
    publishedAt: "2026-03-18"
  },
  {
    id: "3",
    type: "reel",
    title: "Inventario y mantenimiento",
    url: instagramProfile,
    publishedAt: "2026-03-15"
  }
];
