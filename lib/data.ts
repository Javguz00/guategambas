import { Pack, SocialPost, Species } from "@/lib/types";

export const instagramProfile = "https://instagram.com/guategambas";

export const speciesCatalog: Species[] = [
  {
    key: "bloody-mary",
    name: "Bloody Mary",
    scientificName: "Neocaridina davidi",
    description: "Linea roja intensa para acuarios plantados.",
    photos: [
      "/photos/bloody-mary/20251009_210314.jpg",
      "/photos/bloody-mary/20251115_160225.jpg",
      "/photos/bloody-mary/20251115_160333.jpg"
    ],
    videos: ["https://instagram.com/reel/demo-bloody-1"]
  },
  {
    key: "golden-bee",
    name: "Golden Bee",
    scientificName: "Caridina logemanni",
    description: "Patron elegante dorado para gambarios especializados.",
    photos: [],
    videos: ["https://instagram.com/reel/demo-golden-1"]
  },
  {
    key: "tibee",
    name: "Tibee",
    scientificName: "Hibrido Caridina",
    description: "Cruce selecto con patrones unicos y alta demanda.",
    photos: [
      "/photos/tibee/20251012_203538.jpg",
      "/photos/tibee/20251012_204454.jpg",
      "/photos/tibee/20251012_204521.jpg"
    ],
    videos: ["https://instagram.com/reel/demo-tibee-1"]
  }
];

export const packs: Pack[] = [
  { id: "bm-5", species: "bloody-mary", label: "Pack 5", quantity: 5, price: 150 },
  { id: "bm-10", species: "bloody-mary", label: "Pack 10", quantity: 10, price: 280 },
  { id: "gb-5", species: "golden-bee", label: "Pack 5", quantity: 5, price: 220 },
  { id: "tb-5", species: "tibee", label: "Pack 5", quantity: 5, price: 260 }
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
    title: "Tibee pattern update",
    url: instagramProfile,
    publishedAt: "2026-03-15"
  }
];
