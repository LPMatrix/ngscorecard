// Shared between SupportView.vue and scripts/setup-paystack-plan.mjs so the
// monthly amount can never drift between what the button says and what the
// Paystack Plan actually charges.
export const ONE_TIME_AMOUNTS = [5000, 15000, 50000]
export const MONTHLY_AMOUNT = 2500
export const MIN_AMOUNT_NAIRA = 100
export const MONTHLY_PLAN_NAME = 'NGScorecard Monthly Support'
