import { generateSync } from 'otplib'

/**
 * Generate a valid TOTP code for testing
 * @param secret - The TOTP secret from the setup page
 * @returns 6-digit TOTP code
 */
export function generateTOTPCode(secret: string): string {
    return generateSync({ secret })
}

/**
 * Fill TOTP input fields with a code using keyboard typing
 * @param page - Playwright page object
 * @param code - 6-digit TOTP code
 */
export async function fillTOTPInput(page: any, code: string): Promise<void> {
    // Focus first input and type all digits
    const firstInput = page.getByTestId('totp-input-0')
    await firstInput.click()

    // Type each digit with delay to let React state update
    for (const digit of code) {
        await page.keyboard.type(digit)
        await page.waitForTimeout(150) // Longer delay for React state sync
    }

    // Wait for React to process and call onComplete + API call
    await page.waitForTimeout(1000)
}
