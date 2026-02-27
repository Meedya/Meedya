import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Influence | Markenfuhrung und digitale Systeme",
  description:
    "Influence verbindet Positionierung, Branding, Webentwicklung und Content zu einem klar gefuhrten Markensystem fur Unternehmen mit hohem Anspruch."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
