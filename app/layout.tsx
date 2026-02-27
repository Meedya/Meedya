import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Influence | Markenführung und digitale Systeme",
  description:
    "Influence verbindet Positionierung, Branding, Webentwicklung und Content zu einem klar geführten Markensystem für Unternehmen mit hohem Anspruch."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
