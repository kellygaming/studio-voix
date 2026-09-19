import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE.title,
    template: "%s — Studio Voix",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "enlever le bruit de fond d'un enregistrement vocal",
    "nettoyer un audio en ligne",
    "réduction de bruit voix",
    "transcription audio français",
    "montage audio par texte",
    "enregistrer sa voix sans micro",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

// Décrit le service aux moteurs de recherche (rich results, panneau de connaissance).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE.name,
  url: SITE_URL,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  inLanguage: "fr",
  description: SITE.description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "3 minutes offertes pour tester sans créer d'abonnement.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Analytics />
      </body>
    </html>
  );
}
