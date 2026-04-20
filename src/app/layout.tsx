import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VisitAgro Pro",
  description: "Sistema de Gestão Agrícola Escalável",
  icons: {
    icon: "/branding/visitagro-fortsul-favicon.png",
    apple: "/branding/visitagro-fortsul-apple-touch-icon.png",
  },
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