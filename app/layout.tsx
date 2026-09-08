import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Leish.my - Malaysia\'s Beauty Booking Marketplace',
  description: 'Book verified makeup artists and beauty professionals for weddings, events, and corporate sessions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}