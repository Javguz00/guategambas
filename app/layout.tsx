import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuateGambas | E-commerce Demo",
  description: "Proyecto de portafolio con frontend, backend y pedidos para gambas ornamentales."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
