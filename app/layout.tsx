import type { Metadata } from "next";
import "./globals.css";
import "./styles/variables.css";
import "./styles/admin.css";

export const metadata: Metadata = {
  title: "Guategambas | Tienda Online de Gambas",
  description: "Gambas frescas de la mejor calidad cultivadas en Guatemala. Compra online y recibe en tu domicilio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
