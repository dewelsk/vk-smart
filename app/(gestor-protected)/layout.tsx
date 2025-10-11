import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/gestor/Header'
import Sidebar from '@/components/gestor/Sidebar'

export default async function GestorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect if not authenticated
  if (!session) {
    redirect('/admin/login')
  }

  // Check if user has gestor access
  if (session.user.role !== 'GESTOR') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header session={session} />
      <Sidebar />
      <main className="p-8 md:ml-64 transition-all duration-300">{children}</main>
    </div>
  )
}
