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
  },
  {
    source: 'WAEC',
    title: 'West African Examinations Council - Secondary School Exams',
    url: 'https://www.waecnigeria.org/',
    content: `# West African Examinations Council - WAEC

## Secondary School Examination Services

WAEC conducts the West African School Certificate Examination (WASCE) for secondary school students.

## Examination Subjects
- Mathematics
- English Language
- Integrated Science (Biology, Chemistry, Physics)
- Social Studies
- Civic Education
- Electives (Arts, Sciences, Commercial)

## Who Can Register
- Secondary school students (Internal candidates)
- Private candidates (External candidates)
- Adults seeking certification

## Registration Process
1. Schools register candidates through WAEC portal
2. Provide student details and subject choices
3. Pay examination fees
4. Receive admission slips before exam
5. Attend examination sessions

## Examination Schedule
- Conducted twice yearly (May/June and November/December)
- Computer-based and paper-based options
- Results issued within 6-8 weeks

## Results and Certification
- Official result slips issued
- Multiple copies available for university applications
- Replacement slips can be obtained
- Results valid indefinitely`
  },
  {
    source: 'NECO',
    title: 'National Examinations Council - School Certificate Exams',
    url: 'https://www.neco.gov.ng/',
    content: `# National Examinations Council - NECO

## Secondary School Certificate Examination

NECO conducts the Senior Secondary Certificate Examination (SSCE) for Nigerian students.

## Examination Subjects
- English Language
- Mathematics
- Biology, Chemistry, Physics
- History, Geography
- Literature in English
- Commercial subjects
- Technical and vocational subjects

## Exam Types
- School-based (Internal candidates)
- Private candidates (SSCE for Adults)
- GCE (General Certificate of Education)

## Registration Requirements
- Candidate personal data
- School or registration center information
- Choice of subjects (minimum 4, maximum 9)
- Valid identification

## Examination Details
- Conducted twice yearly
- Computer-based testing
- Practical examinations for science subjects
- Results issued within 4-6 weeks

## Result Uses
- University admission
- Employment qualifications
- Vocational training requirements
- International recognition`
  },
  {
    source: 'Ministry of Health',
    title: 'Federal Ministry of Health - Healthcare Services',
    url: 'https://www.health.gov.ng/',
    content: `# Federal Ministry of Health

## Healthcare Services and Immunization Programs

The Ministry of Health oversees national healthcare policies and disease prevention programs.

## Key Services
- Disease surveillance and control
- Immunization programs (routine and campaigns)
- Maternal and child health services
- Communicable disease management
- Emergency response services
- Health facility regulation

## Immunization Program
- Routine childhood immunization
- Adult immunization services
- Disease outbreak response
- Vaccination centers in all LGAs
- Free immunization for children

## How to Access Services
1. Visit nearest health facility
2. Bring valid identification
3. Consult health worker
4. Receive service or referral
5. Obtain health records

## Services Available
- Preventive health services
- Treatment for communicable diseases
- Maternal healthcare
- Child health services
- Disability and rehabilitation

## Locations
- Primary health centers (PHCs)
- State health facilities
- General hospitals
- Teaching hospitals`
  },
  {
    source: 'SON',
    title: 'Standards Organisation of Nigeria - Product Quality Standards',
    url: 'https://www.sonigeria.gov.ng/',
    content: `# Standards Organisation of Nigeria - SON

## Quality Assurance and Product Standards

SON ensures products and services meet Nigerian and international quality standards.

## Services Provided
- Product certification and testing
- Factory inspection and audits
- Standards information and training
- Product quality verification
- Import/export compliance

## Testing and Certification
- Laboratory testing of products
- Compliance with Nigerian standards
- International standard compliance
- Certificate issuance for compliant products

## Who Needs Certification
- Manufacturers in Nigeria
- Import/export traders
- Food and beverage producers
- Construction material suppliers
- Electrical equipment manufacturers

## Application Process
1. Submit product samples
2. Complete application form
3. Pay certification fees
4. Undergo factory inspection
5. Laboratory testing
6. Issue certificate upon compliance

## Standard Categories
- Food safety standards
- Building materials
- Electrical safety
- Environmental protection
- Industrial products`
  },
  {
    source: 'SERAP',
    title: 'Special Offences Response Team - Anticorruption',
    url: 'https://www.serap.org.ng/',
    content: `# Special Offences Response Team - SERAP

## Anti-Corruption and Public Rights Advocacy

SERAP is an organization that files strategic lawsuits and advocacy for government accountability and budget transparency.

## Focus Areas
- Public sector accountability
- Budget transparency
- Anti-corruption litigation
- Citizens' rights advocacy
- Freedom of information access

## Services
- Legal representation in public interest cases
- Corruption complaint support
- Budget monitoring and analysis
- Public interest litigation
- Capacity building on rights

## How to File a Complaint
1. Contact SERAP office
2. Provide details of alleged corruption
3. Gather supporting documentation
4. File formal complaint
5. SERAP legal team assessment
6. Possible legal action

## Rights Protected
- Right to public accountability
- Access to government information
- Fair budget allocation
- Anti-corruption enforcement
- Citizens' participation in governance

## Contact and Support
- Free legal consultation
- Complaint handling
- Case monitoring
- Public advocacy campaigns`
  },
  {
    source: 'INEC',
    title: 'Independent National Electoral Commission',
    url: 'https://www.inecnigeria.org/',
    content: `# Independent National Electoral Commission - INEC

## Electoral Services and Voter Registration

INEC manages all electoral processes in Nigeria including voter registration, election organization, and results management.

## Voter Registration
1. Visit designated INEC registration center
2. Provide valid identification (passport, driver's license, NIN)
3. Complete registration form
4. Provide biometric data
5. Receive voter registration slip
6. Check voter status online

## Voting Requirements
- Must be Nigerian citizen
- Must be 18 years or older
- Must be registered as voter
- Valid voter card or registration number

## Election Cycles
- Presidential and National Assembly elections
- Gubernatorial and State Assembly elections
- Local Government elections
- Off-cycle elections as scheduled

## Services
- Voter registration and verification
- Election information and schedule
- Polling unit locator
- Election observer registration
- Complaint handling

## Online Services
- Check voter status: www.inecnigeria.org
- Download voter registration slip
- Find polling unit location
- Register as election observer`
  },
  {
    source: 'NYSC',
    title: 'National Youth Service Corps - Youth Service',
    url: 'https://www.nysc.gov.ng/',
    content: `# National Youth Service Corps - NYSC

## Youth Engagement and National Service

NYSC operates the mandatory one-year national service program for Nigerian graduates.

## Who Must Enlist
- University graduates (first degree holders)
- Polytechnic graduates (upper credit and above)
- Age: between 18-30 years
- Nigerian citizen with valid identification

## Enrollment Process
1. Obtain discharge certificate from institution
2. Register online at portal.nysc.gov.ng
3. Print registration slip
4. Attend orientation camp (3 weeks)
5. Deploy to service location
6. Complete service year
7. Obtain discharge certificate

## Service Locations
- Federal government ministries
- State government agencies
- Private organizations
- Educational institutions
- Healthcare facilities

## Allowances and Benefits
- Monthly stipend (₦33,000)
- Accommodation during camp
- Clothing and feeding during camp
- Post-service employment support
- Loan/grant scheme for entrepreneurs

## Discharge Benefits
- Certificate of national service
- Personal accident insurance
- Employment opportunities
- Entrepreneurship support`
  },
  {
    source: 'NPC',
    title: 'National Population Commission - Census and Demographics',
    url: 'https://www.population.gov.ng/',
    content: `# National Population Commission - NPC

## Census, Vital Registration and Population Data

NPC conducts national population census and manages demographic statistics.

## National Census
- Conducted every 10 years
- Provides population count and demographics
- Used for planning and resource allocation
- Census enumerators visit households

## Vital Registration
- Birth registration
- Death registration
- Marriage registration
- Divorce registration

## Birth Registration
1. Register within 3 months of birth
2. Visit nearest NPC office with:
   - Child's birth notification slip
   - Parent's identification
   - Hospital discharge slip (if hospital birth)
3. Complete registration form
4. Receive birth certificate

## Death Registration
1. Report to NPC within 30 days
2. Provide death certificate
3. Provide deceased person's details
4. Pay registration fee
5. Obtain death registration

## Services
- Demographic research and data
- Population projections
- Census operations
- Vital statistics
- Training and awareness`
  },
  {
    source: 'NPF',
    title: 'Nigeria Police Force - Law Enforcement',
    url: 'https://www.npf.gov.ng/',
    content: `# Nigeria Police Force - NPF

## Law Enforcement and Public Safety

The Nigeria Police Force maintains law and order and protects citizens.

## Services
- Crime investigation and reporting
- Visa applications and character verification
- Police clearance certificates
- Traffic law enforcement
- Community policing
- Emergency response (999 hotline)

## Reporting a Crime
1. Call 999 (emergency) or visit nearest police station
2. Provide details of incident
3. File official report
4. Receive incident number
5. Follow up on investigation

## Police Clearance Certificate
- Required for: visa applications, employment, business registration
- Apply at nearest police station
- Provide identification and application form
- Pay processing fee
- Certificate issued within 1-2 weeks

## Traffic and Vehicle Services
- Vehicle registration and licensing
- Traffic offence handling
- Accident investigation and reporting
- Driving permit services

## Community Safety
- Crime prevention awareness
- Public education programs
- Community-police relations
- Neighborhood watch support`
  },
  {
    source: 'EFCC',
    title: 'Economic and Financial Crimes Commission',
    url: 'https://www.efccnigeria.org/',
    content: `# Economic and Financial Crimes Commission - EFCC

## Anti-Money Laundering and Financial Crime Prevention

EFCC combats economic and financial crimes including fraud, corruption, and money laundering.

## Services
- Financial crime investigation
- Money laundering prevention
- Fraud complaint handling
- Asset recovery
- Public awareness programs

## Filing a Complaint
1. Report online at efccnigeria.org
2. Or visit EFCC office with details
3. Provide evidence and documentation
4. Investigation initiated
5. Regular updates on progress

## Prevention Services
- Know Your Customer (KYC) verification
- Transaction monitoring
- Compliance guidance for businesses
- Training on financial crime prevention

## Reporting Suspicious Activity
- Financial institutions required to report
- Individuals can also report suspicious transactions
- Anonymous reporting available
- Protected whistleblower status

## Asset Recovery
- Civil asset recovery
- Criminal asset forfeiture
- International cooperation
- Restitution to victims`
  },
  {
    source: 'NDLEA',
    title: 'National Drug Law Enforcement Agency',
    url: 'https://www.ndlea.gov.ng/',
    content: `# National Drug Law Enforcement Agency - NDLEA

## Drug Enforcement and Substance Abuse Prevention

NDLEA enforces drug laws and promotes substance abuse prevention in Nigeria.

## Services
- Drug enforcement operations
- Drug trafficking investigation
- Substance abuse rehabilitation
- Drug demand reduction programs
- Public education and awareness

## Rehabilitation Services
- Treatment centers across Nigeria
- Counseling and therapy services
- Aftercare and reintegration support
- Family support programs
- Outpatient services

## Accessing Rehabilitation
1. Contact nearest NDLEA facility
2. Assessment and intake process
3. Treatment plan development
4. Enrollment in program
5. Follow-up and aftercare

## Public Education
- School-based drug prevention
- Community awareness programs
- Workplace drug-free initiatives
- Rehabilitation success stories

## Reporting Drug Activities
- Call emergency hotline
- Report to nearest NDLEA office
- Anonymous reporting available
- Witness protection program

## Drug Classification
- Schedule 1: Highly controlled substances
- Schedule 2-4: Prescription and controlled drugs
- Penalties vary by classification`
  },
  {
    source: 'SMEDAN',
    title: 'Small and Medium Enterprises Development Agency',
    url: 'https://www.smedan.gov.ng/',
    content: `# Small and Medium Enterprises Development Agency - SMEDAN

## SME Support and Business Development

SMEDAN provides support, funding, and development services for small and medium enterprises.

## Services Offered
- Business registration and licensing
- Training and capacity building
- Access to finance and credit
- Market information and linkages
- Technology and innovation support
- Export promotion
- Workplace development

## Funding Programs
- SMEDAN Credit Guarantee Scheme
- Direct loans to qualified SMEs
- Microfinance linkages
- Venture capital connections
- Government supplier programs

## Training and Development
- Entrepreneurship training
- Business management skills
- Technical skills training
- Export readiness training
- ICT and digital skills

## How to Access Support
1. Register your business with SMEDAN
2. Identify needed support (training, funding, etc.)
3. Apply for specific program
4. Provide business plan and documents
5. Assessment and approval
6. Commence program

## Business Registration
- Online or physical registration
- Provide business details and identification
- NIN and CAC registration required
- Small registration fee

## Market Access
- Trade fair participation
- B2B networking events
- Supplier directories
- Export market information`
  },
  {
    source: 'UBEC',
    title: 'Universal Basic Education Commission - Education',
    url: 'https://ubec.gov.ng/',
    content: `# Universal Basic Education Commission - UBEC

## Primary and Secondary Education Administration

UBEC oversees universal basic education implementation across Nigeria.

## Education Levels Covered
- Primary education (6 years)
- Lower secondary education (3 years)
- Upper secondary education (3 years)

## Free Education Program
- Free and compulsory primary education
- Free lower secondary education
- Funded through state ministries

## School Enrollment
1. Identify nearest school in your locality
2. Visit school for registration
3. Provide birth certificate and vaccination records
4. Complete enrollment forms
5. Receive admission letter

## Educational Standards
- National curriculum framework
- Teacher training and development
- Infrastructure standards
- Assessment and examination
- Quality assurance programs

## Special Programs
- Girls education initiatives
- Out-of-school children programs
- Special needs education
- Adult literacy programs
- Vocational training integration

## Resources and Support
- Teaching and learning materials
- Infrastructure development
- Teacher welfare and training
- Student nutrition programs
- Scholarship opportunities

## Contact
- State UBEC offices
- Local government education authorities
- Individual school administration`
  },
  {
    source: 'Ministry of Works',
    title: 'Federal Ministry of Works - Infrastructure',
    url: 'https://www.works.gov.ng/',
    content: `# Federal Ministry of Works

## Road Infrastructure and Transportation

The Ministry oversees federal road networks and infrastructure development.

## Services
- Road maintenance and rehabilitation
- Bridge construction and maintenance
- Highway development
- Transportation planning
- Infrastructure projects

## Road Network Categories
- Federal trunk A roads (interstate highways)
- Federal trunk B roads (major routes)
- Rural access roads
- Border roads

## Reporting Road Issues
1. Identify specific road location
2. Document issue (potholes, damage, flooding)
3. Report to nearest ministry office
4. Provide photographs if possible
5. Track maintenance schedule

## Infrastructure Projects
- Highway expansions and improvements
- Bridge rehabilitation programs
- Culvert and drainage projects
- Rural road access programs
- Disaster recovery and reconstruction

## Public Participation
- Stakeholder engagement in projects
- Community feedback mechanisms
- Project information availability
- Complaint handling system

## Contact
- Federal Ministry offices in each state
- Regional highway offices
- Project site offices
- Toll gate management offices`
  },
  {
    source: 'Ministry of Power',
    title: 'Federal Ministry of Power - Electricity',
    url: 'https://power.gov.ng/',
    content: `# Federal Ministry of Power

## Electricity Generation, Transmission and Distribution

The Ministry oversees Nigeria's power sector including generation, transmission and distribution.

## Power Distribution Companies (DisCos)
- Abuja Electricity Distribution Company (AEDC)
- Benin Electricity Distribution Company (BEDC)
- Eko Electricity Distribution Company (EKEDC)
- Enugu Electricity Distribution Company (EEDC)
- Ibadan Electricity Distribution Company (IBEDC)
- Ikeja Electricity Distribution Company (IKEDC)
- Jos Electricity Distribution Company (JEDC)
- Kaduna Electricity Distribution Company (KAEDCO)
- Kano Electricity Distribution Company (KANO DISCOS)
- Port Harcourt Electricity Distribution Company (PHEDC)

## Electricity Connection
1. Contact your DisCo customer service center
2. Complete connection application
3. Provide property details and identification
4. Pay application and processing fees
5. Meter installation and testing
6. Commence billing

## Billing and Payments
- Monthly electricity bills issued
- Multiple payment channels (online, bank, agents)
- Prepaid and postpaid metering options
- Meter reading and disputes resolution

## Disconnection and Reconnection
- Disconnection for non-payment after notice
- Reconnection application and processing
- Appeal and dispute procedures

## Consumer Protection
- Metering accuracy checks
- Complaint handling mechanisms
- Consumer protection offices
- Tariff information and transparency`
  },
  {
    source: 'BoI',
    title: 'Bank of Industry - Development Finance',
    url: 'https://www.boigroup.com/',
    content: `# Bank of Industry - BoI

## Industrial Development and Business Financing

Bank of Industry provides development financing and support services for businesses.

## Financing Products
- Working capital financing
- Term loans for expansion
- Equipment financing
- Trade finance
- Project finance

## Business Support Services
- Technical assistance
- Business advisory services
- Training and capacity building
- Market intelligence
- Mentorship programs

## Loan Application Process
1. Prepare business plan and financial statements
2. Gather required documentation
3. Submit application to nearest BoI office
4. Business assessment and appraisal
5. Credit committee review
6. Approval and disbursement
7. Loan monitoring and repayment

## Eligibility Requirements
- Registered business (CAC registration)
- Valid business license
- Bank account and financial records
- Business plan with projections
- Personal identification of owners

## Sectors Supported
- Manufacturing
- Agriculture
- Technology
- Energy
- Construction
- Service industries
- Tourism

## Contact and Offices
- Head office in Lagos
- Regional offices in major cities
- Business development centers
- Online portal: www.boigroup.com`
  },
  {
    source: 'FG-Customs',
    title: 'Nigeria Customs Service - Import/Export',
    url: 'https://www.customs.gov.ng/',
    content: `# Nigeria Customs Service

## Import/Export and Border Control

Nigeria Customs Service manages import/export operations and border control.

## Services
- Import and export clearance
- Customs duty and tax collection
- Border patrol and security
- Anti-smuggling operations
- Export promotion

## Import Process
1. Obtain shipping documents from supplier
2. File import declaration and bill of lading
3. Declare goods at nearest customs office
4. Pay import duties and taxes
5. Goods inspection if selected
6. Receive customs release permit
7. Collect goods

## Export Process
1. Prepare goods and export documents
2. File export declaration
3. Goods inspection (depending on product)
4. Payment of export taxes if applicable
5. Receive export permit
6. Ship goods

## Duty Calculation
- Based on product classification (HS code)
- CIF value (Cost, Insurance, Freight)
- Applicable tariff rates
- Exemptions and waivers (if applicable)

## Required Documents
- Bill of lading (ocean shipment)
- Airway bill (air shipment)
- Commercial invoice
- Packing list
- Certificate of origin
- Product-specific certificates

## Contact
- Nearest customs office
- Port customs authority
- Customs broker registration
- Emergency hotline`
  },
  {
    source: 'Federal Civil Service',
    title: 'Federal Civil Service - Government Employment',
    url: 'https://www.firs.gov.ng/',
    content: `# Federal Civil Service Commission - FCSC

## Government Employment and Civil Service Recruitment

Federal Civil Service Commission manages recruitment and employment in federal government.

## Civil Service Grades
- GL 1-6: Clerical and support staff
- GL 7-8: Junior professional staff
- GL 9-12: Professional and management staff
- GL 13-14: Senior management
- GL 15-17: Executive positions

## Recruitment Process
1. Vacancy announcement on FCSC website
2. Online application with required documents
3. Written examination (where applicable)
4. Interview for qualified candidates
5. Medical examination
6. Security clearance verification
7. Appointment letter and onboarding

## Required Qualifications
- Educational requirements (by position)
- Valid identification (NIN, passport)
- Character certification
- Health fitness
- Citizenship of Nigeria

## Employment Benefits
- Salary and allowances
- Pension benefits
- Medical facilities
- Leave entitlements
- Professional development

## Posting and Deployment
- Initial posting to federal ministry
- Rotation to different departments
- Promotion based on performance
- Transfer requests and processing

## Contact
- FCSC head office (Abuja)
- State civil service commissions
- Individual ministry HR departments
- Online job portal`
  },
  {
    source: 'FG-Health',
    title: 'Federal Ministry of Health - Healthcare Infrastructure',
    url: 'https://www.health.gov.ng/',
    content: `# Federal Ministry of Health and Social Welfare

## Healthcare Policy and Infrastructure

The Ministry develops healthcare policies and manages federal health facilities.

## Federal Health Facilities
- Teaching hospitals (6 major centers)
- Federal medical centers
- Federal psychiatric hospitals
- Specialized treatment centers
- Primary health care centers

## Healthcare Services
- Outpatient consultation
- Inpatient admission
- Emergency care
- Specialized treatments
- Surgical procedures
- Reproductive health services
- Child health services

## Immunization Programs
- Childhood routine immunization
- Maternal tetanus immunization
- Disease-specific campaigns
- Adult immunization services

## National Health Insurance Scheme (NHIS)
- Partner with NHIS for coverage
- Registration and enrollment
- Benefit utilization
- Claim processing

## Maternal and Child Health
- Antenatal care services
- Delivery services
- Postnatal care
- Family planning services
- Child growth monitoring

## Disease Prevention
- Disease surveillance systems
- Outbreak response
- Health education programs
- Preventive services

## Accessing Federal Facilities
1. Self-referral for outpatient services
2. GP referral for specialist care
3. Emergency admission procedures
4. Bring identification and NHIS card
5. Pay consultation fees (if uninsured)`
  },
  {
    source: 'Federal-Agriculture',
    title: 'Federal Ministry of Agriculture - Agribusiness Support',
    url: 'https://www.fmard.gov.ng/',
    content: `# Federal Ministry of Agriculture and Rural Development

## Agricultural Support and Agribusiness Development

The Ministry supports agricultural development and rural economic growth.

## Services
- Agricultural extension services
- Farmer registration and support
- Credit access for agriculture
- Input supply (seeds, fertilizer)
- Market linkages
- Training and capacity building
- Technology transfer

## Agricultural Support Programs
- Presidential Fertilizer Initiative (PFI)
- Anchor Borrowers Program
- Rice Value Chain
- Cassava Value Chain
- Fisheries development

## Farmer Registration
1. Visit nearest agricultural extension office
2. Provide identification and farm details
3. Register farm location and size
4. Provide crops grown
5. Receive farmer registration card
6. Access services and programs

## Input Subsidies
- Fertilizer subsidy access
- Improved seed distribution
- Agricultural tool support
- Livestock support programs

## Training Services
- Crop production training
- Livestock rearing courses
- Agritech and mechanization
- Food processing
- Agribusiness management

## Credit Programs
- Loans for farm expansion
- Working capital financing
- Equipment financing
- Commodity marketing support

## Contact
- State Agricultural Development Programs
- Agricultural extension offices
- Farmer cooperative associations
- Ministry regional offices`
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
  },
  {
    state: 'Enugu',
    source: 'ENIRS',
    title: 'Enugu State Internal Revenue Service',
    url: 'https://www.enuguirs.ng/',
    content: `# Enugu State Internal Revenue Service

## State Tax Administration and Revenue

ENIRS manages taxation and generates revenue for state government development programs.

## Tax Services
- Personal income tax
- Business profit tax
- Property tax
- Vehicle and motor tax
- License and permit fees

## Registration and Compliance
1. Register business with CAC
2. Complete ENIRS registration
3. Obtain tax ID number
4. Begin tax filing and payment

## Filing Requirements
- Annual returns for all taxpayers
- Quarterly payments for corporations
- Monthly installments for high earners
- Records maintenance and availability

## Payment Options
- Online portal payment
- Bank transfers
- ENIRS office payment
- Mobile money services`
  },
  {
    state: 'Abia',
    source: 'ABIRS',
    title: 'Abia State Internal Revenue Service',
    url: 'https://www.abiairb.com/',
    content: `# Abia State Internal Revenue Service

## Revenue Generation and Tax Collection

ABIRS collects taxes to support development in Abia State.

## Services
- Business registration and taxation
- Personal income tax
- Property tax assessment
- License and permit services
- Tax clearance issuance

## Registration Process
1. Obtain business registration
2. Visit ABIRS office or portal
3. Complete registration form
4. Provide identification documents
5. Get tax ID and commence operations

## Tax Compliance
- Regular tax filing required
- Payment through designated channels
- Tax clearance for government contracts
- Support for business compliance

## Office Locations
- State headquarters
- Local government area offices
- Online portal for registration`
  },
  {
    state: 'Cross River',
    source: 'CRIRS',
    title: 'Cross River State Internal Revenue Board',
    url: 'https://www.crossriverirs.ng/',
    content: `# Cross River State Internal Revenue Board

## Tax and Revenue Administration

CRIRS manages state revenue collection and fiscal operations.

## Revenue Services
- Business and corporate taxation
- Personal income tax
- Property tax collection
- Vehicle registration tax
- Business licensing

## How to Register
1. Complete business registration with CAC
2. Report to CRIRS office
3. Provide business details
4. Receive state tax number
5. Start tax compliance

## Compliance and Payment
- Annual tax filing mandatory
- Quarterly payments for businesses
- Tax clearance for contracts
- Penalty for non-compliance

## Support Services
- Tax information and guidance
- Clearance verification
- Records update services`
  },
  {
    state: 'Delta',
    source: 'DIRS',
    title: 'Delta State Internal Revenue Service',
    url: 'https://www.deltairs.gov.ng/',
    content: `# Delta State Internal Revenue Service

## Tax Collection and Revenue Management

DIRS ensures effective taxation and revenue generation for Delta State.

## Tax Types
- Corporate income tax
- Personal income tax
- Capital gains tax
- Property tax
- Business permits and licenses

## Registration and Filing
1. CAC business registration required
2. DIRS registration completion
3. Obtain tax ID
4. File tax returns as scheduled
5. Make tax payments

## Payment Methods
- Online payment portal
- Bank transfers
- Cash payment at offices
- Mobile money options

## Available Services
- Tax consultation
- Return preparation assistance
- Clearance issuance
- Record maintenance`
  },
  {
    state: 'Imo',
    source: 'IMIRS',
    title: 'Imo State Internal Revenue Service',
    url: 'https://www.imorevenue.gov.ng/',
    content: `# Imo State Internal Revenue Service

## State Revenue and Tax Administration

IMIRS administers taxation for Imo State development and service delivery.

## Revenue Sources
- Business income tax
- Personal income tax
- Property tax
- Motor vehicle tax
- Business registration fees

## Getting Started
1. Register business with CAC
2. Visit IMIRS office or website
3. Complete registration form
4. Submit required documents
5. Receive state tax ID

## Tax Filing Schedule
- Annual returns required
- Quarterly payments for corporations
- Monthly for high-income earners
- Regular updates for changes

## Services and Support
- Online filing system
- Tax payment portal
- Clearance certificates
- Business registration support`
  },
  {
    state: 'Osun',
    source: 'OSIRS',
    title: 'Osun State Internal Revenue Board',
    url: 'https://www.osunirsb.gov.ng/',
    content: `# Osun State Internal Revenue Board

## Taxation and Revenue Services

OSIRS manages state taxation and fiscal revenue collection.

## Tax Services Offered
- Personal income tax
- Business taxation
- Property and land tax
- Cooperative society tax
- License and permit fees

## Registration Steps
1. Complete CAC registration
2. Go to OSIRS office or portal
3. Provide required information
4. Pay registration fee
5. Obtain state tax ID

## Compliance Requirements
- File annual tax return
- Pay taxes on schedule
- Maintain business records
- Report income accurately

## Available Support
- Tax information services
- Online filing and payment
- Clearance processing
- Taxpayer education programs`
  }
]
