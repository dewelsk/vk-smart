import { UserRole } from '@prisma/client'

type RoleBadgeProps = {
  role: UserRole
  institutionName?: string | null
  size?: 'sm' | 'md'
}

export function RoleBadge({ role, institutionName, size = 'md' }: RoleBadgeProps) {
  const colors: Record<UserRole, string> = {
    SUPERADMIN: 'bg-red-100 text-red-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    GESTOR: 'bg-green-100 text-green-800',
    KOMISIA: 'bg-orange-100 text-orange-800',
    UCHADZAC: 'bg-gray-100 text-gray-800',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colors[role]} ${sizeClasses[size]}`}
      data-testid={`role-badge-${role.toLowerCase()}`}
    >
      <span>{role}</span>
      {institutionName && (
        <span className="text-xs opacity-75">({institutionName})</span>
      )}
    </span>
  )
}
