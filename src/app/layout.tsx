import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { generateOrganizationSchema } from "@/lib/schema";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { RecoveryRedirect } from "@/components/auth/RecoveryRedirect";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.bestgoa.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Best of Goa | Discover Top Restaurants, Hotels, Attractions & More",
    template: "%s | Best of Goa",
  },
  description: "Your trusted guide to Goa's finest places. Discover top-rated restaurants, hotels, beaches, attractions, and more in North and South Goa.",
  keywords: ["Goa", "restaurants Goa", "hotels Goa", "best places Goa", "things to do Goa", "Goa directory", "Goa guide", "North Goa", "South Goa", "beaches Goa"],
  authors: [{ name: "Best of Goa" }],
  creator: "Best of Goa",
  publisher: "Best of Goa",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Best of Goa",
    title: "Best of Goa | Discover Top Restaurants, Hotels, Attractions & More",
    description: "Your trusted guide to Goa's finest places. Discover top-rated restaurants, hotels, beaches, and attractions.",
    images: [
      {
        url: "/BrandAssets/og-image.png",
        width: 1200,
        height: 630,
        alt: "Best of Goa - Your Guide to Goa's Best Places",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best of Goa | Discover Top Restaurants, Hotels & More",
    description: "Your trusted guide to Goa's finest places.",
    images: ["/BrandAssets/og-image.png"],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: baseUrl,
  },
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
  other: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://analytics.ahrefs.com https://www.googletagmanager.com https://www.google-analytics.com https://*.firebaseapp.com https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.apify.com https://api.firecrawl.dev https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://analytics.ahrefs.com https://www.google-analytics.com https://analytics.google.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate Organization schema (appears on all pages)
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Ahrefs Site Verification */}
        <meta name="ahrefs-site-verification" content="bf40f2a3e32d77fe92eca8d48b9a6c5d7d9681709e816cca5788cb78d7abcc10" />
        {/* Organization Schema - Brand Recognition & Knowledge Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema, null, 2),
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* Ahrefs Analytics - Deferred for performance */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="03fFKdFVdDjqLe5DT0z97g"
          strategy="lazyOnload"
        />
        <AuthProvider>
          <Suspense fallback={null}>
            {/* <RecoveryRedirect /> */}
          </Suspense>
          <PublicLayout>{children}</PublicLayout>
        </AuthProvider>

        {/* PWA Install Prompt - appears on all pages */}
        <PWAInstallPrompt />
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
