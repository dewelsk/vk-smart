import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { config } from 'dotenv'

// Load environment variables from .env.local (Next.js convention)
config({ path: '.env.local' })

// Cleanup after each test
afterEach(() => {
  cleanup()
})
