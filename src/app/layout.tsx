import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ВИЗИТВОСТОК - Путеводитель по Дальнему Востоку",
    template: "%s | ВИЗИТВОСТОК"
  },
  description: "Ваш надежный путеводитель по Приморскому краю и Дальнему Востоку России. Откройте для себя достопримечательности, маршруты, транспорт и активности в самом восточном регионе страны.",
  keywords: [
    "Дальний Восток",
    "Приморский край", 
    "Владивосток",
    "путеводитель",
    "туризм",
    "достопримечательности",
    "маршруты",
    "путешествия",
    "Россия",
    "отдых",
    "природа",
    "море",
    "тайга"
  ],
  authors: [{ name: "VisitVostok Team" }],
  creator: "VisitVostok",
  publisher: "VisitVostok",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://visitvostok.ru"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://visitvostok.ru",
    title: "ВИЗИТВОСТОК - Путеводитель по Дальнему Востоку",
    description: "Ваш надежный путеводитель по Приморскому краю и Дальнему Востоку России. Откройте для себя достопримечательности, маршруты, транспорт и активности.",
    siteName: "ВИЗИТВОСТОК",
    images: [
      {
        url: "/seo_banner.webp",
        width: 1200,
        height: 630,
        alt: "ВИЗИТВОСТОК - Дальний Восток России",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ВИЗИТВОСТОК - Путеводитель по Дальнему Востоку",
    description: "Ваш надежный путеводитель по Приморскому краю и Дальнему Востоку России",
    images: ["/seo_banner.webp"],
    creator: "@visitvostok",
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
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512", 
        url: "/android-chrome-512x512.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ВИЗИТВОСТОК",
    description: "Путеводитель по Дальнему Востоку России",
    url: "https://visitvostok.ru",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://visitvostok.ru/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    author: {
      "@type": "Organization",
      name: "VisitVostok Team",
      url: "https://visitvostok.ru/about"
    },
    sameAs: [
      "https://t.me/+HTIR_cijBXVjYWIy",
      "https://t.me/+_hKmfgSORrY2YWZi"
    ],
    mainEntity: {
      "@type": "TravelAgency",
      name: "ВИЗИТВОСТОК", 
      description: "Туристический сервис для путешествий по Дальнему Востоку",
      areaServed: "Дальний Восток России",
      serviceType: "Туристические услуги"
    }
  };

  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <meta name="theme-color" content="#5783FF" />
        <meta name="msapplication-TileColor" content="#5783FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ВИЗИТВОСТОК" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta property="og:image" content="https://visitvostok.ru/seo_banner.webp" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="ВИЗИТВОСТОК - Дальний Восток России" />
        <meta name="twitter:image" content="https://visitvostok.ru/seo_banner.webp" />
        <meta name="yandex-verification" content="dce0f9d81c096939" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Yandex.Metrika counter - Main script */}
        <Script
          id="yandex-metrika-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}n
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

              ym(102318371, "init", {
                   clickmap:true,
                   trackLinks:true,
                   accurateTrackBounce:true,
                   webvisor:true
              });
            `,
          }}
        />
        {/* Yandex.Metrika counter - noscript tag */}
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/102318371" alt="" />
          </div>
        </noscript>
        {/* /Yandex.Metrika counter */}

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
