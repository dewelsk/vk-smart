// VK Validation Utilities

export type ValidationIssue = {
  type: 'error' | 'warning'
  code: string
  message: string
  action?: string
  actionLink?: string
  tab?: string
}

export type VK = {
  id: string
  status: string
  gestorId: string | null
  assignedTests: any[]
  candidates: any[]
  commission: {
    members: Array<{
      id: string
      isChairman: boolean
      user: {
        id: string
        active: boolean
      }
    }>
  } | null
  evaluationConfig: any | null
}

/**
 * Validate VK and return list of issues
 */
export function validateVK(vk: VK): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // A) ZÁKLADNÉ NASTAVENIE
  if (!vk.gestorId) {
    issues.push({
      type: 'error',
      code: 'NO_GESTOR',
      message: 'Gestor nie je priradený',
      action: 'Priradiť gestora',
      actionLink: '/vk/' + vk.id + '?tab=overview',
      tab: 'overview'
    })
  }

  if (vk.candidates.length === 0) {
    issues.push({
      type: 'warning',
      code: 'NO_CANDIDATES',
      message: 'Žiadni uchádzači',
      action: 'Pridať uchádzača',
      actionLink: '/vk/' + vk.id + '?tab=candidates',
      tab: 'candidates'
    })
  }

  // B) TESTY
  if (vk.assignedTests.length === 0) {
    issues.push({
      type: 'error',
      code: 'NO_TESTS',
      message: 'Žiadne priradené testy',
      action: 'Pridať test',
      actionLink: '/vk/' + vk.id + '?tab=tests',
      tab: 'tests'
    })
  }

  // Check for duplicate levels
  const levels = vk.assignedTests.map(t => t.level)
  const uniqueLevels = new Set(levels)
  if (levels.length !== uniqueLevels.size) {
    issues.push({
      type: 'error',
      code: 'DUPLICATE_TEST_LEVELS',
      message: 'Testy majú duplicitné levely',
      action: 'Opraviť levely',
      actionLink: '/vk/' + vk.id + '?tab=tests',
      tab: 'tests'
    })
  }

  // C) ÚSTNA ČASŤ
  if (!vk.evaluationConfig || !vk.evaluationConfig.evaluatedTraits || vk.evaluationConfig.evaluatedTraits.length === 0) {
    issues.push({
      type: 'error',
      code: 'NO_ORAL_CONFIG',
      message: 'Nie sú vybrané kategórie pre ústnu časť',
      action: 'Vybrať kategórie',
      actionLink: '/vk/' + vk.id + '?tab=oral',
      tab: 'oral'
    })
  } else if (vk.evaluationConfig.evaluatedTraits.length < 3) {
    issues.push({
      type: 'error',
      code: 'INSUFFICIENT_ORAL_CATEGORIES',
      message: `Vybraných len ${vk.evaluationConfig.evaluatedTraits.length} kategórií (minimum 3)`,
      action: 'Doplniť kategórie',
      actionLink: '/vk/' + vk.id + '?tab=oral',
      tab: 'oral'
    })
  }

  // D) KOMISIA
  if (!vk.commission) {
    issues.push({
      type: 'error',
      code: 'NO_COMMISSION',
      message: 'Komisia nie je vytvorená',
      action: 'Vytvoriť komisiu',
      actionLink: '/vk/' + vk.id + '?tab=commission',
      tab: 'commission'
    })
  } else {
    const memberCount = vk.commission.members.length

    // If no members, only show "no members" error
    if (memberCount === 0) {
      issues.push({
        type: 'error',
        code: 'COMMISSION_NO_MEMBERS',
        message: 'Komisia nemá členov',
        action: 'Pridať členov',
        actionLink: '/vk/' + vk.id + '?tab=commission',
        tab: 'commission'
      })
    } else if (memberCount < 3) {
      // If 1-2 members, only show "min 3 members" error (skip even/chairman checks)
      issues.push({
        type: 'error',
        code: 'COMMISSION_MIN_MEMBERS',
        message: 'Komisia musí mať aspoň 3 členov',
        action: 'Pridať členov',
        actionLink: '/vk/' + vk.id + '?tab=commission',
        tab: 'commission'
      })
    } else {
      // If 3+ members, check even count
      if (memberCount % 2 === 0) {
        issues.push({
          type: 'error',
          code: 'COMMISSION_EVEN_COUNT',
          message: `Komisia má párny počet členov (${memberCount})`,
          action: 'Pridať alebo odstrániť člena',
          actionLink: '/vk/' + vk.id + '?tab=commission',
          tab: 'commission'
        })
      }

      // Check for chairman
      const chairmen = vk.commission.members.filter(m => m.isChairman)
      if (chairmen.length === 0) {
        issues.push({
          type: 'error',
          code: 'NO_CHAIRMAN',
          message: 'Komisia nemá predsedu',
          action: 'Nastaviť predsedu',
          actionLink: '/vk/' + vk.id + '?tab=commission',
          tab: 'commission'
        })
      } else if (chairmen.length > 1) {
        issues.push({
          type: 'error',
          code: 'MULTIPLE_CHAIRMEN',
          message: 'Komisia má viac ako jedného predsedu',
          action: 'Odstrániť duplicitných predsedov',
          actionLink: '/vk/' + vk.id + '?tab=commission',
          tab: 'commission'
        })
      }

      // Check for max members (warning only)
      if (memberCount > 9) {
        issues.push({
          type: 'warning',
          code: 'COMMISSION_MAX_MEMBERS',
          message: 'Komisia má viac ako 9 členov (odporúčané maximum)',
          action: 'Skontrolovať počet',
          actionLink: '/vk/' + vk.id + '?tab=commission',
          tab: 'commission'
        })
      }

      // Check for inactive members
      const inactiveMembers = vk.commission.members.filter(m => !m.user.active)
      if (inactiveMembers.length > 0) {
        issues.push({
          type: 'warning',
          code: 'INACTIVE_COMMISSION_MEMBERS',
          message: `${inactiveMembers.length} členov komisie je neaktívnych`,
          action: 'Skontrolovať členov',
          actionLink: '/vk/' + vk.id + '?tab=commission',
          tab: 'commission'
        })
      }
    }
  }

  return issues
}

