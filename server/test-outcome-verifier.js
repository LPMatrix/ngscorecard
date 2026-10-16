/**
 * Test script for Outcome Verifier core logic
 * Usage: node server/test-outcome-verifier.js
 *
 * Tests the verification engine without API/web dependencies.
 * Requires a promise with ID 1 in your database.
 */

import { verifyPromiseOutcome } from './outcomeVerifier.js'

// Sample article text (simulating what would come from a news article)
const sampleArticle = `
TINUBU ADMINISTRATION DELIVERS ON POWER PROMISE

The Tinubu administration has delivered on its promise to increase power generation capacity,
with the Kano Independent Power Project reaching 80% completion and expected to add 500 MW
to the national grid by Q1 2026, according to the Ministry of Power.

The project, which was promised during the 2023 campaign as part of Tinubu's commitment to
solve Nigeria's energy crisis, is progressing ahead of schedule. Work began in January 2024,
and workers have completed the concrete foundations, electrical installations, and 40% of the
control systems.

"We allocated ₦150 billion to this project, and we're on track to spend the full amount
by completion," said the Minister of Power in a statement on October 15, 2024.

However, the project has faced some delays due to supply chain issues. The original target
completion date was Q4 2025, but officials now estimate Q1 2026. Construction of the plant's
cooling systems was delayed by 3 months due to equipment shortages from India.

The administration also promises to complete two additional plants (Lagos and Oyo) by 2026,
as part of the broader ₦500 billion power generation initiative announced in 2023.
`

async function test() {
  console.log('🧪 Testing Outcome Verifier...\n')

  // Test promise IDs (you'll need to replace with actual IDs from your database)
  // For now, we'll just run a test that shows the structure

  const promiseId = 1 // Replace with an actual promise ID from your database

  console.log(`📰 Article to verify:`)
  console.log(`${sampleArticle.slice(0, 200)}...\n`)

  try {
    console.log(`⏳ Running verification on promise ID ${promiseId}...\n`)

    const result = await verifyPromiseOutcome(promiseId, sampleArticle)

    console.log('✅ Verification Complete:\n')
    console.log(`Promise: ${result.promise.title}`)
    console.log(`Current Status: ${result.promise.current_status}`)
    console.log(`\n📊 Results:`)
    console.log(`  Confidence: ${result.confidence}`)
    console.log(`  Suggested Status: ${result.suggested_status}`)
    console.log(`\n📝 Reasoning:`)
    console.log(`  ${result.reasoning}`)

    if (result.claims && result.claims.length > 0) {
      console.log(`\n💭 Claims extracted:`)
      result.claims.forEach((claim, i) => {
        console.log(`  ${i + 1}. ${claim}`)
      })
    }

    if (result.evidence_quotes && result.evidence_quotes.length > 0) {
      console.log(`\n💬 Evidence quotes:`)
      result.evidence_quotes.forEach((quote, i) => {
        console.log(`  ${i + 1}. "${quote.slice(0, 100)}..."`)
      })
    }

    console.log(`\n✨ Next step: Editor approves this status update to update the promise`)

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`)
    console.error('\nMake sure:')
    console.error('1. ANTHROPIC_API_KEY is set in .env')
    console.error('2. The promise ID exists in your database')
    console.error('3. The database connection is working')
  }
}

// Run the test
test()
