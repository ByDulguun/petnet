import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus_Jakarta_Sans } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/constants";
import { toSafeJsonLd } from "@/lib/utils";

import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext", "cyrillic-ext"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: t("siteTitle"),
      template: `%s · ${SITE.name}`,
    },
    description: t("siteDescription"),
    keywords: [
      "pets",
      "Mongolia",
      "Ulaanbaatar",
      "veterinary",
      "pet shop",
      "dog grooming",
      "pet adoption",
      "dog training",
      "малын эмнэлэг",
      "амьтны дэлгүүр",
    ],
    alternates: {
      languages: {
        mn: "/mn",
        en: "/en",
        "x-default": "/mn",
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: t("siteTitle"),
      description: t("siteDescription"),
      url: SITE.url,
      locale: locale === "mn" ? "mn_MN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("siteTitle"),
      description: t("siteDescription"),
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/icon.svg`,
  sameAs: [
    "https://facebook.com/petnet.mn",
    "https://instagram.com/petnet.mn",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ulaanbaatar",
    addressCountry: "MN",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toSafeJsonLd(ORGANIZATION_LD) }}
        />
        <NextIntlClientProvider>
          <AppProviders>
            <a
              href="#main-content"
              className="sr-only z-[100] rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
              {t("skipToContent")}
            </a>
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <SiteFooter />
            </div>
            <Toaster position="top-center" />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
