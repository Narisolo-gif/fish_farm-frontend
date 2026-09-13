import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = { title: "Fish Farm Anosy", description: "Pilotage d'une ferme piscicole" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><AppShell>{children}</AppShell></body></html>;
}
