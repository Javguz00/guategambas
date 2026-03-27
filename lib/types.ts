export type SpeciesKey = "bloody-mary" | "golden-bee" | "tibee";

export interface Species {
  key: SpeciesKey;
  name: string;
  scientificName: string;
  description: string;
  photos: string[];
  videos: string[];
}

export interface Pack {
  id: string;
  species: SpeciesKey;
  label: string;
  quantity: number;
  price: number;
}

export interface SocialPost {
  id: string;
  type: "reel" | "post";
  title: string;
  url: string;
  thumbnailUrl?: string;
  publishedAt: string;
}

export interface OrderItem {
  packId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  whatsapp: string;
  city: string;
  notes?: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
}
