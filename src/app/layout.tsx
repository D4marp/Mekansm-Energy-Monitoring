import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mekansm Energy Dashboard',
  description: 'Mekansm - Meeting Room Energy Monitoring Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-50 to-gray-100">
        {children}
      </body>
    </html>
  )
}
