import Mailgun from 'mailgun.js'
import formData from 'form-data'

// Email configuration
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || ''
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'VK System <noreply@vk-system.sk>'
const EMAIL_SIMULATE = process.env.EMAIL_SIMULATE === 'true'

// Initialize Mailgun client
const mailgun = new Mailgun(formData)
const mg = MAILGUN_API_KEY ? mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net' // EU region
}) : null

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
  simulated?: boolean
}

/**
 * Send email via Mailgun or simulate in development
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text } = options

  // In simulation mode, just log the email
  if (EMAIL_SIMULATE) {
    console.log('='.repeat(60))
    console.log('[EMAIL SIMULATED]')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('HTML Preview:', html.substring(0, 200) + '...')
    console.log('='.repeat(60))

    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
      simulated: true
    }
  }

  // Check if Mailgun is configured
  if (!mg || !MAILGUN_DOMAIN) {
    console.error('[EMAIL ERROR] Mailgun not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN.')
    return {
      success: false,
      error: 'Email service not configured'
    }
  }

  try {
    const result = await mg.messages.create(MAILGUN_DOMAIN, {
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
      text: text || htmlToText(html)
    })

    console.log('[EMAIL SENT]', {
      to,
      subject,
      messageId: result.id
    })

    return {
      success: true,
      messageId: result.id
    }
  } catch (error) {
    console.error('[EMAIL ERROR]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

/**
 * Simple HTML to text conversion
 */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Export for testing
export { mg as mailgunClient }
