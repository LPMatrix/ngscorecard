// Sends one transactional email through Resend's HTTP API (https://resend.com).
// A plain fetch, so there is no SDK to install. Configure with:
//
//   RESEND_API_KEY   the API key (starts "re_")
//   NEWSLETTER_FROM  the sender, e.g. "NGScorecard <newsletter@ngscorecard.com>";
//                    the domain must be verified in Resend
//
// Without a key: in development the message is printed to the terminal so the
// signup flow can be tried end to end; in production sending fails with a
// MailerNotConfigured error rather than pretending the email went out.
export class MailerNotConfigured extends Error {
  constructor() { super('Email sending is not configured (RESEND_API_KEY)'); this.name = 'MailerNotConfigured' }
}

const ENDPOINT = 'https://api.resend.com/emails'

export function createMailer({ env = process.env, fetchImpl = fetch, log = console.log } = {}) {
  return {
    configured: () => !!env.RESEND_API_KEY,

    async send({ to, subject, text, html }) {
      const key = env.RESEND_API_KEY
      if (!key) {
        if (env.NODE_ENV === 'production') throw new MailerNotConfigured()
        log(`\n[mail] RESEND_API_KEY is not set, so this was not sent.\n  To: ${to}\n  Subject: ${subject}\n\n${text}\n`)
        return { skipped: true }
      }
      const from = env.NEWSLETTER_FROM?.trim()
      if (!from) throw new Error('NEWSLETTER_FROM is not set (e.g. "NGScorecard <newsletter@your-domain>")')
      // A display name alone ("NGScorecard") is not a sender; Resend would answer 422
      if (!/^[^<>@\s][^<>]*<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>$|^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(from)) {
        throw new Error('NEWSLETTER_FROM must include an email address, e.g. "NGScorecard <newsletter@your-domain>"')
      }

      const res = await fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, ...(html ? { html } : {}) }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 300)
        throw new Error(`Resend rejected the email (${res.status}): ${detail}`)
      }
      const body = await res.json().catch(() => ({}))
      return { id: body.id ?? null }
    },
  }
}

export const mailer = createMailer()
