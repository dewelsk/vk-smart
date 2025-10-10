import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SecuritySettingsForm from '@/components/settings/SecuritySettingsForm'

const DEFAULT_SECURITY_SETTINGS = {
  maxFailedAttempts: 5,
  blockDurationMinutes: 15,
  blockWindowMinutes: 15,
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  if (session.user.role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  let securitySettings = await prisma.securitySettings.findFirst({
    include: {
      updatedBy: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
        },
      },
    },
  })

  if (!securitySettings) {
    securitySettings = await prisma.securitySettings.create({
      data: {
        ...DEFAULT_SECURITY_SETTINGS,
        updatedById: session.user.id,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    })
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Nastavenia</h1>
        <p className="mt-1 text-sm text-gray-600">
          Konfigurácia bezpečnostných parametrov pre prihlasovanie uchádzačov a administrátorov.
        </p>
      </div>

      <SecuritySettingsForm
        initialSettings={{
          id: securitySettings.id,
          maxFailedAttempts: securitySettings.maxFailedAttempts,
          blockDurationMinutes: securitySettings.blockDurationMinutes,
          blockWindowMinutes: securitySettings.blockWindowMinutes,
          updatedAt: securitySettings.updatedAt.toISOString(),
          updatedBy: securitySettings.updatedBy
            ? {
                id: securitySettings.updatedBy.id,
                name: securitySettings.updatedBy.name,
                surname: securitySettings.updatedBy.surname,
                email: securitySettings.updatedBy.email,
              }
            : null,
        }}
      />
    </div>
  )
}
