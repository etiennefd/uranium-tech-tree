import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import FontSwitcher from "./components/FontSwitcher";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Uranium Tech Tree",
  description: "An interactive tech tree of uranium discoveries and inventions",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Uranium Tech Tree",
    description: "An interactive tech tree of uranium discoveries and inventions",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Uranium Tech Tree Visualization",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Uranium Tech Tree",
    description: "An interactive tech tree of uranium discoveries and inventions",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceMono.variable} ${plexMono.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased">
        <FontSwitcher />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