/**
 * Check if VK can transition to target status
 */
export function canTransitionTo(vk: VK, targetStatus: string): boolean {
  const issues = validateVK(vk)
  const blockers = issues.filter(i => i.type === 'error')

  // PRIPRAVA → CAKA_NA_TESTY: No blockers allowed
  if (targetStatus === 'CAKA_NA_TESTY') {
    return blockers.length === 0
  }

  // CAKA_NA_TESTY → TESTOVANIE: No blockers allowed
  if (targetStatus === 'TESTOVANIE') {
    return blockers.length === 0
  }

  // For other transitions, allow if no blockers
  return blockers.length === 0
}

/**
 * Get readiness indicator for VK list
 */
export function getReadinessIndicator(vk: VK): {
  status: 'ready' | 'warning' | 'error'
  count: number
  label: string
  color: string
} {
  const issues = validateVK(vk)
  const errors = issues.filter(i => i.type === 'error')
  const warnings = issues.filter(i => i.type === 'warning')

  if (errors.length > 0) {
    const plural = errors.length === 1 ? 'problém' : errors.length < 5 ? 'problémy' : 'problémov'
    return {
      status: 'error',
      count: errors.length,
      label: `${errors.length} ${plural}`,
      color: 'red'
    }
  }

  if (warnings.length > 0) {
    const plural = warnings.length === 1 ? 'varovanie' : warnings.length < 5 ? 'varovania' : 'varovaní'
    return {
      status: 'warning',
      count: warnings.length,
      label: `${warnings.length} ${plural}`,
      color: 'orange'
    }
  }

  return {
    status: 'ready',
    count: 0,
    label: 'Pripravené',
    color: 'green'
  }
}

/**
 * Get validation issues grouped by type
 */
export function getGroupedIssues(vk: VK): {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
} {
  const issues = validateVK(vk)
  return {
    errors: issues.filter(i => i.type === 'error'),
    warnings: issues.filter(i => i.type === 'warning')
  }
}

/**
 * Get completion checklist for PRIPRAVA status
 */
export function getPreparationChecklist(vk: VK): Array<{
  label: string
  completed: boolean
  action?: string
  actionLink?: string
}> {
  return [
    {
      label: 'Priradiť gestora',
      completed: !!vk.gestorId,
      action: 'Priradiť',
      actionLink: '/vk/' + vk.id + '?tab=overview'
    },
    {
      label: 'Pridať testy',
      completed: vk.assignedTests.length > 0,
      action: 'Pridať',
      actionLink: '/vk/' + vk.id + '?tab=tests'
    },
    {
      label: 'Vybrať kategórie pre ústnu časť (minimálne 3)',
      completed: vk.evaluationConfig && vk.evaluationConfig.evaluatedTraits && vk.evaluationConfig.evaluatedTraits.length >= 3,
      action: 'Vybrať',
      actionLink: '/vk/' + vk.id + '?tab=oral'
    },
    {
      label: 'Vytvoriť komisiu (minimálne 3 členovia, nepárny počet)',
      completed: !!vk.commission && vk.commission.members.length >= 3 && vk.commission.members.length % 2 === 1,
      action: 'Vytvoriť',
      actionLink: '/vk/' + vk.id + '?tab=commission'
    },
    {
      label: 'Nastaviť predsedu komisie',
      completed: !!vk.commission && vk.commission.members.filter(m => m.isChairman).length === 1,
      action: 'Nastaviť',
      actionLink: '/vk/' + vk.id + '?tab=commission'
    },
    {
      label: 'Pridať uchádzačov',
      completed: vk.candidates.length > 0,
      action: 'Pridať',
      actionLink: '/vk/' + vk.id + '?tab=candidates'
    }
  ]
}
