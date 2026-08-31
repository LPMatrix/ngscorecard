import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'

export const presidents = sqliteTable('presidents', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  key:       text('key').notNull().unique(),
  name:      text('name').notNull(),
  fullName:  text('full_name').notNull(),
  termStart: text('term_start').notNull(),
  termEnd:   text('term_end'),
  // Nullable: a real, verified slogan/agenda name, never a guessed one. Left
  // blank for scaffolded former-governor profiles until one's confirmed.
  tagline:   text('tagline'),
  party:     text('party'),
  reviewed:  text('reviewed').notNull(),
  // 'federal' (president) or 'state' (governor). state holds e.g. 'Oyo' for governors.
  level:     text('level').notNull().default('federal'),
  state:     text('state'),
  // State governors only: is this the sitting governor? Federal presidents are
  // all shown regardless (the Federal tab is an intentional full history), but
  // the State tab shows one governor per state, so former governors need this
  // to stay out of it while still being reachable from the current governor's
  // profile. Defaults true so existing rows (and every federal president)
  // don't need a backfill.
  isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(true),
})

export const promises = sqliteTable('promises', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  title:          text('title').notNull(),
  category:       text('category').notNull(),
  status:         text('status').notNull(),
  promise:        text('promise').notNull(),
  assessment:     text('assessment').notNull(),
  source:         text('source').notNull(),
  sourceLabel:    text('source_label').notNull(),
  updated:        text('updated').notNull(),
  // Optional editorial banner on the card: 'disputed' | 'correction' | 'review'
  // | null. Nullable and unseeded — ships dormant; the frontend renders nothing
  // until a promise's JSON sets it. See PromiseCard.vue FLAG_META.
  flag:           text('flag'),
  // Optional "See also" links: a JSON array of other promise ids in the same
  // administration (e.g. [2, 7]). Also dormant until seed data uses it.
  related:        text('related', { mode: 'json' }),
})

export const inherited = sqliteTable('inherited', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  title:          text('title').notNull(),
  category:       text('category').notNull(),
  status:         text('status').notNull(),
  problem:        text('problem').notNull(),
  resolution:     text('resolution').notNull(),
  source:         text('source').notNull(),
  sourceLabel:    text('source_label').notNull(),
  updated:        text('updated').notNull(),
})

export const fraud = sqliteTable('fraud', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  title:          text('title').notNull(),
  category:       text('category').notNull(),
  status:         text('status').notNull(),
  amount:         text('amount'),
  year:           integer('year'),
  allegation:     text('allegation').notNull(),
  outcome:        text('outcome').notNull(),
  responseVerdict: text('response_verdict'),
  govtResponse:   text('govt_response'),
  source:         text('source').notNull(),
  sourceLabel:    text('source_label').notNull(),
  updated:        text('updated').notNull(),
})

export const orders = sqliteTable('orders', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  title:          text('title').notNull(),
  category:       text('category').notNull(),
  status:         text('status').notNull(),
  signed:         text('signed'),
  directive:      text('directive').notNull(),
  effect:         text('effect').notNull(),
  source:         text('source').notNull(),
  sourceLabel:    text('source_label').notNull(),
  updated:        text('updated').notNull(),
})

export const ministers = sqliteTable('ministers', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  name:           text('name').notNull(),
  ministry:       text('ministry').notNull(),
  appointed:      text('appointed'),
  status:         text('status').notNull(),
  serving:        integer('serving', { mode: 'boolean' }),
  mandate:        text('mandate').notNull(),
  performance:    text('performance').notNull(),
  source:         text('source'),
  sourceLabel:    text('source_label'),
  updated:        text('updated'),
})

export const bills = sqliteTable('bills', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  title:          text('title').notNull(),
  category:       text('category').notNull(),
  status:         text('status').notNull(),
  chamber:        text('chamber'),
  introduced:     text('introduced'),
  signed:         text('signed'),
  summary:        text('summary').notNull(),
  outcome:        text('outcome').notNull(),
  source:         text('source').notNull(),
  sourceLabel:    text('source_label').notNull(),
  updated:        text('updated').notNull(),
})

