#!/usr/bin/env node

/**
 * Government data sources for RAG ingestion
 * Each source defines: title, agency, URL, and content
 * Expand this as you add more scrapers or manual data
 */

export const governmentDocuments = [
  {
    source: 'CAC',
    title: 'Business Registration Process',
    url: 'https://www.cac.gov.ng/newcompanypage/namecheck',
    content: `# Business Registration with CAC

## Overview
How to Register a Business with CAC. The Corporate Affairs Commission (CAC) is the sole regulatory authority for business registration in Nigeria.

## Step 1: Check Business Name Availability
Visit the Corporate Affairs Commission website and search the name availability database. Your business name must be unique and not similar to existing registered names. The search is typically completed within 1-3 days.

## Step 2: Prepare Registration Documents
Gather the following documents:
- Form CAC 2 (Articles of Association and Memorandum)
- Certificate of Incorporation application
- Directors and shareholders information
- Proof of business address

## Step 3: Submit Application
Submit your documents either online through the CAC portal or at an approved CAC office. The processing fee is between ₦20,000 and ₦50,000 depending on the company type.

## Step 4: Receive Certificate
Upon approval, you will receive your Certificate of Incorporation and RC (Registration Certificate) number, which serves as proof of business registration.

## Fees and Timeline
- Cost: ₦20,000–₦50,000
- Timeline: 3–5 business days`
  },
  {
    source: 'FIRS',
    title: 'Tax Registration and TIN Application',
    url: 'https://www.firs.gov.ng/businesstaxonline/',
    content: `# Federal Inland Revenue Service - Tax Registration

## Tax Identification Number (TIN) Registration

A Tax Identification Number (TIN) is required for all business operations in Nigeria. This number is used for tax compliance and government transactions.

## How to Obtain a TIN

### Online Registration (Recommended)
1. Visit the FIRS online portal at taxes.firs.gov.ng
2. Complete the registration form with your business details
3. Provide proof of business address
4. Submit and receive your TIN instantly

### Physical Registration
1. Visit your nearest FIRS office
2. Present required documents including CAC registration certificate
3. Complete the registration form
4. TIN is issued on the same day

## Required Documents
- Valid business registration certificate (CAC)
- Proof of business address (utility bill or lease agreement)
- Identification of business owner/manager
- Business bank account details

## Cost and Timeline
- Cost: Free
- Timeline: Same day to 2 days`
  },
  {
    source: 'NBS',
    title: 'Current Economic Indicators',
    url: 'https://www.nigerianstat.gov.ng/',
    content: `# National Bureau of Statistics - Economic Data

## Current Inflation and Economic Indicators

## National Consumer Price Index (CPI)
The Consumer Price Index measures the average change in prices paid by consumers for goods and services. The latest inflation data shows key economic trends affecting businesses and households.

## Key Economic Indicators
- Inflation Rate: Published monthly by NBS
- Unemployment Rate: From labor force surveys
- GDP Growth: Quarterly economic growth reports
- Exchange Rate: Official rates published daily
- Poverty Statistics: From multidimensional poverty index

## Data Sources
All official statistics are available through:
- NBS Statistical Bulletins
- Quarterly economic reports
- State-specific socioeconomic data`
  },
  {
    source: 'CBN',
    title: 'Central Bank Monetary Policy',
    url: 'https://www.cbn.gov.ng/',
    content: `# Central Bank of Nigeria - Monetary Policy

## Monetary Policy Rate and Banking Regulations

The Central Bank of Nigeria maintains monetary policy to control inflation and promote economic growth.

## Key Rates
- Monetary Policy Rate (MPR): Set by the CBN Monetary Policy Committee
- Current rates announced quarterly
- Banks adjust lending rates based on CBN policy

## Banking Services and Regulations
- Account opening requirements for individuals and businesses
- Know Your Customer (KYC) compliance is mandatory
- Minimum balance requirements vary by bank
- Transfer limits and daily transaction thresholds apply

## Foreign Exchange
- Official exchange rate set by the CBN
- Rates fluctuate daily based on market conditions
- Parallel market rates may differ from official rates
- Remittances subject to CBN regulations`
  },
  {
    source: 'NIMC',
    title: 'National ID Registration (NIN)',
    url: 'https://www.nimc.gov.ng/',
    content: `# National Identification Management Commission - NIN Registration

## National Identification Number (NIN)

The National Identification Number is a unique identity document required for most government and financial services in Nigeria.

## Who Needs a NIN
- All Nigerian citizens (adults and children)
- Required for passport applications
- Required for SIM card registration
- Required for bank account opening
- Required for business registration

## How to Apply for NIN

1. Visit nearest NIMC enrollment center
2. Bring required documents:
   - Birth certificate or old passport
   - Proof of address (utility bill, lease agreement)
   - Guardian consent (for minors)
3. Complete the registration form
4. Biometric capture (fingerprints, facial recognition)
5. Receive temporary receipt
6. Collect physical card within 1-3 weeks

## Cost and Timeline
- Cost: Free for citizens
- Timeline: 1-3 weeks for card delivery
- Documents: Available online at nimc.gov.ng`
  },
  {
    source: 'BPP',
    title: 'Government Procurement Portal',
    url: 'https://www.bpp.gov.ng/',
    content: `# Budget Office of the Federation - Government Procurement

## Public Procurement Process

The Bureau of Public Procurement oversees all government contracts and procurement activities.

## Tender Information
- All active tenders posted on BPP portal
- Open to qualified Nigerian and international bidders
- Minimum qualification requirements set per project
- Deadline extensions possible with justification

## How to Bid
1. Register on BPP portal
2. Search for relevant tenders
3. Download tender documents (small fee)
4. Prepare bid according to specifications
5. Submit before deadline
6. Tender evaluation (4-8 weeks typically)
7. Contract award announcement

## Eligibility Requirements
- Registered business in Nigeria
- Current tax clearance certificate
- Bank references
- No conflict of interest declarations

## Benefits
- Equal opportunity for all qualified bidders
- Transparent process with appeals mechanism
- Payment guaranteed by government`
  }
]

export const stateServices = [
  {
    state: 'Lagos',
    source: 'LIRS',
    title: 'Lagos Internal Revenue Service',
    url: 'https://www.lirs.gov.ng/',
    content: `# Lagos State Tax Registration and Revenue

## Lagos State Internal Revenue Service (LIRS)

Lagos State businesses must register with LIRS for state tax purposes.

## Tax Registration Services
- Personal Income Tax (PIT)
- Business Income Tax
- Capital Gains Tax
- Value Added Tax (VAT) - federal

## How to Register
1. Online: Visit lirs.gov.ng
2. Submit business details
3. Provide proof of address in Lagos
4. Receive LIRS PIN

## Cost and Filing
- Cost: Free registration
- Filing: Monthly or quarterly depending on business type
- Contact: LIRS Lagos State`
  },
  {
    state: 'Rivers',
    source: 'RIRS',
    title: 'Rivers State Internal Revenue Board',
    url: 'https://www.riversirs.gov.ng/',
    content: `# Rivers State Tax Registration

## Rivers State Internal Revenue Service (RIRS)

Businesses operating in Rivers State must register with RIRS.

## Services Offered
- Personal income tax
- Business profit tax
- Property tax registration
- License and permit services

## Registration Process
- Visit rirs.gov.ng or local office
- Submit CAC certificate, ID, proof of address
- Complete registration form
- Receive registration confirmation`
  }
]
