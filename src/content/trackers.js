// Content for /nigeria-promise-trackers-compared. Plain data, English only.
//
// Every statement about another project comes from that project's own public
// site, read on CHECKED_ON. Where a site did not say something we write "Not
// stated" rather than guess, and TRACKERS[...].caveat says when a site could
// not be read in full. Re-check each entry before changing the date.
//
// Figures about NGScorecard are rounded down ("more than") so they stay true as
// the dataset grows; re-count them from the database when this page is updated.

export const CHECKED_ON = '9 October 2026'

export const US = {
  id: 'ngscorecard',
  name: 'NGScorecard',
  url: '/',
  cells: {
    runBy: 'An independent project, being set up as a not-for-profit. It takes no money from political parties, candidates, office holders or the agencies it tracks.',
    covers: '217 administrations: every federal government since 1960 and elected state governors back to 1979, including all 36 sitting governors.',
    records: 'Promises and manifestos, ministers and appointments, executive orders, fraud cases and court judgments, budgets, capital projects, indicators, inherited problems and legislation.',
    rating: 'Kept, partial or mixed, broken, in progress, or not yet assessed, under a published methodology with a version number and change log.',
    evidence: 'Every promise links to its source. Capital projects, and a growing share of other entries, are also labelled by source type: official record, independent reporting, expert analysis or weak source.',
    corrections: 'Every change to a rated entry is logged publicly on the entry itself (more than 300 so far), and every card has a "Report an issue" button.',
    data: 'Free API with an instant key, an embeddable widget, and a full dataset download, all under CC BY 4.0.',
  },
}

export const TRACKERS = [
  {
    id: 'promise-tracker',
    name: 'Promise Tracker',
    byline: 'AdvoKC',
    url: 'https://www.promisetracker.ng/',
    cells: {
      runBy: 'AdvoKC, a youth-led civic tech organisation based in Lagos.',
      covers: 'Presidents and state governors, plus Senate and House of Representatives agenda trackers.',
      records: 'The most important promises of each office holder, each with dated progress updates.',
      rating: 'Kept, broken, compromised, stalled, in the works or not yet rated. Reporters research each promise before rating it.',
      evidence: 'Dated updates on each promise.',
      corrections: 'Readers can submit a promise and follow a tracker by email.',
      data: 'No public API or data download found on the site.',
    },
  },
  {
    id: 'track-my-leader',
    name: 'Track My Leader',
    byline: 'Stellar Patterns Development Centre',
    url: 'https://trackmyleader.org/',
    caveat: 'The site did not load fully when we checked, so this column is taken from its own published description.',
    cells: {
      runBy: 'Stellar Patterns Development Centre, a non-profit.',
      covers: 'More than 183 profiles of presidents, governors, ministers, senators and lawmakers.',
      records: 'Tenures, loans, audits and promises.',
      rating: 'Not stated in its public description.',
      evidence: 'States that every record is linked to a credible source.',
      corrections: 'Not stated.',
      data: 'Not stated.',
    },
  },
  {
    id: 'ournigeria',
    name: 'OurNigeria',
    byline: 'A coalition of data scientists, journalists and citizens',
    url: 'https://ournigeria.ng/',
    cells: {
      runBy: 'A coalition of data scientists, journalists and citizens. It describes itself as open source.',
      covers: 'Governors, senators, House and state assembly members, LGA chairpersons and ward councillors across 36 states, 774 LGAs and 8,809 wards.',
      records: 'FAAC allocations (2019 to 2024), state budgets, tracked projects and election results.',
      rating: 'Not its focus. It reports spending, allocations and projects rather than rating promises.',
      evidence: 'Names the official bodies it draws on, including the Budget Office, the Accountant-General, the Debt Management Office, INEC, BPP, CAC, EFCC and ICPC.',
      corrections: 'Not stated.',
      data: 'Free CSV downloads. No API mentioned.',
    },
  },
  {
    id: 'pledge-tracker',
    name: 'Pledge Tracker',
    byline: 'Tinubumeter',
    url: 'https://pledgetracker.co/',
    cells: {
      runBy: 'Townhall Media, with the African Development Documentation Initiative.',
      covers: 'One president: Bola Tinubu, with 250 campaign promises.',
      records: 'Campaign promises.',
      rating: 'Promise kept, compromise, not done, stalled, in the works or not yet rated.',
      evidence: 'No per-promise sources shown on its main page.',
      corrections: 'Not stated.',
      data: 'No API or download mentioned on its main page.',
    },
  },
]

