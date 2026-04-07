import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "./providers";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Scam.me — Échange de skins CS2",
  description: "Échangez vos skins CS2 rapidement et en toute sécurité.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SessionProvider>
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
