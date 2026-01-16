import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import TopNavigation from '@/components/admin/TopNavigation'

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
    <div className="min-h-screen bg-gray-50">
      <TopNavigation session={session} />
      <main className="transition-all duration-300">{children}</main>
    </div>
  )
}
