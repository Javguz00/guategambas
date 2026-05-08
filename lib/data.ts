import { Product, SocialPost } from "@/lib/types";

export const instagramProfile = "https://instagram.com/guategambas";

export const products: Product[] = [
  // Caridinas
  {
    id: "golden-bee",
    name: "Golden Bee",
    category: "caridinas",
    description: "Caridinas Golden Bee con variedad de grados. Selecciona el grado y cantidad.",
    highlight: "2 Grados",
    variants: [
      // Grado Alto
      {
        id: "golden-bee-alto-1",
        gradeLabel: "Grado Alto",
        label: "1 unidad",
        unitLabel: "1 unidad",
        price: 50
      },
      {
        id: "golden-bee-alto-5",
        gradeLabel: "Grado Alto",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 200
      },
      // Grado Normal
      {
        id: "golden-bee-normal-1",
        gradeLabel: "Grado Normal",
        label: "1 unidad",
        unitLabel: "1 unidad",
        price: 35
      },
      {
        id: "golden-bee-normal-5",
        gradeLabel: "Grado Normal",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 125
      }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "tai-bee-spotted-head",
    name: "Tai Bee (Spotted Head)",
    category: "caridinas",
    description: "Caridina Tai Bee con patrón Spotted Head. Elige grado y cantidad.",
    highlight: "2 Grados",
    variants: [
      // Grado Alto
      {
        id: "tai-bee-alto-1",
        gradeLabel: "Grado Alto",
        label: "1 unidad",
        unitLabel: "1 unidad",
        price: 50
      },
      {
        id: "tai-bee-alto-5",
        gradeLabel: "Grado Alto",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 200
      },
      // Grado Normal
      {
        id: "tai-bee-normal-1",
        gradeLabel: "Grado Normal",
        label: "1 unidad",
        unitLabel: "1 unidad",
        price: 35
      },
      {
        id: "tai-bee-normal-5",
        gradeLabel: "Grado Normal",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 125
      }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "crs",
    name: "CRS",
    category: "caridinas",
    description: "Caridina Red Select (CRS). Selecciona grado y cantidad.",
    highlight: "2 Grados",
    variants: [
      // Grado Alto
      {
        id: "crs-alto-1",
        gradeLabel: "Grado Alto",
        label: "1 unidad",
        unitLabel: "1 unidad",
        price: 50
      },
      {
        id: "crs-alto-5",
        gradeLabel: "Grado Alto",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 200
      },
      // Grado Normal
      {
        id: "crs-normal-1",
        gradeLabel: "Grado Normal",
        label: "1 unidad",
        unitLabel: "1 unidad",
        price: 35
      },
      {
        id: "crs-normal-5",
        gradeLabel: "Grado Normal",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 125
      }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "taiwan-cbs",
    name: "Taiwan CBS",
    category: "caridinas",
    description: "Caridina Taiwan CBS. Elige tu grado y cantidad favorita.",
    highlight: "2 Grados",
    variants: [
      // Grado Alto
      {
        id: "taiwan-cbs-alto-1",
        gradeLabel: "Grado Alto",
        label: "1 unidad",
        unitLabel: "1 unidad",
        price: 50
      },
      {
        id: "taiwan-cbs-alto-5",
        gradeLabel: "Grado Alto",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 200
      },
      // Grado Normal
      {
        id: "taiwan-cbs-normal-1",
        gradeLabel: "Grado Normal",
        label: "1 unidad",
        unitLabel: "1 unidad",
        price: 35
      },
      {
        id: "taiwan-cbs-normal-5",
        gradeLabel: "Grado Normal",
        label: "Pack 5",
        unitLabel: "5 unidades",
        price: 125
      }
    ],
    media: { photos: [], videos: [] }
  },

  // Neocaridinas
  {
    id: "bloody-mary",
    name: "Bloody Mary",
    category: "neocaridinas",
    description: "Selecciona el grado para ver precio, disponibilidad y multimedia.",
    variants: [
      {
        id: "bm-alto-5",
        label: "Alto grado",
        unitLabel: "5 unidades",
        price: 200,
        media: { photos: ["/photos/bloody-mary/20251009_210314.jpg"], videos: [] }
      },
      {
        id: "bm-normal-5",
        label: "Grado normal",
        unitLabel: "5 unidades",
        price: 125
      }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "green-jade",
    name: "Green Jade",
    category: "neocaridinas",
    description: "Neocaridina Green Jade. Venta por unidad o pack de 5.",
    variants: [
      { id: "green-jade-unit", label: "Unidad", unitLabel: "1 unidad", price: 125 },
      { id: "green-jade-5", label: "Pack 5", unitLabel: "5 unidades", price: 600, stockAvailable: 2, lowStockThreshold: 1 }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "orange-neocaridina",
    name: "Orange",
    category: "neocaridinas",
    description: "Neocaridina color naranja. Pack económico de 5.",
    variants: [
      { id: "orange-5", label: "Pack 5", unitLabel: "5 unidades", price: 125 },
      { id: "orange-unit", label: "Unidad (estimada)", unitLabel: "1 unidad", price: 25 }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "blue-velvet",
    name: "Blue Velvet",
    category: "neocaridinas",
    description: "Neocaridina Blue Velvet - pack de 5.",
    variants: [
      { id: "blue-velvet-5", label: "Pack 5", unitLabel: "5 unidades", price: 200 }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "cherries",
    name: "Cherries",
    category: "neocaridinas",
    description: "Neocaridina Cherries. Venta por unidad y promoción por 10.",
    variants: [
      { id: "cherries-unit", label: "Unidad", unitLabel: "1 unidad", price: 15 },
      { id: "cherries-10", label: "Promo 10", unitLabel: "10 unidades", price: 125, stockAvailable: 5 }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "black-neocaridina",
    name: "Black",
    category: "neocaridinas",
    description: "Neocaridina negra - pack de 5.",
    variants: [
      { id: "black-5", label: "Pack 5", unitLabel: "5 unidades", price: 175 }
    ],
    media: { photos: [], videos: [] }
  },

  // Suplementos
  {
    id: "salty-shrimp-gh",
    name: "Salty Shrimp GH+ (porcion para 20L)",
    category: "suplementos",
    description: "Porción para ajuste de GH en 20 litros.",
    variants: [
      { id: "gh-1", label: "1 porcion (20L)", unitLabel: "1 porcion", price: 10 },
      { id: "gh-3", label: "Pack 3", unitLabel: "3 porciones", price: 25 }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "bacter-ae",
    name: "Bacter AE (10g)",
    category: "suplementos",
    description: "Aditivo bacteriano en presentacion de 10 gramos.",
    variants: [{ id: "bacter-ae-10g", label: "10g", unitLabel: "10 g", price: 35 }],
    media: { photos: [], videos: [] }
  },
  {
    id: "magic-powder",
    name: "Magic Powder (SL Aqua) (10g)",
    category: "suplementos",
    description: "Suplemento en polvo, 10 gramos.",
    variants: [{ id: "magic-10g", label: "10g", unitLabel: "10 g", price: 40 }],
    media: { photos: [], videos: [] }
  },

  // Accesorios
  {
    id: "tronco-cholla",
    name: "Tronco de Cholla",
    category: "accesorios",
    description: "Troncos naturales de cholla para decoracion y refugio.",
    variants: [
      { id: "cholla-small", label: "Pequeño", unitLabel: "1 pz", price: 20 },
      { id: "cholla-medium", label: "Mediano", unitLabel: "1 pz", price: 25 },
      { id: "cholla-large", label: "Grande", unitLabel: "1 pz", price: 30 }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "red-expansible",
    name: "Red expansible",
    category: "accesorios",
    description: "Red para manejo de gambas, plegable/expansible.",
    variants: [{ id: "red-1", label: "Unidad", unitLabel: "1 pz", price: 25 }],
    media: { photos: [], videos: [] }
  },
  {
    id: "valvula-flujo",
    name: "Válvula de flujo de aire",
    category: "accesorios",
    description: "Válvula reguladora para líneas de aire.",
    variants: [{ id: "valvula-1", label: "Unidad", unitLabel: "1 pz", price: 5 }],
    media: { photos: [], videos: [] }
  },
  {
    id: "almendro-hojas-10",
    name: "Hojas de almendro (10)",
    category: "accesorios",
    description: "Bolsa comercial de 10 hojas de almendro.",
    variants: [{ id: "almendro-10", label: "Pack 10", unitLabel: "10 hojas", price: 35 }],
    media: { photos: [], videos: [] }
  },
  {
    id: "filtro-pulmon-material",
    name: "Filtro de pulmón con material filtrante",
    category: "accesorios",
    description: "Filtro de esponja/pulmon con material filtrante incluido.",
    variants: [{ id: "filtro-pulmon-1", label: "Unidad", unitLabel: "1 kit", price: 110 }],
    media: { photos: [], videos: [] }
  },
  {
    id: "bomba-sobo",
    name: "Bomba de aire Sobo",
    category: "accesorios",
    description: "Bomba de aire Sobo de calidad, elige el número de salidas según tu necesidad.",
    variants: [
      { id: "sobo-1-salida", label: "1 salida", unitLabel: "1 pz", price: 45 },
      { id: "sobo-2-salidas", label: "2 salidas", unitLabel: "1 pz", price: 70 }
    ],
    media: { photos: [], videos: [] }
  },
  {
    id: "fluval-stratum",
    name: "Fluval Stratum",
    category: "accesorios",
    description: "Sustrato Fluval Stratum - precio por libra.",
    variants: [{ id: "stratum-lb", label: "Libra", unitLabel: "1 libra", price: 55 }],
    media: { photos: [], videos: [] }
  },
  {
    id: "shrimp-sand",
    name: "Shrimp Sand",
    category: "accesorios",
    description: "Sustrato tipo arena para gambas - precio por libra.",
    variants: [{ id: "sand-lb", label: "Libra", unitLabel: "1 libra", price: 35 }],
    media: { photos: [], videos: [] }
  },
  {
    id: "wanenergy-30",
    name: "Lámpara Wanenergy 30cm",
    category: "accesorios",
    description: "Lámpara LED Wanenergy 30 cm.",
    variants: [{ id: "wan-30", label: "30 cm", unitLabel: "1 pz", price: 100 }],
    media: { photos: [], videos: [] }
  },
  {
    id: "wanenergy-60",
    name: "Lámpara Wanenergy 60cm",
    category: "accesorios",
    description: "Lámpara LED Wanenergy 60 cm.",
    variants: [{ id: "wan-60", label: "60 cm", unitLabel: "1 pz", price: 150 }],
    media: { photos: [], videos: [] }
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
