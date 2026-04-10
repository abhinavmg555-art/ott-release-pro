import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'OTT Release Pro | Latest Movies & Web Series',
  description: 'Track latest and upcoming OTT releases in India. Malayalam, Tamil, Hindi, and English movies on Netflix, Prime Video, Hotstar, and more.',
  keywords: 'OTT release date Malayalam 2026, Latest OTT releases India, Netflix releases, Prime Video upcoming movies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
