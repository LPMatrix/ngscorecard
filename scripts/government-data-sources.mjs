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
  },
  {
    source: 'NIS',
    title: 'Nigerian Immigration Service - Passport Services',
    url: 'https://immigration.gov.ng/',
    content: `# Nigerian Immigration Service - Passport Services

## Passport Application Process

The Nigerian Immigration Service (NIS) handles all passport applications and renewals for Nigerian citizens.

## Types of Passports
- Standard Passport (32 pages): Valid for 5 years
- Official Passport: For government officials on official business
- Diplomatic Passport: For diplomats and officials

## Application Steps
1. Complete online pre-registration at immigration.gov.ng
2. Visit any NIS office with required documents
3. Provide biometric data (fingerprints and facial recognition)
4. Pay applicable fees
5. Receive acknowledgment slip with tracking number
6. Return on stated date to collect passport

## Required Documents
- Completed application form
- Birth certificate (original and photocopy)
- National ID card or driver's license
- Four passport-sized photographs
- Proof of payment
- Return ticket (for first-time applicants)

## Processing Time and Fees
- Standard: 7 business days
- Express: 2-3 business days
- Premium: Same day (where available)
- Fees vary by passport type and processing speed`
  },
  {
    source: 'FRSC',
    title: 'Federal Road Safety Corps - Driver License and Vehicle Registration',
    url: 'https://www.frsc.gov.ng/',
    content: `# Federal Road Safety Corps - Driver License and Vehicle Registration

## Driver License Services

The Federal Road Safety Corps (FRSC) administers driving licenses and vehicle registration in Nigeria.

## Obtaining a Driver's License
1. Obtain a National ID card from NIMC (prerequisite)
2. Visit any FRSC office or driving school
3. Complete medical examination
4. Pass theory test covering traffic rules
5. Complete practical driving test
6. Pay license fee
7. Receive temporary and later permanent license

## Driver License Classes
- Class A: Motorcycles up to 50cc
- Class B: Light vehicles up to 3,500kg
- Class C: Heavy vehicles over 3,500kg
- Class D: Public transport vehicles
- Class E: Articulated vehicles

## Vehicle Registration
- Register vehicle within 30 days of purchase
- Bring vehicle particulars and proof of ownership
- Complete vehicle inspection
- Pay registration fee
- Receive registration number and plate

## Renewal
- Vehicle inspection: Annually for private, biannually for commercial
- License renewal: Every 5 years for drivers
- Must renew before expiration to avoid penalties`
  },
  {
    source: 'NHIS',
    title: 'National Health Insurance Scheme',
    url: 'https://www.nhis.gov.ng/',
    content: `# National Health Insurance Scheme - Healthcare Access

## NHIS Overview

The National Health Insurance Scheme (NHIS) provides healthcare coverage for Nigerians through registered health providers.

## NHIS Programs
- Formal Sector Social Health Insurance Program (FSSHIP)
- Informal Sector Social Health Insurance Program (ISSHIP)
- Vulnerable Group Program (VGP)
- Primary Healthcare under One Roof (PHCUR)

## Who Can Register
- Private sector employees and employers
- Self-employed individuals
- Informal sector workers
- Vulnerable populations
- Children under 18 years
- Persons above 60 years

## Benefits Covered
- Outpatient consultation and drugs
- Inpatient care
- Maternal and child health services
- Preventive and health promotion services
- Dental and eye care (limited)

## Registration Process
1. Visit nearest NHIS office or accredited provider
2. Complete registration form
3. Provide identification documents
- Pay annual membership fee
5. Receive NHIS card
6. Visit any accredited healthcare facility

## Membership Fees
- Individual membership: Fees vary by program
- Family membership: Discounted rate for families
- Group schemes available for employers`
  },
  {
    source: 'JAMB',
    title: 'Joint Admissions and Matriculation Board - University Admissions',
    url: 'https://www.jamb.gov.ng/',
    content: `# Joint Admissions and Matriculation Board - UTME & University Admission

## JAMB Services

JAMB administers the Unified Tertiary Matriculation Examination (UTME) and Post-UTME for university admissions in Nigeria.

## UTME Registration
1. Obtain a JAMB registration form from any cybercafé or online portal
2. Provide required information including educational background
3. Select universities and courses in order of preference
4. Pay registration fee
5. Schedule examination date
6. Take UTME examination

## UTME Format
- Computer-Based Test (CBT) format
- 4 subjects tested (English Language + 3 others)
- 120 questions total, 2 hours duration
- Scores valid for one academic year

## Post-UTME
- Conducted by individual universities
- Additional screening after UTME
- Tests understanding of specific university programs
- Usually conducted in August/September

## Required Documents for Admission
- UTME result slip
- O'Level results (WAEC, NECO, or equivalent)
- School leaving certificate
- Birth certificate
- National ID or passport
- Post-UTME result

## Cutoff Scores
- Varies by institution and program
- Generally ranges from 120-200 out of 400
- Check individual university websites for specific cutoffs`
  },
  {
    source: 'BUA',
    title: 'Bureau of Unemployment and Vocational Training',
    url: 'https://www.bua.gov.ng/',
    content: `# Bureau of Unemployment and Vocational Training

## Skills Development and Employment Support

The Bureau supports unemployment reduction through vocational training and skills development programs.

## Training Programs Available
- Welding and metal fabrication
- Electrical installation and repair
- Plumbing and pipe fitting
- Carpentry and joinery
- Tailoring and fashion design
- Hairdressing and beauty services
- Catering and food production
- Masonry and construction
- Automotive repair
- Information technology basics

## Who Can Enroll
- School leavers seeking skills
- Unemployed youth (18-35 years)
- Persons seeking career changes
- Individuals wanting to start businesses

## Enrollment Process
1. Visit nearest training center
2. Complete registration form
3. Attend orientation program
4. Begin training (duration varies: 3-12 months)
5. Practical and theoretical components
6. Obtain certificate upon completion

## Support Provided
- Free or subsidized training
- Training materials and tools
- Certification upon completion
- Job placement assistance
- Business startup support and mentoring
- Post-training follow-up

## Locations
- Centers in major states and LGAs
- Mobile training units for remote areas
- Online courses for select programs`
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
  },
  {
    state: 'Kano',
    source: 'KIRS',
    title: 'Kano State Internal Revenue Service',
    url: 'https://www.kanoirs.gov.ng/',
    content: `# Kano State Tax and Revenue Services

## Kano Internal Revenue Service (KIRS)

KIRS manages tax collection and revenue generation for Kano State government.

## Revenue Services
- Personal income tax
- Business taxes
- Property and land taxes
- License and permits

## Registration Requirements
- Valid business registration (CAC)
- National identification
- Proof of business location
- Bank account details

## Tax Filing
- Annual tax returns required
- Monthly payments for large businesses
- Quarterly for medium enterprises
- Annual for small businesses`
  },
  {
    state: 'Kaduna',
    source: 'KADIRS',
    title: 'Kaduna State Internal Revenue Service',
    url: 'https://www.kadunarevenue.ng/',
    content: `# Kaduna State Revenue Service

## Tax and Revenue Collection

Kaduna State Internal Revenue Service ensures sustainable revenue for state development.

## Services Provided
- Business registration and taxes
- Personal income tax
- Property tax assessment
- Business permits and licenses

## Registration Process
1. Visit KADIRS office or website
2. Complete registration forms
3. Provide supporting documents
4. Obtain tax ID number
5. Begin tax filing and payment

## Payment Methods
- Online payment portal
- Bank transfers
- In-person at KADIRS offices
- Mobile money services (where available)`
  },
  {
    state: 'Oyo',
    source: 'OYIRS',
    title: 'Oyo State Internal Revenue Service',
    url: 'https://www.oyostatirs.gov.ng/',
    content: `# Oyo State Internal Revenue Service

## Tax Administration and Revenue

OYIRS administers taxes to support Oyo State government operations and services.

## Tax Types
- Personal income tax
- Business profit tax
- Capital gains tax
- Property tax
- Vehicle tax

## Registration
1. Obtain business registration from CAC
2. Visit nearest OYIRS office
3. Complete registration form
4. Provide identification documents
5. Get tax ID and commence filing

## Compliance Requirements
- Annual tax returns
- Quarterly payments for certain businesses
- Monthly returns for high-income earners
- Updated records maintenance`
  },
  {
    state: 'Federal Capital Territory',
    source: 'FIRS-FCT',
    title: 'FCT Tax Board - Abuja',
    url: 'https://www.fct.gov.ng/',
    content: `# Federal Capital Territory - Tax Services

## FCT Revenue Board Services

The FCT Revenue Board manages local taxation and development levies in Abuja.

## Tax Services
- Property taxes and rates
- Business licenses
- Development levies
- Municipal taxes

## Business Registration
1. Register with CAC nationally
2. Register with FCT Revenue Board locally
3. Obtain FCT tax ID
4. Pay registration and initial levy

## Payment and Compliance
- Quarterly or annual payment options
- Online payment system available
- Local government area (LGA) offices
- Easy compliance procedures

## Support Services
- Tax advisory services
- Business expansion support
- Investor facilitation`
  }
]
