# Outcome Verifier — Web Form Setup

The Outcome Verifier is an AI-powered fact-checker that extracts evidence from news articles and suggests promise status updates.

## How It Works

1. Editor opens the Outcome Verifier form on NGScorecard
2. Enters a promise ID and article text/URL
3. Form sends request to Claude API
4. Claude extracts claims, rates confidence, suggests status update
5. Editor reviews and clicks "Approve & Save"
6. Promise status updates in the database with audit log

## Setup

### 1. Environment Variables

Add to your `.env`:

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 2. Add Component to Your App

Import the OutcomeVerifier component in your Vue app:

```vue
<script setup>
import OutcomeVerifier from '@/components/OutcomeVerifier.vue'
</script>

<template>
  <OutcomeVerifier />
</template>
```

Or add it as a route/page:

```javascript
// In your router
{
  path: '/verify-promise',
  component: () => import('@/components/OutcomeVerifier.vue'),
  name: 'VerifyPromise'
}
```

### 3. API Endpoints

The component calls two REST endpoints:

**POST /api/outcome/verify**
- Request: `{ promiseId, articleText }` or `{ promiseId, articleUrl }`
- Response: `{ confidence, suggested_status, reasoning, claims, evidence_quotes, promise }`

**POST /api/outcome/approve**
- Request: `{ promiseId, newStatus, sourceUrl, note }`
- Response: `{ success, promise_id, old_status, new_status }`

These are already wired in `server/outcomeRoutes.js` and mounted in `server/apiApp.js`.

### 4. Deploy

Push your changes and navigate to the form in your app.

## How Editors Use It

### Example Flow

1. Editor is reading a news article about a promise
2. Opens the Outcome Verifier form
3. Enters promise ID (e.g., `142`) and pastes article text (or provides URL)
4. Form displays:
   - Evidence extracted from the article
   - Confidence level (high/medium/low)
   - Suggested status update (kept/partial/broken/in_progress)
   - Evidence quotes
   - Extracted claims
5. Editor reviews and clicks "Approve & Save"
6. Optional: adds source URL and notes
7. Promise status updates automatically
8. Change is logged to entry_history table

### What Evidence It Looks For

- Budget amounts ("allocated ₦5bn")
- Completion percentages ("80% complete")
- Deliverables ("2,000 hospital beds installed")
- Deadline status ("on schedule" / "delayed")
- Official statements about outcomes

## Customization

### Change the Fact-Check Prompt

Edit `server/outcomeVerifier.js`, the `systemPrompt` variable:

```javascript
const systemPrompt = `You are a fact-checker...`
```

### Add Custom Confidence Rules

Modify the `verifyPromiseOutcome` function to add context-specific rules.

### Change Suggested Status Categories

Edit the status options in the verification prompt (currently: kept/partial/broken/in_progress).

### Customize the Form UI

Edit `app/components/OutcomeVerifier.vue` to change styling, labels, or form layout.

## Troubleshooting

### Claude API errors
- Verify `ANTHROPIC_API_KEY` is set and valid
- Check your API key has budget
- Look for rate limiting (wait 60 seconds and retry)

### Promise not found
- Double-check the promise ID is correct
- Make sure the promise exists in the database for this administration

### Form not displaying
- Ensure the component is imported and mounted correctly
- Check browser console for errors
- Verify the API endpoints are accessible

## Future Improvements

1. **Batch processing** — Monitor news feeds for all promises daily
2. **High-confidence auto-update** — Skip approval for very confident results
3. **Source tracking** — Store original article URL with the status update
4. **Outcome history** — Show previous status updates on promise card
5. **Evidence attribution** — Link proof quotes directly to source
6. **Contradiction detection** — Flag when multiple articles claim conflicting outcomes
