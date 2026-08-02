import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: 'Regesit — Registrasi Event Tanpa Antrian',
    template: '%s | Regesit'
  },
  description: 'Platform registrasi event offline-first dengan QR check-in instan. Setup dalam 30 detik, check-in dalam 3 detik. Cocok untuk seminar kampus, komunitas, dan instansi pemerintahan di Aceh dan seluruh Indonesia.',
  keywords: ['registrasi event', 'QR check-in', 'offline-first', 'seminar kampus', 'absensi digital', 'Regesit', 'event organizer', 'check-in massal', 'tiket digital', 'Aceh', 'Indonesia'],
  authors: [{ name: 'Regesit', url: 'https://www.regesit.com' }],
  creator: 'Regesit',
  publisher: 'Regesit',
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL('https://www.regesit.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Regesit — Registrasi Event Tanpa Antrian',
    description: 'Platform registrasi event offline-first dengan QR check-in instan. Setup dalam 30 detik, check-in dalam 3 detik.',
    url: 'https://www.regesit.com',
    siteName: 'Regesit',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Regesit — Platform Registrasi Event'
    }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Regesit — Registrasi Event Tanpa Antrian',
    description: 'Platform registrasi event offline-first dengan QR check-in instan.',
    images: ['/og-image.png'],
    creator: '@bdforms'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
    google: 'tambahkan-google-search-console-verification-code-nanti',
  }
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
