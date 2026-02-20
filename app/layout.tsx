import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meedya | E-Residency Web & Automation Studio",
  description:
    "Meedya builds modern websites, coding systems and automation services for Estonian e-residency businesses."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
