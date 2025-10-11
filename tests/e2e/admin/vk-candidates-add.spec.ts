import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe.skip('VK Candidates - Add @admin @vk @candidates', () => {
  // REMOVED: Add candidate functionality has been removed from VK detail page
  // Candidates are now added via separate applicant registration flow
})
