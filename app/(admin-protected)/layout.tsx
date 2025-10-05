import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/admin/Header'
import Sidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect if not authenticated
  if (!session) {
    redirect('/admin/login')
  }

  // Check if user has admin access
  const hasAdminAccess = ['SUPERADMIN', 'ADMIN'].includes(session.user.role)
  if (!hasAdminAccess) {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header session={session} />
      <Sidebar session={session} />
      <main className="p-8 md:ml-64 transition-all duration-300">{children}</main>
    </div>
  )
}
