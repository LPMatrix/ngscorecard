#!/usr/bin/env node
// Upsert the hand-written (non-scraped) RAG documents into the corpus.
// These cover topics the Government Service Portal does not: rights bodies,
// land registry, tax clearance, and police arrest rights under ACJA.
//
//   npm run rag:sync-hand-written                  dry run: show what would change
//   npm run rag:sync-hand-written -- --apply       write changes to the database
//   npm run rag:sync-hand-written -- --db <file>   use a specific SQLite file
//
// Targets Turso when TURSO_DATABASE_URL is set, otherwise data/ngscorecard.db.
// Safe to re-run: documents are matched by source+title; unchanged ones are skipped.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncDocuments } from '../server/rag.js'

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null }

const apply = has('--apply')
const dbFile = val('--db') ? path.resolve(val('--db')) : null

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const docs = [

  // ── NHRC: National Human Rights Commission ─────────────────────────────
  {
    source: 'NHRC',
    title: 'National Human Rights Commission - How to File a Complaint',
    url: 'https://nigeriarights.gov.ng',
    content: `# National Human Rights Commission (NHRC)

## What NHRC does
The National Human Rights Commission (NHRC) is the independent federal body that receives, investigates, and resolves complaints about human rights violations in Nigeria. It can investigate government agencies, security forces, and private actors. The Commission is established by the National Human Rights Commission Act, Cap. N46, LFN 2004.

## How to file a complaint
You can submit a complaint through any of these channels:

**Online:** Visit nigeriarights.gov.ng and use the online complaint form. You will need to describe the violation, name the agency or person responsible, and attach any supporting documents.

**By post or in person:** Write to the NHRC headquarters in Abuja or visit any of its state offices across Nigeria. Bring copies of all evidence.

**What to include in your complaint:**
- A clear written account of what happened, with dates and locations
- Names and positions of persons or agencies involved
- Copies of any documentary evidence (messages, photos, medical reports, official letters)
- Your contact details

## What violations NHRC handles
- Unlawful arrest or detention by security forces
- Torture, cruel or inhuman treatment by police or other agencies
- Denial of access to education, healthcare, or housing by a government body
- Discrimination by a public institution
- Violations of workers' rights in the public sector
- Extrajudicial killings by security forces

## What happens after you file
NHRC will acknowledge your complaint, investigate the facts, and attempt mediation. If mediation fails it refers the matter to court or the appropriate authority. The Commission cannot award damages directly but can make binding recommendations and refer cases for prosecution.

## Contact
- Website: nigeriarights.gov.ng
- Address: 23 Aguiyi Ironsi Street, Maitama, Abuja
- Phone: +234 (0) 9 672 7369
`,
  },

  // ── NAPTIP: National Agency for the Prohibition of Trafficking in Persons
  {
    source: 'NAPTIP',
    title: 'NAPTIP - Reporting Trafficking and Exploitation',
    url: 'https://naptip.gov.ng',
    content: `# NAPTIP — National Agency for the Prohibition of Trafficking in Persons

## What NAPTIP does
NAPTIP is the federal agency that investigates and prosecutes trafficking in persons, child labour, and related forms of exploitation in Nigeria. It also runs rehabilitation shelters for survivors.

## How to report
**Toll-free hotline:** Call 0800-800-800-0 (free from any network, 24 hours).

**Online:** Visit naptip.gov.ng to submit a tip or complaint.

**Walk in:** Any NAPTIP zonal office. Offices are in Abuja (HQ), Lagos, Kano, Enugu, Benin City, Sokoto, and Uyo.

**SMS:** Send the word HELP to 6460.

Your identity is kept confidential. You can report anonymously.

## What counts as trafficking
- Recruiting, transporting, or harbouring a person by force, deception, or coercion for labour or sexual exploitation
- Moving children across borders for any form of labour without parental consent
- Domestic servitude (using someone as a house servant through threats or debt bondage)
- Commercial sexual exploitation of adults or minors
- Organ trafficking

## Support for survivors
NAPTIP operates shelter homes where survivors receive medical care, psychosocial support, vocational training, and legal assistance. Contact the hotline or any zonal office to access these services.
`,
  },

  // ── Arrest rights under ACJA 2015 (replaces the thin NPF seed document) ──
  {
    source: 'NPF',
    title: 'Rights When Arrested by the Police in Nigeria',
    url: 'https://www.npf.gov.ng/',
    replaces: ['Nigeria Police Force - Law Enforcement'],
    content: `# Rights When Arrested by the Police in Nigeria

The Administration of Criminal Justice Act 2015 (ACJA) is the main federal law governing arrest, detention, and bail. States have their own versions (ACJLs) with similar protections.

## Your rights at the point of arrest
1. **Right to know why you are being arrested.** The officer must tell you the reason for the arrest at the time it happens (ACJA s. 6).
2. **Right to remain silent.** You are not required to answer questions or make a statement. Anything you say can be used as evidence.
3. **Right to a lawyer.** You have the right to consult a legal practitioner of your choice as soon as you are arrested (ACJA s. 6(3)).
4. **Right to notify someone.** You may inform a family member or friend of your arrest and location.

## How long can police hold you without charge?
- **Normal cases:** 24 hours (or one court day if 24 hours expires on a weekend or public holiday) — ACJA s. 29.
- **Terrorism or cybercrime cases:** up to 48 hours (or longer with a court order).

If you have not been charged or brought before a court within that period, the police must release you on bail or take you to court.

## Bail rights
Bail for bailable offences cannot be unreasonably refused. The officer in charge of a police station must grant bail for minor offences. For offences not specifically listed as non-bailable, a court can still grant bail.

## If your rights are violated
1. **Apply for bail** at the magistrate court nearest to the station where you are held.
2. **Apply for habeas corpus** in the High Court to compel your release if detained unlawfully.
3. **Report to the NHRC** (nigeriarights.gov.ng) for a formal human rights complaint after the fact.
4. **Contact the Legal Aid Council** (legal-aid.gov.ng) if you cannot afford a lawyer.

## Other police services
- Crime reporting: call 112 (national emergency) or visit the nearest police station
- Police clearance certificate: apply at any state CID or the Force Criminal Records Office, Abuja
- Character verification for visa applications: handled at state commands
`,
  },

  // ── Certificate of Occupancy ───────────────────────────────────────────
  {
    source: 'Ministry of Lands',
    title: 'Certificate of Occupancy — How to Apply',
    url: 'https://agis.fcta.gov.ng',
    content: `# Certificate of Occupancy (C of O)

## What it is
A Certificate of Occupancy (C of O) is the official document that records a person's or organisation's right of occupancy over land in Nigeria. Under the Land Use Act 1978, all land is vested in the state governor (or the Minister for the FCT in Abuja). A C of O does not transfer ownership of land — it grants a statutory right of occupancy, usually for 99 years.

## Who issues it
C of O certificates are issued by the land authority of the state (or FCT) where the land is located. There is no single national portal; the process and fees differ by state.

## FCT Abuja — AGIS
In Abuja, applications are handled by the Abuja Geographic Information Systems (AGIS) under the FCTA.
- Website: agis.fcta.gov.ng
- You can download application forms, check plot status, and book appointments on the AGIS portal.
- Documents typically needed: survey plan, proof of purchase/allocation, valid ID, TIN, and evidence of development.
- Contact AGIS directly for the current fee schedule before you submit; fees are updated periodically.

## Other states — Ministry of Lands
In each state, the Ministry of Lands (or Ministry of Lands and Housing) processes C of O applications. Some states also have a geographic information authority (e.g. KAGIS in Kaduna, LAGIS in Lagos).

**How to find your state's process:**
1. Search for "[State name] Ministry of Lands Certificate of Occupancy" to find the official state portal.
2. Visit the ministry in person to get the current forms, fees, and checklist.
3. Confirm processing times — they vary from weeks to several months depending on the state.

## Typical process (most states follow this broadly)
1. Obtain and complete the prescribed application form from the state land registry.
2. Attach required documents: survey plan, evidence of acquisition (deed of assignment, allocation letter), personal ID, and TIN.
3. Pay the application fee (varies by state and land area).
4. Inspection: a surveyor from the land registry may visit the land.
5. The application is processed by the governor's office or relevant authority.
6. Certificate is issued and registered.

## Right of Occupancy vs. Deed of Assignment
A C of O is government-issued. A Deed of Assignment is a private document transferring one person's right to another. To be fully protected, you should register both: the deed with the land registry and ensure the C of O (or a governor's consent to the assignment) is in your name.

## Governor's consent
If you buy land from someone who already holds a C of O, you must get the governor's consent to the assignment. Without it, the transaction is not valid. Apply for consent at the same state land registry.
`,
  },

  // ── FIRS Tax Clearance Certificate ────────────────────────────────────
  {
    source: 'FIRS',
    title: 'Tax Clearance Certificate — How to Apply',
    url: 'https://taxpromax.firs.gov.ng',
    content: `# Tax Clearance Certificate (TCC)

## What it is
A Tax Clearance Certificate (TCC) is official proof that a taxpayer has paid all due taxes for the preceding three years (or is not taxable). It is required for many government contracts, importation licences, motor vehicle registration, real estate transactions, and applications for certain permits.

## Who issues it
- **Federal taxes (companies, VAT, withholding tax):** Federal Inland Revenue Service (FIRS) via TaxProMax at taxpromax.firs.gov.ng.
- **Personal income tax (employees, self-employed individuals):** The State Internal Revenue Service (SIRS) of the state where you are resident or where your employer is based.

## Federal TCC — FIRS via TaxProMax
1. Register or log in at taxpromax.firs.gov.ng.
2. Ensure your company's TIN is active and all returns (CIT, VAT, WHT) are filed and outstanding liabilities paid.
3. Navigate to **Services → Tax Clearance Certificate**.
4. Submit the application. FIRS reviews your compliance history.
5. Approved certificates are available to download from the portal.

If you have outstanding tax liabilities, pay them before applying. FIRS will not issue a TCC while there are unpaid assessments or penalties.

## State TCC — Personal income tax
Employees pay PAYE through their employer, which remits to the state SIRS. If you are self-employed or have a business in a state, you file and pay at the state tax authority.

To apply for a state TCC:
1. Confirm all PAYE or personal income tax has been filed and paid.
2. Contact your state's internal revenue service (e.g. LIRS for Lagos, KIRS for Kano, ABIRS for Abia).
3. Many states now accept online applications; check the state IRS website for current procedures.

## Common reasons for rejection
- Outstanding tax liabilities or unfiled returns
- Mismatch between declared income and employer records
- TIN not linked to your BVN or company RC number

## For first-time applicants
If you have never paid tax (new company or new employee), obtain a TIN from FIRS (firs.gov.ng) or the state SIRS first. A TIN is required before you can file returns or apply for a TCC.
`,
  },

]

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

let client
let target
if (!dbFile && process.env.TURSO_DATABASE_URL) {
  const { createClient } = await import('@libsql/client')
  client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  target = `Turso (${new URL(process.env.TURSO_DATABASE_URL.replace(/^libsql:/, 'https:')).host})`
} else {
  const { default: Database } = await import('better-sqlite3')
  const file = dbFile ?? path.join(__dirname, '../data/ngscorecard.db')
  client = new Database(file)
  target = `local file ${file}`
}

console.log(`Target: ${target}`)
console.log(apply ? 'Mode: APPLY' : 'Mode: dry run (add --apply to write)')

const r = await syncDocuments(client, docs, { apply, origin: null })
const verb = apply ? '' : 'would be '
console.log(`\nDocuments ${verb}inserted:  ${r.inserted}`)
console.log(`Documents ${verb}updated:   ${r.updated}`)
console.log(`Documents ${verb}rechunked: ${r.rechunked}`)
console.log(`Documents unchanged:         ${r.unchanged}`)
if (r.extra?.length) {
  console.log(`\nDocuments in DB not in this set: ${r.extra.length}`)
  r.extra.forEach(d => console.log(`  - [${d.id}] ${d.source}: ${d.title}`))
}
