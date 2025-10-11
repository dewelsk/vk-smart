import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

const DEFAULTS = {
  maxFailedAttempts: 5,
  blockDurationMinutes: 15,
  blockWindowMinutes: 15,
}

describe('Security Settings Model', () => {
  const createdIds: string[] = []

  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  afterEach(async () => {
    if (createdIds.length > 0) {
      await prisma.securitySettings.deleteMany({
        where: { id: { in: createdIds } },
      })
      createdIds.length = 0
    }
  })

  it('should create a security settings entry with default values', async () => {
    const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } })
    expect(superadmin).toBeTruthy()

    const created = await prisma.securitySettings.create({
      data: {
        ...DEFAULTS,
        updatedById: superadmin?.id,
      },
    })

    createdIds.push(created.id)

    expect(created).toMatchObject({
      maxFailedAttempts: DEFAULTS.maxFailedAttempts,
      blockDurationMinutes: DEFAULTS.blockDurationMinutes,
      blockWindowMinutes: DEFAULTS.blockWindowMinutes,
    })
    expect(created.updatedAt).toBeInstanceOf(Date)
  })

  it('should update an existing security settings entry', async () => {
    const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } })
    expect(superadmin).toBeTruthy()

    const created = await prisma.securitySettings.create({
      data: {
        ...DEFAULTS,
        updatedById: superadmin?.id,
      },
    })
    createdIds.push(created.id)

    const updated = await prisma.securitySettings.update({
      where: { id: created.id },
      data: {
        maxFailedAttempts: 7,
        blockDurationMinutes: 30,
        blockWindowMinutes: 20,
      },
    })

    expect(updated.maxFailedAttempts).toBe(7)
    expect(updated.blockDurationMinutes).toBe(30)
    expect(updated.blockWindowMinutes).toBe(20)
  })
})
