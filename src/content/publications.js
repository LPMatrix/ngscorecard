// Editorial publications. Plain data, English only, rendered by
// PublicationsView.vue. Inline *italics* are the only markup supported.
// To add one: append an object; the slug is its URL (/publications/<slug>).

export const PUBLICATIONS = [
  {
    slug: 'which-seven-point-agenda',
    title: 'Which seven-point agenda?',
    subtitle: 'How Nigerian political promises go missing before anyone can hold them',
    date: '2026-09-20',
    author: 'NGScorecard',
    summary:
      'A president said he would rely on a seven-point agenda that formed his compact with voters. We went looking for it, and found at least four different lists. Across the administrations we examined, promises went missing in four ways: absent, generic, unstable and migrated.',
    sections: [
      {
        paragraphs: [
          'On 29 May 2007, Umaru Musa Yar\'Adua told Nigerians he would rely on "the 7-point agenda that formed the basis of our compact with voters during the recent campaigns." The address did not list the seven points.',
          'We went looking for them. A scholar\'s review of the 2007 campaign says his advertisements stressed corruption, the Niger Delta, oil and gas, economic reform, the fuel shortage, foreign policy and ethnic and religious mistrust. The agenda most often cited afterwards is a different seven: power, food security, wealth creation, mass transport, land reform, security and education. A 2010 academic paper attributes yet another list to a 2007 ministry document, and a 24-page government overview issued from London in February 2009 arranges the points a fourth way. In February 2009 a critic asked in *Tell*: "Which seven-point agenda?" We could not find the 2007 ministry document itself.',
          'Yar\'Adua is an extreme case, but not an isolated one. Across the administrations we examined, promises go missing in four ways.',
        ],
      },
      {
        heading: '1. Absent',
        paragraphs: [
          'For Goodluck Jonathan\'s 2011 campaign we found no manifesto. What exists is a list compiled by the International Press Centre from newspapers, magazines, a television debate and his inaugural address. It says 91 promises; the copy we could read lists about 98. Of the 17 promises on our own Jonathan scorecard before we added this list, eight were not in it, including the Freedom of Information Act and the National Conference. They came later.',
        ],
      },
      {
        heading: '2. Generic',
        paragraphs: [
          'The Peoples Democratic Party text printed by the *Guardian* on 28 March 2015, the day of the presidential election, runs to about 870 words. It affirms "democracy and good governance" and "integrity, transparency and accountability". It contains no number, date or named project. The article ends after the economy section, so it may be an excerpt.',
        ],
      },
      {
        heading: '3. Unstable',
        paragraphs: [
          'The 2023 APC action plan promised oil output of 2.6 million barrels a day by 2027 and 4 million by 2030. In February 2026 a speech delivered for the president by his deputy gave 2.5 million by 2027 and 3 million by 2030. The action plan listed the AKK gas pipeline among projects due by 2027; NNPC said first quarter 2025, and a minister later said 2025, after earlier dates in 2023. The yardstick moves, and the old one is not withdrawn.',
        ],
      },
      {
        heading: '4. Migrated',
        paragraphs: [
          'The most quoted numbers of the Tinubu years do not appear in the action plan. The 18% tax-to-GDP target was stated on 8 August 2023 at the inauguration of a committee. The 15% inflation target came with the 2025 budget in December 2024. "50 million jobs" was reported when a minister told the first cabinet meeting that the president\'s target of 50 million jobs would be achieved. Promises leave the document and continue as speeches.',
        ],
      },
      {
        heading: 'The paper trail is thin',
        paragraphs: [
          'Much of the record survives by accident. Jonathan\'s 2011 list lives on a blog. Yar\'Adua\'s inaugural address survives as a Wayback Machine copy, because its original link is dead. INEC\'s old manifesto links now return errors, and an online electoral repository run by The Electoral Hub holds current party manifestos uploaded in 2025, with its 1st to 3rd Republic sections empty when we looked.',
          'Nigerian rules require a party to submit a manifesto when it registers with INEC. We did not find a rule requiring individual candidates to publish one.',
        ],
      },
      {
        heading: 'What this means',
        paragraphs: [
          'A voter cannot hold a leader to a promise that was never written down, was written in general terms, keeps changing, or has moved to another document. Journalists and trackers fill the gap by reconstructing promises from speeches. We found the same problem in our own list, and have corrected the entries we could verify.',
          'One remedy is cheap: parties and candidates could publish a dated, numbered platform before the election and keep it public afterwards.',
        ],
      },
    ],
    notes: [
      'This piece rests on documents we retrieved from public sources in September 2026. Where we could not locate a document, we say so.',
      'Corrections are welcome: use "Report an issue" on any scorecard, or write to the address on the press page.',
    ],
  },
]

export function findPublication(slug) {
  return PUBLICATIONS.find((p) => p.slug === slug) ?? null
}

// Index view: everything except the section bodies.
export function listPublications() {
  return PUBLICATIONS.map(({ slug, title, subtitle, date, author, summary }) => ({ slug, title, subtitle, date, author, summary }))
}
