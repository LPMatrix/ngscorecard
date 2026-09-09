// Category normalisation.
//
// The `category` field on promises / fraud / orders / etc. is free text and
// has drifted into ~70 near-duplicate values ("Election" vs "Elections",
// "Fiscal" vs "Finance" vs "Public finance", "Transport" vs "Transportation").
// Translating 70 strings — and their casing variants — is wasteful, so i18n
// keys off a canonical slug instead: t('category.' + canonicalizeCategory(raw)).
//
// This does NOT rewrite the stored data. A later, separate task can normalise
// the DB to the canonical labels; until then this map absorbs the variants.

// slug → canonical English label (the en.json category.* values mirror these)
export const CATEGORY_LABELS = {
  governance:      'Governance',
  economy:         'Economy',
  security:        'Security',
  infrastructure:  'Infrastructure',
  'public-funds':  'Public Funds',
  fiscal:          'Fiscal & Budget',
  education:        'Education',
  elections:        'Elections',
  development:      'Development',
  health:           'Health',
  energy:           'Energy',
  agriculture:      'Agriculture',
  social:           'Social',
  'civil-rights':   'Civil Rights',
  judiciary:        'Judiciary & Rule of Law',
  labour:           'Labour',
  transport:        'Transport',
  'foreign-policy': 'Foreign Policy',
  transparency:     'Transparency',
  environment:      'Environment & Land',
  technology:       'Technology',
  legislature:      'Legislature',
  other:            'Other',
}

// lowercased raw value → slug
const ALIAS = {
  'governance': 'governance', 'executive': 'governance', 'presidency': 'governance',
  'political': 'governance', 'state government': 'governance', 'urban governance': 'governance',
  'urban planning': 'governance', 'planning': 'governance', 'constitutional': 'governance',
  'chieftaincy': 'governance', 'reconstruction': 'governance', 'parastatals': 'governance',

  'economy': 'economy', 'investment': 'economy', 'jobs': 'economy',

  'security': 'security', 'defence': 'security', 'public order': 'security',
  'security spending': 'security', 'criminal': 'security',

  'infrastructure': 'infrastructure', 'housing': 'infrastructure',
  'housing and urban rights': 'infrastructure', 'land & housing': 'infrastructure',

  'public funds': 'public-funds', 'contracts': 'public-funds', 'procurement': 'public-funds',

  'fiscal': 'fiscal', 'finance': 'fiscal', 'public finance': 'fiscal',
  'revenue': 'fiscal', 'budget': 'fiscal',

  'education': 'education', 'human capital': 'education',

  'election': 'elections', 'elections': 'elections', 'election integrity': 'elections',

  'development': 'development',

  'health': 'health', 'public health': 'health',

  'energy': 'energy', 'oil & gas': 'energy', 'solid minerals': 'energy',

  'agriculture': 'agriculture', 'food systems': 'agriculture',

  'social': 'social', 'social welfare': 'social', 'welfare': 'social',
  'youth': 'social', 'humanitarian': 'social',

  'civil rights': 'civil-rights', 'human rights': 'civil-rights',

  'judiciary': 'judiciary', 'justice': 'judiciary', 'rule of law': 'judiciary',

  'labour': 'labour',

  'transport': 'transport', 'transportation': 'transport', 'transport regulation': 'transport',

  'foreign policy': 'foreign-policy', 'diplomacy': 'foreign-policy',

  'transparency': 'transparency', 'disclosure': 'transparency', 'anti-corruption': 'transparency',

  'environment': 'environment', 'land': 'environment', 'land & environment': 'environment',

  'technology': 'technology',

  'legislature': 'legislature',
}

// raw category string → canonical slug (always resolves; unknown → 'other')
export function canonicalizeCategory(raw) {
  if (!raw) return 'other'
  return ALIAS[String(raw).trim().toLowerCase()] || 'other'
}
