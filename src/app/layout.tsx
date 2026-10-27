import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wedora — All-in-One Wedding Management, Completely Free",
  description:
    "An elegant, free wedding management platform for couples and families. Manage guest lists, RSVPs, invitations, schedules, and details in one thoughtful space.",
  applicationName: "Wedora",
  keywords: [
    "wedding management",
    "free wedding planner",
    "wedding guest list",
    "digital RSVPs",
    "wedding invitation website",
    "wedding schedule",
  ],
  authors: [{ name: "Wedora" }],
  openGraph: {
    title: "Wedora — All-in-One Wedding Management, Completely Free",
    description:
      "Bring your guests, celebrations, plans, and little details together in one thoughtful space. Completely free for everyone.",
    siteName: "Wedora",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased selection:bg-[var(--champagne)] selection:text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
