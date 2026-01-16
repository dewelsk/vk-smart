import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/Toast'
import { BackendErrorMonitor } from '@/components/BackendErrorMonitor'
import SwitchedUserBannerWrapper from '@/components/SwitchedUserBannerWrapper'

// DebugBar must be client-only (uses usePathname, useRouter)
const DebugBar = dynamic(() => import('@/components/dev/DebugBar').then(mod => ({ default: mod.DebugBar })), {
  ssr: false,
})

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
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
      <body className={`${inter.className} ${inter.variable}`}>
        <ErrorBoundary>
          <ToastProvider>
            <Toaster position="top-right" />
            <BackendErrorMonitor />
            <SwitchedUserBannerWrapper />
            <SessionProvider>
              <QueryProvider>
                {children}
              </QueryProvider>
            </SessionProvider>
          </ToastProvider>
        </ErrorBoundary>
        {/* <DebugBar /> */}
      </body>
    </html>
  )
}
