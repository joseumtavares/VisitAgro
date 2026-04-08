import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agrovisita Pro - Gestão de Visitas Técnicas",
  description: "Sistema completo para gestão de visitas técnicas agrícolas com mapa interativo, controle de clientes, pedidos e comissões.",
  keywords: ["agrovisita", "agricultura", "gestão", "visitas técnicas", "mapa", "clientes"],
  authors: [{ name: "Agrovisita Pro" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
