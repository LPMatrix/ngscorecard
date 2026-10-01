#!/usr/bin/env node

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { addDocument } from '../server/rag.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../data.db')

// Sample government documents to ingest
const sampleDocuments = [
  {
    source: 'CAC',
    title: 'Business Registration Process',
    url: 'https://www.cac.gov.ng/newcompanypage/namecheck',
    content: `How to Register a Business with CAC

Step 1: Check Business Name Availability
Visit the Corporate Affairs Commission website and search the name availability database. Your business name must be unique and not similar to existing registered names. The search is typically completed within 1-3 days.

Step 2: Prepare Registration Documents
Gather the following documents:
- Form CAC 2 (Articles of Association and Memorandum)
- Certificate of Incorporation application
- Directors and shareholders information
- Proof of business address

Step 3: Submit Application
Submit your documents either online through the CAC portal or at an approved CAC office. The processing fee is between ₦20,000 and ₦50,000 depending on the company type.

Step 4: Receive Certificate
Upon approval, you will receive your Certificate of Incorporation and RC (Registration Certificate) number, which serves as proof of business registration.

Cost: ₦20,000–₦50,000
Timeline: 3–5 business days`
  },
  {
    source: 'FIRS',
    title: 'Tax Registration and TIN Application',
    url: 'https://www.firs.gov.ng/businesstaxonline/',
    content: `Federal Inland Revenue Service - Tax Registration

Tax Identification Number (TIN) Registration

A Tax Identification Number (TIN) is required for all business operations in Nigeria. This number is used for tax compliance and government transactions.

How to Obtain a TIN:

1. Online Registration (Recommended)
Visit the FIRS online portal at taxes.firs.gov.ng
Complete the registration form with your business details
Provide proof of business address
Submit and receive your TIN instantly

2. Physical Registration
Visit your nearest FIRS office
Present required documents including CAC registration certificate
Complete the registration form
TIN is issued on the same day

Required Documents:
- Valid business registration certificate (CAC)
- Proof of business address (utility bill or lease agreement)
- Identification of business owner/manager
- Business bank account details

Cost: Free
Timeline: Same day to 2 days

Tax Obligations:
Once registered, you must file monthly or quarterly tax returns depending on your business type.`
  },
  {
    source: 'NBS',
    title: 'Current Economic Indicators',
    url: 'https://www.nigerianstat.gov.ng/',
    content: `National Bureau of Statistics - Economic Data

Current Inflation and Economic Indicators (2024)

National Consumer Price Index (CPI)
The Consumer Price Index measures the average change in prices paid by consumers for goods and services. As of the latest report, inflation stands at 34.60% year-on-year, though monthly changes vary.

Key Economic Indicators:
- Inflation Rate: 34.60% (YoY as of latest report)
- Unemployment Rate: Data varies by labor force survey
- GDP Growth: Official figures available in quarterly reports
- Exchange Rate: NGN/USD fluctuates; check CBN daily for current rates

Poverty Statistics:
The most recent multidimensional poverty index shows significant variation across regions and states.

Data Sources:
All official statistics are available through:
- NBS Statistical Bulletin
- Quarterly economic reports
- State-specific socioeconomic data

For the most current figures, visit the NBS website regularly.`
  },
  {
    source: 'CBN',
    title: 'Central Bank Monetary Policy',
    url: 'https://www.cbn.gov.ng/',
    content: `Central Bank of Nigeria - Monetary Policy

Monetary Policy Rate and Banking Regulations

The Central Bank of Nigeria maintains monetary policy to control inflation and promote economic growth.

Key Rates:
- Monetary Policy Rate (MPR): Set by the CBN Monetary Policy Committee
- Current rates and changes are announced quarterly
- Banks adjust lending rates based on CBN policy rates

Banking Services and Regulations:
- Account opening requirements for individuals and businesses
- Know Your Customer (KYC) compliance is mandatory
- Minimum balance requirements vary by bank and account type
- Transfer limits and daily transaction thresholds apply

Foreign Exchange:
- Official exchange rate set by the CBN
- Rates fluctuate daily based on market conditions
- Parallel market rates may differ from official rates
- Remittances subject to CBN regulations

For Current Rates:
Visit cbn.gov.ng for:
- Daily exchange rates
- Current monetary policy rate
- Latest banking regulations
- Official bulletins and announcements`
  }
]

async function ingestDocuments() {
  console.log('Ingesting sample government documents...')

  const db = new Database(dbPath)

  for (const doc of sampleDocuments) {
    try {
      const docId = await addDocument(db, doc)
      console.log(`✓ Ingested: ${doc.title} (ID: ${docId})`)
    } catch (error) {
      console.error(`✗ Failed to ingest ${doc.title}:`, error.message)
    }
  }

  console.log('Done!')
  db.close()
}

ingestDocuments().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
