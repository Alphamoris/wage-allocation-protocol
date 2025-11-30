import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AptosProvider } from "@/contexts/AptosWalletContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "WAP - Wage Allocation Protocol | Real-Time Blockchain Payments",
  description: "Revolutionary wage streaming platform on Aptos blockchain. Get paid every second, not monthly. Instant access to earned wages with zero fees and bank-grade security.",
  keywords: ["wage streaming", "blockchain payments", "Aptos", "real-time salary", "instant payments", "payroll automation", "DeFi", "earned wage access"],
  authors: [{ name: "WAP Team" }],
  creator: "WAP - Wage Allocation Protocol",
  publisher: "WAP",
  applicationName: "WAP",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wap.finance",
    siteName: "WAP - Wage Allocation Protocol",
    title: "WAP - Get Paid Every Second | Blockchain Wage Streaming",
    description: "Stop waiting 30 days for your salary. WAP enables real-time wage streaming on Aptos blockchain. Claim your earned wages instantly, anytime.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WAP - Wage Allocation Protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WAP - Get Paid Every Second",
    description: "Revolutionary blockchain wage streaming. Access your earned wages in real-time on Aptos.",
    images: ["/og-image.png"],
    creator: "@WAPFinance",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/manifest.json",
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased bg-wap-light text-wap-text-primary font-sans`}
      >
        <AptosProvider>
          {children}
        </AptosProvider>
      </body>
    </html>
  );
}
