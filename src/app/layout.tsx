import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClerkProviderWrapper from './ClerkProviderWrapper'
import { ImageProvider } from '@/lib/contexts/ImageContext'
import CustomCursor from '@/components/CustomCursor'
// TimezoneProvider moved to portal layout only

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HR Dashboard',
  description: 'We\'re your flexible, AI-powered product and operations partner. From code to customers, we help you build fast, scale smart, and focus on what matters.',
  keywords: 'startup services, AI-powered development, flexible team scaling, MVP development, startup growth',
  authors: [{ name: 'HR Dashboard' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'HR Dashboard',
    description: 'We\'re your flexible, AI-powered product and operations partner. From code to customers, we help you build fast, scale smart, and focus on what matters.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'HR Dashboard',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'HR Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HR Dashboard',
    description: 'We\'re your flexible, AI-powered product and operations partner. From code to customers, we help you build fast, scale smart, and focus on what matters.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <ClerkProviderWrapper>
          <ImageProvider autoRefreshStats={false}>
            <CustomCursor />
            {children}
          </ImageProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  )
}
