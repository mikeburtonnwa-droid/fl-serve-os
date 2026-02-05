/**
 * Portal Email Templates (F10.8)
 *
 * HTML email templates for magic link delivery and notifications.
 *
 * User Stories: US-035
 */

import type { MagicLinkEmailData } from './types'

// =============================================================================
// Email Template Functions
// =============================================================================

/**
 * Generates the initial magic link email
 */
export function generateMagicLinkEmail(data: MagicLinkEmailData): {
  subject: string
  html: string
  text: string
} {
  const subject = `Access your ${data.engagementName} Portal`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Access</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🚀 SERVE OS
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Client Portal Access
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
                Hi ${data.clientName},
              </p>

              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                ${data.consultantName} has shared portal access with you for the
                <strong>${data.engagementName}</strong> engagement. Click the button
                below to view your project dashboard and deliverables.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${data.portalUrl}"
                       style="display: inline-block; background-color: #3b82f6; color: #ffffff;
                              text-decoration: none; padding: 14px 32px; border-radius: 8px;
                              font-weight: 600; font-size: 16px;">
                      Access Your Portal
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link Expiration Notice -->
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⏰ <strong>This link expires on ${data.expirationDate}</strong><br>
                  You'll remain logged in for 7 days after accessing the portal.
                </p>
              </div>

              <!-- What You Can Do -->
              <div style="margin-top: 24px;">
                <p style="margin: 0 0 12px 0; color: #334155; font-size: 15px; font-weight: 600;">
                  In your portal, you can:
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                  <li>View your engagement status and progress</li>
                  <li>Access approved deliverables and artifacts</li>
                  <li>Download PDF versions of documents</li>
                  <li>See project milestones and timeline</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Consultant Info -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                Your Consultant
              </p>
              <p style="margin: 0; color: #334155; font-size: 15px;">
                <strong>${data.consultantName}</strong><br>
                <a href="mailto:${data.consultantEmail}" style="color: #3b82f6; text-decoration: none;">
                  ${data.consultantEmail}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px 32px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.7); font-size: 13px;">
                If you didn't expect this email or have questions, please contact your consultant.
              </p>
              <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                ${data.companyName || 'SERVE OS'} • AI Implementation Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `
Hi ${data.clientName},

${data.consultantName} has shared portal access with you for the "${data.engagementName}" engagement.

Access your portal here: ${data.portalUrl}

This link expires on ${data.expirationDate}.

In your portal, you can:
- View your engagement status and progress
- Access approved deliverables and artifacts
- Download PDF versions of documents
- See project milestones and timeline

Your Consultant:
${data.consultantName}
${data.consultantEmail}

If you didn't expect this email or have questions, please contact your consultant.

${data.companyName || 'SERVE OS'} • AI Implementation Platform
`

  return { subject, html, text }
}

/**
 * Generates a reminder email for expiring magic links
 */
export function generateExpiringLinkEmail(data: MagicLinkEmailData & { daysRemaining: number }): {
  subject: string
  html: string
  text: string
} {
  const subject = `Your portal link expires in ${data.daysRemaining} day${data.daysRemaining > 1 ? 's' : ''}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h1 style="margin: 0 0 16px 0; color: #334155; font-size: 20px;">
                ⏰ Your portal access is expiring soon
              </h1>

              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Hi ${data.clientName}, your access link for the <strong>${data.engagementName}</strong>
                portal will expire in <strong>${data.daysRemaining} day${data.daysRemaining > 1 ? 's' : ''}</strong>.
              </p>

              <a href="${data.portalUrl}"
                 style="display: inline-block; background-color: #3b82f6; color: #ffffff;
                        text-decoration: none; padding: 12px 24px; border-radius: 8px;
                        font-weight: 600;">
                Access Portal Now
              </a>

              <p style="margin: 24px 0 0 0; color: #64748b; font-size: 13px;">
                Contact ${data.consultantName} (${data.consultantEmail}) if you need a new link.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `
Your portal access is expiring soon

Hi ${data.clientName}, your access link for the "${data.engagementName}" portal will expire in ${data.daysRemaining} day${data.daysRemaining > 1 ? 's' : ''}.

Access your portal: ${data.portalUrl}

Contact ${data.consultantName} (${data.consultantEmail}) if you need a new link.
`

  return { subject, html, text }
}

/**
 * Generates notification email when new artifact is available
 */
export function generateNewArtifactEmail(data: MagicLinkEmailData & { artifactName: string; artifactType: string }): {
  subject: string
  html: string
  text: string
} {
  const subject = `New deliverable available: ${data.artifactName}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="background-color: #dcfce7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  ✨ New deliverable available in your portal
                </p>
              </div>

              <h1 style="margin: 0 0 8px 0; color: #334155; font-size: 20px;">
                ${data.artifactName}
              </h1>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">
                Type: ${data.artifactType}
              </p>

              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Hi ${data.clientName}, ${data.consultantName} has made a new deliverable
                available in your <strong>${data.engagementName}</strong> portal.
              </p>

              <a href="${data.portalUrl}"
                 style="display: inline-block; background-color: #3b82f6; color: #ffffff;
                        text-decoration: none; padding: 12px 24px; border-radius: 8px;
                        font-weight: 600;">
                View in Portal
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `
New deliverable available: ${data.artifactName}

Hi ${data.clientName}, ${data.consultantName} has made a new deliverable available in your "${data.engagementName}" portal.

Deliverable: ${data.artifactName}
Type: ${data.artifactType}

View in your portal: ${data.portalUrl}
`

  return { subject, html, text }
}