// Row order and labels for the comparison table.
export const ROWS = [
  { key: 'runBy', label: 'Run by' },
  { key: 'covers', label: 'Who it covers' },
  { key: 'records', label: 'What it records' },
  { key: 'rating', label: 'How promises are rated' },
  { key: 'evidence', label: 'Evidence shown' },
  { key: 'corrections', label: 'Corrections and reader input' },
  { key: 'data', label: 'Data access' },
]

// "Which one should I use?" — deliberately sends people elsewhere when
// another project fits the need better.
export const PICKS = [
  { need: 'Follow the most important promises of a sitting governor, with reporter-written updates and email alerts.', pick: 'Promise Tracker', id: 'promise-tracker' },
  { need: 'Read profiles of individual lawmakers, including loans and audits.', pick: 'Track My Leader', id: 'track-my-leader' },
  { need: 'See what your local government area or ward received from FAAC, and how budgets were spent locally.', pick: 'OurNigeria', id: 'ournigeria' },
  { need: 'Go through all 250 of Tinubu\'s campaign pledges.', pick: 'Pledge Tracker', id: 'pledge-tracker' },
  { need: 'Compare administrations across decades, with promises, fraud cases, court judgments, budgets and capital projects side by side, and reuse the data.', pick: 'NGScorecard', id: 'ngscorecard' },
]

// Where NGScorecard is different. Each point is checkable on the site.
export const DIFFERENCES = [
  {
    title: 'Decades, not one term',
    body: 'Covers 217 administrations, back to 1960 for federal governments and 1979 for elected governors. The same pledge, such as fixing power supply, can be followed across administrations on the recurring commitments pages.',
    link: { href: '/themes', label: 'See recurring commitments' },
  },
  {
    title: 'What was promised, and what followed',
    body: 'Promises sit beside the records that show what happened: more than 1,300 tracked promises, alongside fraud cases, executive orders, court judgments, budgets and more than 360 named capital projects.',
    link: { href: '/tinubu/projects', label: 'See capital projects for one administration' },
  },
  {
    title: 'Evidence you can judge',
    body: 'Every promise links to a source, and capital projects are labelled by the kind of source behind them, so a reader can tell an official record from a single news report.',
    link: { href: '/guide#independence', label: 'Read how sourcing works' },
  },
  {
    title: 'Mistakes are corrected in public',
    body: 'When an entry changes, the change is logged on the entry itself, with the reason. Readers can report an error from any card.',
    link: { href: '/guide', label: 'Read the methodology and change log' },
  },
  {
    title: 'Built to be reused',
    body: 'A free API, an embeddable widget and a downloadable dataset, all under CC BY 4.0, so newsrooms, researchers and other tools can build on the data.',
    link: { href: '/developers', label: 'See the API and widget' },
  },
  {
    title: 'Independent funding',
    body: 'It takes no money from political parties, candidates, office holders or the agencies it tracks, and publishes that policy.',
    link: { href: '/support', label: 'Read the funding policy' },
  },
]

// The honest counterpart: what the others do that NGScorecard does not.
export const THEY_DO = [
  { who: 'Promise Tracker', text: 'Reporter-written progress updates on each promise, email alerts for each tracker, and trackers for the Senate and the House of Representatives.' },
  { who: 'Pledge Tracker', text: 'A longer list of Tinubu\'s pledges: 250, where NGScorecard tracks more than 110.' },
  { who: 'OurNigeria', text: 'Coverage down to local governments and wards, FAAC allocations by area, and election results.' },
  { who: 'Track My Leader', text: 'Individual profiles for lawmakers, with loans and audits.' },
]
