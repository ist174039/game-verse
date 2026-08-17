import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/lib/i18n/language-context'
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Clã das Sombras — Gestão e Competição Futebolística',
    template: '%s · Clã das Sombras',
  },
  description: 'Constrói o teu clube, compete em universos, gere mercado e economia e conquista prestígio no Clã das Sombras.',
  applicationName: 'Clã das Sombras',
  generator: 'Clã das Sombras',
  icons: {
    icon: [{ url: '/brand/clan-logo.svg', type: 'image/svg+xml' }],
    shortcut: '/brand/clan-logo.svg',
    apple: '/brand/clan-logo.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className={`${inter.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <LanguageProvider>{children}</LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
