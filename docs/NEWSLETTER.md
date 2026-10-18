# Newsletter signup

A signup form in the site footer and on the publications pages. Readers confirm by
email (double opt-in); the list lives in the `subscribers` table (Turso in production,
`data/ngscorecard.db` locally). This builds the **list**. Sending issues is not built:
export the confirmed addresses and send from whatever tool you prefer.

## Set up (once)

1. Create a [Resend](https://resend.com) account, verify the domain you send from, and make an API key.
2. Set, locally in `.env` and in the Vercel project's environment:
   - `RESEND_API_KEY` the key (`re_…`)
   - `NEWSLETTER_FROM` e.g. `NGScorecard <newsletter@ngscorecard.com>` (must be on the verified domain)
   - `SITE_URL` only on preview deployments; production defaults to `https://ngscorecard.com`

Without `RESEND_API_KEY`, development prints the confirmation email to the terminal
(the link in it works), and production tells the reader signup is not available yet.

## How it behaves

- Signup sends one confirmation email. The address is `pending` until the link is clicked, then `confirmed`.
- The form answers the same way whether or not the address is already on the list, and re-sends at most once per 10 minutes to the same address.
- Unsubscribe is a page with a button (so mail scanners opening links cannot unsubscribe anyone); it also accepts a one-click POST. Unsubscribed addresses stay in the table so they are never re-added by accident; signing up again starts a fresh confirmation.
- Spam guards: 5 signups per 10 minutes per IP, a hidden honeypot field, and a minimum time-on-page.

## Reading the list

Admin dashboard → Public API → **Newsletter** (owner only): counts, a filterable list, and
CSV download (confirmed by default). Each export is recorded in the activity log. The secret
token in each row is never shown or exported.

## When you do send issues

Mail only `confirmed` addresses, and put each person's own link in the message:
`<site>/api/newsletter/unsubscribe/<their token>`.
