import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'

const API_URL = 'http://localhost:5600'
let authCookie: string
let testVkId: string

const timestamp = Date.now()
const uniqueIdentifier = `VK-EVAL-TEST-${timestamp}`

describe('Evaluation Config API', () => {
  beforeAll(async () => {
    // Login as admin
    const loginResponse = await fetch(`${API_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: 'admin',
        password: 'admin123',
        csrfToken: '',
      }),
    })

    const cookies = loginResponse.headers.get('set-cookie')
    authCookie = cookies?.split(';')[0] || ''

    // Create test VK
    const createVkResponse = await fetch(`${API_URL}/api/admin/vk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      body: JSON.stringify({
        identifier: uniqueIdentifier,
        name: `Test VK for Evaluation Config ${timestamp}`,
        department: 'Test Department',
        description: 'Test Description',
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        endDateTime: new Date(Date.now() + 172800000).toISOString(),
        gestorId: 'cmgcjdfqa0003rmksnd9f8zws', // admin user ID
      }),
    })

    expect(createVkResponse.ok).toBe(true)
    const vkData = await createVkResponse.json()
    testVkId = vkData.vk.id
  })

  afterAll(async () => {
    // Cleanup: Delete test VK (cascade deletes evaluation config)
    if (testVkId) {
      await fetch(`${API_URL}/api/admin/vk/${testVkId}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie },
      })
    }
  })

  describe('GET /api/admin/vk/[id]/evaluation-config', () => {
    it('should return null when no config exists', async () => {
      const response = await fetch(`${API_URL}/api/admin/vk/${testVkId}/evaluation-config`, {
        headers: { 'Cookie': authCookie },
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.config).toBeNull()
    })

    it('should require authentication', async () => {
      const response = await fetch(`${API_URL}/api/admin/vk/${testVkId}/evaluation-config`)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/admin/vk/[id]/evaluation-config', () => {
    it('should create evaluation config with valid data', async () => {
      const evaluatedTraits = ['Sebadôvera', 'Motivácia', 'Samostatnosť']

      const response = await fetch(`${API_URL}/api/admin/vk/${testVkId}/evaluation-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({ evaluatedTraits }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.config).toBeDefined()
      expect(data.config.evaluatedTraits).toEqual(evaluatedTraits)
      expect(data.config.vkId).toBe(testVkId)
      expect(data.message).toBe('Konfigurácia ústnej časti bola vytvorená')
    })

    it('should reject when config already exists', async () => {
      const response = await fetch(`${API_URL}/api/admin/vk/${testVkId}/evaluation-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          evaluatedTraits: ['Sebadôvera', 'Motivácia', 'Samostatnosť'],
        }),
      })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toContain('Konfigurácia už existuje')
    })

    it('should validate minimum 3 categories', async () => {
      // Create new VK for this test
      const newVkResponse = await fetch(`${API_URL}/api/admin/vk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          identifier: `VK-MIN-TEST-${timestamp}`,
          name: `Min Test VK ${timestamp}`,
          department: 'Test',
          description: 'Test',
          startDateTime: new Date(Date.now() + 86400000).toISOString(),
          endDateTime: new Date(Date.now() + 172800000).toISOString(),
          gestorId: 'cmgcjdfqa0003rmksnd9f8zws',
        }),
      })
      const newVk = await newVkResponse.json()

      const response = await fetch(`${API_URL}/api/admin/vk/${newVk.vk.id}/evaluation-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          evaluatedTraits: ['Sebadôvera', 'Motivácia'], // Only 2
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Musíte vybrať minimálne 3 kategórie')

      // Cleanup
      await fetch(`${API_URL}/api/admin/vk/${newVk.vk.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie },
      })
    })

    it('should validate maximum 10 categories', async () => {
      // Create new VK for this test
      const newVkResponse = await fetch(`${API_URL}/api/admin/vk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          identifier: `VK-MAX-TEST-${timestamp}`,
          name: `Max Test VK ${timestamp}`,
          department: 'Test',
          description: 'Test',
          startDateTime: new Date(Date.now() + 86400000).toISOString(),
          endDateTime: new Date(Date.now() + 172800000).toISOString(),
          gestorId: 'cmgcjdfqa0003rmksnd9f8zws',
        }),
      })
      const newVk = await newVkResponse.json()

      const response = await fetch(`${API_URL}/api/admin/vk/${newVk.vk.id}/evaluation-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          evaluatedTraits: [
            'Cat1', 'Cat2', 'Cat3', 'Cat4', 'Cat5',
            'Cat6', 'Cat7', 'Cat8', 'Cat9', 'Cat10', 'Cat11' // 11 categories
          ],
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Môžete vybrať maximálne 10 kategórií')

      // Cleanup
      await fetch(`${API_URL}/api/admin/vk/${newVk.vk.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie },
      })
    })

    it('should validate evaluatedTraits is array', async () => {
      // Create new VK for this test
      const newVkResponse = await fetch(`${API_URL}/api/admin/vk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          identifier: `VK-ARRAY-TEST-${timestamp}`,
          name: `Array Test VK ${timestamp}`,
          department: 'Test',
          description: 'Test',
          startDateTime: new Date(Date.now() + 86400000).toISOString(),
          endDateTime: new Date(Date.now() + 172800000).toISOString(),
          gestorId: 'cmgcjdfqa0003rmksnd9f8zws',
        }),
      })
      const newVk = await newVkResponse.json()

      const response = await fetch(`${API_URL}/api/admin/vk/${newVk.vk.id}/evaluation-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          evaluatedTraits: 'not-an-array',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('evaluatedTraits musí byť pole')

      // Cleanup
      await fetch(`${API_URL}/api/admin/vk/${newVk.vk.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie },
      })
    })

    it('should return 404 for non-existent VK', async () => {
      const response = await fetch(`${API_URL}/api/admin/vk/non-existent-id/evaluation-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          evaluatedTraits: ['Cat1', 'Cat2', 'Cat3'],
        }),
      })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/admin/vk/[id]/evaluation-config', () => {
    it('should update existing config', async () => {
      const newTraits = ['Adaptabilita a flexibilita', 'Rozhodovacia schopnosť', 'Komunikačné zručnosti', 'Riadiace schopnosti']

      const response = await fetch(`${API_URL}/api/admin/vk/${testVkId}/evaluation-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({ evaluatedTraits: newTraits }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.config.evaluatedTraits).toEqual(newTraits)
      expect(data.message).toBe('Konfigurácia ústnej časti bola aktualizovaná')
    })

    it('should validate minimum categories on update', async () => {
      const response = await fetch(`${API_URL}/api/admin/vk/${testVkId}/evaluation-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          evaluatedTraits: ['Only One'],
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Musíte vybrať minimálne 3 kategórie')
    })

    it('should return 404 when config does not exist', async () => {
      // Create new VK without config
      const newVkResponse = await fetch(`${API_URL}/api/admin/vk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          identifier: `VK-NO-CONFIG-${timestamp}`,
          name: `No Config VK ${timestamp}`,
          department: 'Test',
          description: 'Test',
          startDateTime: new Date(Date.now() + 86400000).toISOString(),
          endDateTime: new Date(Date.now() + 172800000).toISOString(),
          gestorId: 'cmgcjdfqa0003rmksnd9f8zws',
        }),
      })
      const newVk = await newVkResponse.json()

      const response = await fetch(`${API_URL}/api/admin/vk/${newVk.vk.id}/evaluation-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          evaluatedTraits: ['Cat1', 'Cat2', 'Cat3'],
        }),
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Konfigurácia neexistuje')

      // Cleanup
      await fetch(`${API_URL}/api/admin/vk/${newVk.vk.id}`, {
        method: 'DELETE',
        headers: { 'Cookie': authCookie },
      })
    })

    it('should require authentication', async () => {
      const response = await fetch(`${API_URL}/api/admin/vk/${testVkId}/evaluation-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluatedTraits: ['Cat1', 'Cat2', 'Cat3'],
        }),
      })
      expect(response.status).toBe(401)
    })
  })

  describe('GET after modifications', () => {
    it('should return updated config', async () => {
      const response = await fetch(`${API_URL}/api/admin/vk/${testVkId}/evaluation-config`, {
        headers: { 'Cookie': authCookie },
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.config).toBeDefined()
      expect(data.config.vkId).toBe(testVkId)
      expect(data.config.evaluatedTraits).toHaveLength(4)
      expect(data.config.evaluatedTraits).toContain('Adaptabilita a flexibilita')
    })
  })
})