export const appointments = sqliteTable('appointments', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  name:           text('name').notNull(),
  role:           text('role').notNull(),
  agency:         text('agency').notNull(),
  category:       text('category').notNull(),
  state:          text('state').notNull(),
  geopolitical:   text('geopolitical').notNull(),
  appointed:      text('appointed').notNull(),
  status:         text('status').notNull(),
  note:           text('note').notNull(),
})

export const judgments = sqliteTable('judgments', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  title:          text('title').notNull(),
  court:          text('court').notNull(),
  category:       text('category').notNull(),
  status:         text('status').notNull(),
  compliance:     text('compliance'),
  ruled:          text('ruled').notNull(),
  issue:          text('issue').notNull(),
  outcome:        text('outcome').notNull(),
  source:         text('source'),
  sourceLabel:    text('source_label'),
})

export const history = sqliteTable('history', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  label:          text('label').notNull(),
  kept:           integer('kept').notNull(),
  partial:        integer('partial').notNull(),
  broken:         integer('broken').notNull(),
  pending:        integer('pending').notNull(),
})

export const budget = sqliteTable('budget', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  administration:    text('administration').notNull(),
  year:              integer('year').notNull(),
  totalBn:           real('total_bn').notNull(),
  revenueBn:         real('revenue_bn'),
  actualRevenueBn:   real('actual_revenue_bn'),
  debtServiceBn:     real('debt_service_bn'),
  capitalBn:         real('capital_bn'),
  recurrentBn:       real('recurrent_bn'),
  implementationPct: real('implementation_pct'),
  deficitBn:         real('deficit_bn'),
  note:              text('note'),
  source:            text('source').notNull(),
  sourceLabel:       text('source_label').notNull(),
})

export const budgetMinistries = sqliteTable('budget_ministries', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  budgetYear:     integer('budget_year').notNull(),
  administration: text('administration').notNull(),
  name:           text('name').notNull(),
  allocationBn:   real('allocation_bn').notNull(),
  releasedPct:    real('released_pct'),
  note:           text('note'),
})

export const indicators = sqliteTable('indicators', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  key:            text('key').notNull(),
  label:          text('label').notNull(),
  unit:           text('unit').notNull(),
  color:          text('color').notNull(),
  description:    text('description').notNull(),
  source:         text('source').notNull(),
  sourceLabel:    text('source_label').notNull(),
  note:           text('note'),
  // Whether a rising value is good news (e.g. GDP growth, IGR) rather than
  // bad (e.g. inflation, debt, unemployment) — determines change-arrow color.
  higherIsBetter: integer('higher_is_better', { mode: 'boolean' }),
})

export const indicatorPoints = sqliteTable('indicator_points', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  indicatorId:    integer('indicator_id').notNull(),
  administration: text('administration').notNull(),
  label:          text('label').notNull(),
  value:          real('value').notNull(),
})

export const apiKeys = sqliteTable('api_keys', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  key:          text('key').notNull().unique(),
  email:        text('email').notNull(),
  tier:         text('tier').notNull().default('free'),
  createdAt:    text('created_at').notNull(),
  lastUsedAt:   text('last_used_at'),
  requestCount: integer('request_count').notNull().default(0),
  revoked:      integer('revoked', { mode: 'boolean' }).notNull().default(false),
})

export const governors = sqliteTable('governors', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  administration: text('administration').notNull(),
  name:           text('name').notNull(),
  state:          text('state').notNull(),
  party:          text('party').notNull(),
  geopolitical:   text('geopolitical').notNull(),
  termStart:      text('term_start').notNull(),
  termEnd:        text('term_end'),
  status:         text('status').notNull(),
  note:           text('note'),
})
