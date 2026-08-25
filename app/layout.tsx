import type { Metadata } from "next";
import "./globals.css";
import "./styles/variables.css";
import "./styles/admin.css";

// Resuelve el dominio público para que las imágenes de og/twitter no apunten a localhost.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Guategambas | Tienda Online de Gambas",
  description: "Genética seleccionada Neocaridinas y Caridinas. Insumos especializados para tu gambario.",
  openGraph: {
    title: "Guategambas | Tienda Online de Gambas",
    description: "Genética seleccionada Neocaridinas y Caridinas. Insumos especializados para tu gambario.",
    siteName: "Guategambas",
    locale: "es_GT",
    type: "website",
    images: ["/photos/cliente/logo.jpg"],
  },
  twitter: {
    card: "summary",
    title: "Guategambas | Tienda Online de Gambas",
    description: "Genética seleccionada Neocaridinas y Caridinas. Insumos especializados para tu gambario.",
    images: ["/photos/cliente/logo.jpg"],
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
