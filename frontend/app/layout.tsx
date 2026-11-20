import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: {
    default: "KHILAFAH AI — Explore Islamic Civilization",
    template: "%s | KHILAFAH AI",
  },
  description: "Preserving Knowledge. Understanding Civilization. Engineering the Future.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "KHILAFAH AI",
    description: "A research-focused AI platform for exploring Islamic civilization.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-charcoal font-sans">
        <AuthProvider>
          <Nav />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
