import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fix My Ride',
  description: 'Complete Customer Relationship Management system for Two-Wheeler businesses',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
