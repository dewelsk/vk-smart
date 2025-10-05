import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'

// DebugBar must be client-only (uses usePathname, useRouter)
const DebugBar = dynamic(() => import('@/components/dev/DebugBar').then(mod => ({ default: mod.DebugBar })), {
  ssr: false,
})

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VK Smart - Digitalizácia výberových konaní',
  description: 'Systém pre digitalizáciu výberových konaní',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node
}>) {
  return (
    <html lang="sk">
      <body className={roboto.className}>
        <SessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionProvider>
        {/* <DebugBar /> */}
      </body>
    </html>
  )
}
