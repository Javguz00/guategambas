import type { Metadata } from "next";
import "./theme.css";

export const metadata: Metadata = {
  title: "GuateGambas | Catálogo y pedidos",
  description: "Catálogo de gambas ornamentales y accesorios con pedido por WhatsApp y panel privado."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
