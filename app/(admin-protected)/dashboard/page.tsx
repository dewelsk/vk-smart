import Link from 'next/link'
import {
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getDashboardData() {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      throw new Error('Unauthorized')
    }

    // Build where clause based on user role
    const vkWhere: any = {}
    const candidateWhere: any = { deleted: false }
    const userWhere: any = { deleted: false, role: { not: 'UCHADZAC' } }

    // RBAC: Admin/Gestor/Komisia see only their institutions
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      vkWhere.institutionId = { in: userInstitutionIds }
      candidateWhere.vk = { institutionId: { in: userInstitutionIds } }
      userWhere.institutions = {
        some: {
          institutionId: { in: userInstitutionIds },
        },
      }
    }

    // Get statistics
    const [
      totalVKs,
      activeVKs,
      totalCandidates,
      totalUsers,
      recentVKs,
    ] = await Promise.all([
      prisma.vyberoveKonanie.count({ where: vkWhere }),
      prisma.vyberoveKonanie.count({
        where: {
          ...vkWhere,
          status: { notIn: ['DOKONCENE', 'ZRUSENE'] },
        },
      }),
      prisma.candidate.count({ where: candidateWhere }),
      prisma.user.count({ where: userWhere }),
      prisma.vyberoveKonanie.findMany({
        where: vkWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          institution: {
            select: { code: true, name: true },
          },
          gestor: {
            select: { name: true, surname: true },
          },
          candidates: {
            where: { deleted: false },
            select: { id: true },
          },
        },
      }),
    ])

    const formattedRecentVKs = recentVKs.map((vk) => ({
      id: vk.id,
      identifier: vk.identifier,
      position: vk.position,
      status: vk.status,
      institution: vk.institution,
      gestor: vk.gestor,
      candidatesCount: vk.candidates.length,
      createdAt: vk.createdAt.toISOString(),
    }))

    return {
      stats: { totalVKs, activeVKs, totalCandidates, totalUsers },
      recentVKs: formattedRecentVKs,
      statusBreakdown: {},
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      stats: { totalVKs: 0, activeVKs: 0, totalCandidates: 0, totalUsers: 0 },
      recentVKs: [],
      statusBreakdown: {},
    }
  }
}

export default async function AdminDashboard() {
  const { stats, recentVKs, statusBreakdown } = await getDashboardData()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Prehľad výberových konaní a štatistík</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active VK Card */}
        <Link href="/vk">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-7 w-7 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktívne VK</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeVKs}</p>
                <p className="text-xs text-gray-500">z {stats.totalVKs} celkom</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Candidates Card */}
        <Link href="/applicants">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="h-7 w-7 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uchádzači</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCandidates}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Users Card */}
        <Link href="/users">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UsersIcon className="h-7 w-7 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Používatelia</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent VK Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Posledné výberové konania
          </h2>
          <Link
            href="/vk/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Nové VK
          </Link>
        </div>

        <div className="p-6">
          {recentVKs.length > 0 ? (
            <div className="space-y-4">
              {recentVKs.map((vk: any) => (
                <Link
                  key={vk.id}
                  href={`/vk/${vk.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{vk.identifier}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vk.status === 'PRIPRAVA' ? 'bg-gray-100 text-gray-800' :
                          vk.status === 'TESTOVANIE' ? 'bg-blue-100 text-blue-800' :
                          vk.status === 'HODNOTENIE' ? 'bg-purple-100 text-purple-800' :
                          vk.status === 'DOKONCENE' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vk.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{vk.position}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{vk.institution.code}</span>
                        {vk.gestor && <span>Gestor: {vk.gestor.name} {vk.gestor.surname}</span>}
                        <span>{vk.candidatesCount} uchádzačov</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(vk.createdAt).toLocaleDateString('sk-SK')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Zatiaľ nemáte žiadne výberové konania
              </h3>
              <p className="text-gray-600 mb-6">
                Začnite vytvorením prvého výberového konania
              </p>
              <Link
                href="/vk/new"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                + Vytvoriť prvé VK
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
