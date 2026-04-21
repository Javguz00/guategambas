export type ProductCategory = "camarones" | "insumos";
export type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERED";

export interface ProductVariant {
  id: string;
  label: string;
  unitLabel: string;
  price: number;
  highlight?: string;
  stockAvailable?: number;
  lowStockThreshold?: number;
  shippingNote?: string;
}

export interface ProductMedia {
  photos: string[];
  videos: string[];
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  variants: ProductVariant[];
  description: string;
  highlight?: string;
  note?: string;
  media?: ProductMedia;
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
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  category: ProductCategory;
  unit: string;
  unitPrice: number;
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
  status: OrderStatus;
  createdAt: string;
}
