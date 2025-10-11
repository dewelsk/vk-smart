import { defineConfig, devices } from '@playwright/test'

const useExistingServer = !!process.env.PLAYWRIGHT_USE_EXISTING_SERVER

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5600',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: useExistingServer
    ? undefined
    : {
        command: 'npm run dev:e2e',
        url: 'http://localhost:5600',
        reuseExistingServer: true, // Always reuse existing server in local development
        timeout: 120 * 1000,
      },
})
