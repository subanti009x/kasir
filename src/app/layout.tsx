import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./print-receipt.css";
import { Providers } from "../lib/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Solutions Inovatif — Sistem Manajemen Bisnis & POS",
  description: "Platform Point of Sale untuk UMKM Indonesia dengan data terisolasi, kontrol akses berbasis peran, dan operasional real-time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
