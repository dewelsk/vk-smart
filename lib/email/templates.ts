/**
 * Email templates for VK Smart system
 * Based on docs/14-emailove-notifikacie.md
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5700'
const APP_NAME = 'VK Smart'

// Common email footer
const emailFooter = `
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
<p style="color: #6b7280; font-size: 12px; margin: 0;">
  Tento email bol vygenerovaný automaticky. Neodpovedajte naň.
</p>
`

// Common email wrapper
function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${content}
  ${emailFooter}
</body>
</html>
`
}

// Common greeting
function greeting(firstName: string, lastName: string): string {
  return `<p style="margin: 0 0 16px 0;">Dobrý deň ${firstName} ${lastName},</p>`
}

// Common signature
const signature = `
<p style="margin: 24px 0 0 0;">
  S pozdravom,<br />
  Tím ${APP_NAME}
</p>
`

// Button style
function emailButton(url: string, text: string): string {
  return `
<p style="margin: 24px 0;">
  <a href="${url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
    ${text}
  </a>
</p>
<p style="margin: 8px 0; font-size: 12px; color: #6b7280;">
  Ak tlačidlo nefunguje, skopírujte tento link do prehliadača:<br />
  <a href="${url}" style="color: #2563eb; word-break: break-all;">${url}</a>
</p>
`
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export interface WelcomeEmailParams {
  firstName: string
  lastName: string
  email: string
  role: string
  token: string
  vkInfo?: {
    identifier: string
    position: string
  }
}

/**
 * 1. Welcome email - Account created (Admin, Gestor, Komisia)
 * Sent when a new user is created with set password link
 */
export function welcomeEmail(params: WelcomeEmailParams): { subject: string; html: string } {
  const { firstName, lastName, email, role, token, vkInfo } = params
  const setPasswordUrl = `${APP_URL}/auth/set-password?token=${token}`

  const vkSection = vkInfo
    ? `
<p style="margin: 16px 0;">
  Boli ste priradený/á k výberovému konaniu: <strong>${vkInfo.identifier}</strong> - ${vkInfo.position}
</p>
`
    : ''

  const html = wrapEmail(`
${greeting(firstName, lastName)}
<p style="margin: 0 0 16px 0;">
  Bol vám vytvorený účet v systéme ${APP_NAME} s rolou <strong>${role}</strong>.
</p>
<p style="margin: 0 0 8px 0;"><strong>Prihlasovacie údaje:</strong></p>
<ul style="margin: 0 0 16px 0; padding-left: 20px;">
  <li>Email: ${email}</li>
  <li>Heslo: Zatiaľ nie je nastavené</li>
</ul>
<p style="margin: 0 0 16px 0;">
  Pre aktiváciu účtu kliknite na nasledujúce tlačidlo a nastavte si heslo:
</p>
${emailButton(setPasswordUrl, 'Nastaviť heslo')}
<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
  Link je platný 24 hodín.
</p>
<p style="margin: 0 0 16px 0;">
  Po nastavení hesla sa budete môcť prihlásiť do systému.
</p>
${vkSection}
${signature}
`)

  return {
    subject: `Vitajte v systéme ${APP_NAME} - Nastavte si heslo`,
    html,
  }
}

export interface PasswordResetEmailParams {
  firstName: string
  lastName: string
  token: string
}

/**
 * 2. Password reset email
 * Sent when user requests password reset
 */
export function passwordResetEmail(params: PasswordResetEmailParams): { subject: string; html: string } {
  const { firstName, lastName, token } = params
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

  const html = wrapEmail(`
${greeting(firstName, lastName)}
<p style="margin: 0 0 16px 0;">
  Požiadali ste o reset hesla v systéme ${APP_NAME}.
</p>
<p style="margin: 0 0 16px 0;">
  Pre obnovenie hesla kliknite na nasledujúce tlačidlo:
</p>
${emailButton(resetUrl, 'Obnoviť heslo')}
<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
  Link je platný 1 hodinu.
</p>
<p style="margin: 0 0 16px 0; color: #dc2626;">
  Ak ste o reset hesla nepožiadali, tento email ignorujte.
</p>
${signature}
`)

  return {
    subject: `${APP_NAME} - Reset hesla`,
    html,
  }
}

export interface PasswordChangedEmailParams {
  firstName: string
  lastName: string
  timestamp: string
  ipAddress?: string
}

/**
 * 3. Password changed confirmation email
 * Sent after successful password change
 */
export function passwordChangedEmail(params: PasswordChangedEmailParams): { subject: string; html: string } {
  const { firstName, lastName, timestamp, ipAddress } = params

  const html = wrapEmail(`
${greeting(firstName, lastName)}
<p style="margin: 0 0 16px 0;">
  Vaše heslo bolo úspešne zmenené.
</p>
<p style="margin: 0 0 8px 0;"><strong>Detaily:</strong></p>
<ul style="margin: 0 0 16px 0; padding-left: 20px;">
  <li>Dátum a čas zmeny: ${timestamp}</li>
  ${ipAddress ? `<li>IP adresa: ${ipAddress}</li>` : ''}
</ul>
<p style="margin: 0 0 16px 0; color: #dc2626; font-weight: 500;">
  Ak ste to neboli vy, kontaktujte nás okamžite.
</p>
${signature}
`)

  return {
    subject: `${APP_NAME} - Heslo bolo úspešne zmenené`,
    html,
  }
}

// ============================================================================
// 2FA EMAIL TEMPLATES
// ============================================================================

