import type { Metadata, Viewport } from "next"
import { Cairo } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "700", "900"],
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: "MO CONTROL | BLACK GOLD - VIP Services",
    template: "%s | MO CONTROL",
  },
  description:
    "أسرع خدمة تفعيل باقات في مصر - اتصالات إميرالد، فودافون ريد، وي جولد. التفعيل أولاً والدفع لاحقاً. باقات بأسعار مخفضة وضمان كامل.",
  keywords: [
    "باقات اتصالات",
    "فودافون ريد",
    "وي جولد",
    "تفعيل باقات",
    "انترنت مصر",
    "MO CONTROL",
    "باقات مخفضة",
    "اتصالات اميرالد",
    "Etisalat Emerald",
    "Vodafone Red",
    "WE Gold",
  ],
  authors: [{ name: "MO CONTROL" }],
  creator: "MO CONTROL",
  publisher: "MO CONTROL",
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
    locale: "ar_EG",
    url: "https://mocontrol.online",
    siteName: "MO CONTROL",
    title: "MO CONTROL | BLACK GOLD - VIP Services",
    description:
      "أسرع خدمة تفعيل باقات في مصر - التفعيل أولاً والدفع لاحقاً",
    images: [
      {
        url: "https://i.top4top.io/p_3751ryoix1.png",
        width: 512,
        height: 512,
        alt: "MO CONTROL Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MO CONTROL | BLACK GOLD - VIP Services",
    description:
      "أسرع خدمة تفعيل باقات في مصر - التفعيل أولاً والدفع لاحقاً",
    images: ["https://i.top4top.io/p_3751ryoix1.png"],
  },
  icons: {
    icon: "https://i.top4top.io/p_3751ryoix1.png",
    apple: "https://i.top4top.io/p_3751ryoix1.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://mocontrol.online",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className="bg-background">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </head>
      <body className={`${cairo.className} antialiased`}>
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
