import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuickHubGH - Ghana\'s Gig Economy Platform',
  description: 'Connect with skilled professionals and find job opportunities in Ghana',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#1E293B" />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}