export interface TwoFactorEnabledEmailParams {
  firstName: string
  lastName: string
  timestamp: string
  ipAddress?: string
}

/**
 * 2FA enabled notification email
 * Sent when user enables 2FA
 */
export function twoFactorEnabledEmail(params: TwoFactorEnabledEmailParams): { subject: string; html: string } {
  const { firstName, lastName, timestamp, ipAddress } = params

  const html = wrapEmail(`
${greeting(firstName, lastName)}
<p style="margin: 0 0 16px 0;">
  Dvojfaktorová autentifikácia (2FA) bola <strong style="color: #16a34a;">úspešne aktivovaná</strong> pre váš účet.
</p>
<p style="margin: 0 0 8px 0;"><strong>Detaily:</strong></p>
<ul style="margin: 0 0 16px 0; padding-left: 20px;">
  <li>Dátum a čas aktivácie: ${timestamp}</li>
  ${ipAddress ? `<li>IP adresa: ${ipAddress}</li>` : ''}
</ul>
<p style="margin: 0 0 16px 0;">
  Od teraz budete pri každom prihlásení potrebovať zadať kód z autentifikačnej aplikácie.
</p>
<p style="margin: 0 0 16px 0; color: #dc2626; font-weight: 500;">
  Ak ste 2FA neaktivovali vy, okamžite zmeňte svoje heslo a kontaktujte administrátora.
</p>
${signature}
`)

  return {
    subject: `${APP_NAME} - Dvojfaktorová autentifikácia aktivovaná`,
    html,
  }
}

export interface TwoFactorDisabledEmailParams {
  firstName: string
  lastName: string
  timestamp: string
  ipAddress?: string
}

/**
 * 2FA disabled notification email
 * Sent when user disables 2FA
 */
export function twoFactorDisabledEmail(params: TwoFactorDisabledEmailParams): { subject: string; html: string } {
  const { firstName, lastName, timestamp, ipAddress } = params

  const html = wrapEmail(`
${greeting(firstName, lastName)}
<p style="margin: 0 0 16px 0;">
  Dvojfaktorová autentifikácia (2FA) bola <strong style="color: #dc2626;">deaktivovaná</strong> pre váš účet.
</p>
<p style="margin: 0 0 8px 0;"><strong>Detaily:</strong></p>
<ul style="margin: 0 0 16px 0; padding-left: 20px;">
  <li>Dátum a čas deaktivácie: ${timestamp}</li>
  ${ipAddress ? `<li>IP adresa: ${ipAddress}</li>` : ''}
</ul>
<p style="margin: 0 0 16px 0; color: #f59e0b;">
  <strong>Upozornenie:</strong> Váš účet je teraz menej chránený. Odporúčame 2FA znovu aktivovať.
</p>
<p style="margin: 0 0 16px 0; color: #dc2626; font-weight: 500;">
  Ak ste 2FA nedeaktivovali vy, okamžite zmeňte svoje heslo a kontaktujte administrátora.
</p>
${signature}
`)

  return {
    subject: `${APP_NAME} - Dvojfaktorová autentifikácia deaktivovaná`,
    html,
  }
}

export interface BackupCodesRegeneratedEmailParams {
  firstName: string
  lastName: string
  timestamp: string
  ipAddress?: string
}

/**
 * Backup codes regenerated notification email
 * Sent when user regenerates backup codes
 */
export function backupCodesRegeneratedEmail(params: BackupCodesRegeneratedEmailParams): { subject: string; html: string } {
  const { firstName, lastName, timestamp, ipAddress } = params

  const html = wrapEmail(`
${greeting(firstName, lastName)}
<p style="margin: 0 0 16px 0;">
  Záložné kódy pre dvojfaktorovú autentifikáciu boli <strong>vygenerované</strong>.
</p>
<p style="margin: 0 0 8px 0;"><strong>Detaily:</strong></p>
<ul style="margin: 0 0 16px 0; padding-left: 20px;">
  <li>Dátum a čas: ${timestamp}</li>
  ${ipAddress ? `<li>IP adresa: ${ipAddress}</li>` : ''}
</ul>
<p style="margin: 0 0 16px 0; color: #f59e0b;">
  <strong>Dôležité:</strong> Predchádzajúce záložné kódy sú teraz neplatné. Uložte si nové kódy na bezpečné miesto.
</p>
<p style="margin: 0 0 16px 0; color: #dc2626; font-weight: 500;">
  Ak ste záložné kódy nevygenerovali vy, okamžite zmeňte svoje heslo a kontaktujte administrátora.
</p>
${signature}
`)

  return {
    subject: `${APP_NAME} - Nové záložné kódy vygenerované`,
    html,
  }
}

// ============================================================================
// LINK EXPIRATION EMAIL
// ============================================================================

export interface LinkExpiredEmailParams {
  firstName: string
  lastName: string
}

/**
 * 14. Link expiration notification
 * Sent when password set link expires
 */
export function linkExpiredEmail(params: LinkExpiredEmailParams): { subject: string; html: string } {
  const { firstName, lastName } = params

  const html = wrapEmail(`
${greeting(firstName, lastName)}
<p style="margin: 0 0 16px 0;">
  Platnosť linku na nastavenie hesla pre váš účet v systéme ${APP_NAME} <strong>vypršala</strong>.
</p>
<p style="margin: 0 0 16px 0;">
  Pre získanie nového linku kontaktujte administrátora systému.
</p>
${signature}
`)

  return {
    subject: `${APP_NAME} - Platnosť linku vypršala`,
    html,
  }
}
