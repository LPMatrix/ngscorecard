// The Government Service Portal source: HTML cleaning, the rules for the portal's
// unfinished data, document mapping, and the polite crawler. The fixture is a
// trimmed copy of the portal's real responses (NIMC, CAC, FRSC, plus the probe
// record and test agency that are in its live data).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  htmlToText, feeLine, looksLikeTestData, validContact, serviceDocument, providerDocument,
  portalDocuments, createPortalClient, crawlPortal, PORTAL_ORIGIN, MIN_PLAUSIBLE_FEE,
} from '../server/portalSource.js'

const snapshot = JSON.parse(readFileSync(new URL('./fixtures/portal-snapshot-sample.json', import.meta.url), 'utf8'))
const entry = (abbr) => snapshot.providers.find(p => p.nav.abbr === abbr)
const profile = (abbr) => ({ ...entry(abbr).nav, ...entry(abbr).detail })

describe('htmlToText', () => {
  test('keeps reading order, lists and the address behind a link', () => {
    const out = htmlToText('<p>Reserve a name (<a href="https://example.test/name">click here</a>)</p><ul><li>One</li><li>Two</li></ul>Done')
    assert.equal(out, 'Reserve a name (click here (https://example.test/name))\n\n- One\n- Two\nDone')
  })

  test('decodes entities, drops tags, scripts and styles', () => {
    assert.equal(htmlToText('Fees &amp; charges&nbsp;apply &lt;b&gt;<script>alert(1)</script><style>p{}</style>'), 'Fees & charges apply <b>')
  })

  test('is plain text: markup that survives is only visible text, never a tag', () => {
    const out = htmlToText('<img src=x onerror=alert(1)><b onclick="x()">hi</b><iframe src="https://evil.test"></iframe>')
    assert.equal(out, 'hi')
    assert.ok(!/[<>]/.test(out))
  })

  test('a leading # is removed so the chunker does not read it as a heading', () => {
    assert.equal(htmlToText('<p># Not a heading</p>'), 'Not a heading')
  })

  test('numeric entities, line breaks and runs of whitespace', () => {
    assert.equal(htmlToText('A&#8217;s&#x20;B<br/>C<br>  <br>D'), 'A’s B\nC\n\nD')
  })

  test('null, undefined and empty give an empty string', () => {
    for (const v of [null, undefined, '', '  ']) assert.equal(htmlToText(v), '')
  })
})

describe('fee rule', () => {
  test('a plausible amount is reported with the portal as the source, not as fact', () => {
    assert.equal(feeLine(50000), 'The portal lists the fee as ₦50,000.')
    assert.equal(feeLine(MIN_PLAUSIBLE_FEE), 'The portal lists the fee as ₦100.')
  })

  test('0, 1, tiny, negative and non-numeric fees are not usable', () => {
    for (const v of [0, 1, 3, 13, 99, -5, null, undefined, 'abc', NaN]) assert.equal(feeLine(v), null, String(v))
  })

  test('numeric strings are accepted', () => assert.equal(feeLine('3000'), 'The portal lists the fee as ₦3,000.'))
})

describe('test and probe data', () => {
  test('spots the probe record, test agencies and similar', () => {
    for (const n of ['SSRF_1777192514', 'ssrf1777192514', 'Test MDA', 'test-mda', 'Dummy service', 'XSS payload', 'lorem ipsum']) {
      assert.equal(looksLikeTestData(n), true, n)
    }
  })

  test('does not flag real names that merely contain the letters', () => {
    for (const n of ['NITDA (Software Testing and Certification)', 'Vulnerability Assessment & Penetration Testing Service', 'Contest Registration', 'Company Registration', 'NIMC (E-ID Card)']) {
      assert.equal(looksLikeTestData(n), false, n)
    }
  })
})

describe('agency contact details', () => {
  test('the placeholder profile on the portal (NIMC) yields no contact lines at all', () => {
    // address "6876778", phone "798897889", email "sfsdf@sdfsd.com", website "sdfsdf"
    const { lines, dropped } = validContact(profile('NIMC'))
    assert.deepEqual(lines, [])
    assert.deepEqual(dropped.sort(), ['Address', 'Email', 'Phone', 'Website'])
  })

  test('real-looking details are kept', () => {
    const { lines, dropped } = validContact({
      address: 'Plot 420, Tigris Crescent, Maitama, Abuja', phone_number: '+234 708 123 4567; 09-461 23456',
      email_address: 'helpdesk@cac.gov.ng', weblink: 'https://www.cac.gov.ng',
    })
    assert.deepEqual(dropped, [])
    assert.deepEqual(lines, [
      '- Address: Plot 420, Tigris Crescent, Maitama, Abuja',
      '- Phone: +2347081234567, 0946123456',
      '- Email: helpdesk@cac.gov.ng',
      '- Website: cac.gov.ng',
    ])
  })

  test('an email on an unrelated domain is dropped even when it looks well formed', () => {
    const { lines, dropped } = validContact({ email_address: 'info@somewhere-else.com', weblink: 'https://agency.gov.ng' })
    assert.deepEqual(lines, ['- Website: agency.gov.ng'])
    assert.deepEqual(dropped, ['Email'])
  })

  test('an email on the agency\'s own non-gov domain is kept when the website matches', () => {
    const { lines } = validContact({ email_address: 'contact@agency.com.ng', weblink: 'https://www.agency.com.ng/about' })
    assert.ok(lines.includes('- Email: contact@agency.com.ng'))
  })

  test('a website that is not a Nigerian address is dropped (the portal has "fdfd.com" and "sdfsdf")', () => {
    for (const weblink of ['fdfd.com', 'sdfsdf', 'https://example.com', 'www.agency.org']) {
      assert.deepEqual(validContact({ weblink }).dropped, ['Website'], weblink)
    }
    assert.deepEqual(validContact({ weblink: 'https://nimc.gov.ng/about' }).lines, ['- Website: nimc.gov.ng'])
  })

  test('digits-only and one-word addresses are dropped', () => {
    for (const address of ['6876778', 'Abuja', 'sdfsdf sdf']) assert.deepEqual(validContact({ address }).dropped, ['Address'], address)
  })
})

describe('serviceDocument', () => {
  const frsc = () => entry('FRSC').services.find(s => s.slug === 'frsc-new-drivers-licence-registeration')

  test('builds a titled document with a deep link, a stable id and the portal as the origin', () => {
    const { doc, skipped } = serviceDocument(profile('FRSC'), frsc())
    assert.equal(skipped, null)
    assert.equal(doc.source, 'FRSC')
    assert.equal(doc.origin, PORTAL_ORIGIN)
    assert.equal(doc.externalId, 'service:federal-road-safety-corps/frsc-new-drivers-licence-registeration')
    assert.equal(doc.url, 'https://services.gov.ng/service-provider/federal-road-safety-corps/frsc-new-drivers-licence-registeration')
    assert.match(doc.content, /^# FRSC \(New Driver's Licence Registeration\)/)
  })

  test('carries the real fee, the timeline, the steps and the requirements', () => {
    const { doc } = serviceDocument(profile('FRSC'), frsc())
    assert.match(doc.content, /Fee: The portal lists the fee as ₦50,000\./)
    assert.match(doc.content, /Processing time: the portal lists 0-48 Hours\./)
    assert.match(doc.content, /## Drivers License Requirements\nProcess of obtaining a new license/)
    assert.match(doc.content, /18 years and above/)
  })

  test('a placeholder fee is stated as unusable, never as a price', () => {
    const cac = entry('CAC').services.find(s => s.slug === 'cac-company-registration') // fee 1
    const { doc } = serviceDocument(profile('CAC'), cac)
    assert.match(doc.content, /Fee: the portal does not give a usable fee for this service\. Confirm the fee with the agency\./)
    assert.ok(!/₦1\b/.test(doc.content))
  })

  test('a service marked coming soon says so', () => {
    const cac = entry('CAC').services.find(s => s.slug === 'cac-company-registration')
    assert.match(serviceDocument(profile('CAC'), cac).doc.content, /marks this as coming soon/)
  })

  test('the agency\'s own enquiries text is kept, and placeholder profile contacts are not added', () => {
    const nin = entry('NIMC').services.find(s => s.slug === 'nimc-nin-pre-enrollment')
    const { doc } = serviceDocument(profile('NIMC'), nin)
    assert.match(doc.content, /0700 2255 646/)
    for (const junk of ['6876778', 'sfsdf@sdfsd.com', 'sdfsdf', '798897889', 'Armenia']) assert.ok(!doc.content.includes(junk), junk)
  })

  test('the probe record is skipped', () => {
    const probe = entry('NAFDAC').services[0]
    assert.equal(probe.name, 'SSRF_1777192514')
    const r = serviceDocument(profile('NAFDAC'), probe)
    assert.equal(r.doc, null)
    assert.match(r.skipped, /test or probe/)
  })

  test('a placeholder summary with no real text is skipped; with real sections it is kept without the summary', () => {
    const p = { slug: 'a', abbr: 'A', name: 'Agency A' }
    const bare = serviceDocument(p, { name: 'Thing', slug: 'thing', summary: 'x', service_fees: 0, serviceSection: [] })
    assert.equal(bare.doc, null)
    const withSteps = serviceDocument(p, {
      name: 'Thing', slug: 'thing', summary: 'x', service_fees: 5000,
      serviceSection: [{ section_title: 'How', section_description: `<p>${'Step one. '.repeat(60)}</p>` }],
    })
    assert.ok(withSteps.doc)
    assert.ok(!withSteps.doc.content.includes('## About this service'))
    assert.ok(withSteps.warnings.includes('no usable summary'))
  })

  test('missing fields never throw', () => {
    const r = serviceDocument({ slug: 'a', abbr: 'A', name: 'A' }, { name: 'Real service', slug: 'real', summary: 'A genuine description of the service.' })
    assert.ok(r.doc)
  })
})

describe('providerDocument', () => {
  test('lists the services, keeps the mandate, leaves out placeholder contacts and warns', () => {
    const r = providerDocument(profile('NIMC'), ['NIMC (NIN Pre Enrollment)', 'NIMC (E-ID Card)'])
    assert.equal(r.doc.externalId, 'provider:national-identity-management-commission')
    assert.equal(r.doc.title, 'National Identity Management Commission (NIMC): about and contact')
    assert.match(r.doc.content, /NIMC Act No\. 23 of 2007/)
    assert.match(r.doc.content, /## Services listed on the portal\n- NIMC \(NIN Pre Enrollment\)\n- NIMC \(E-ID Card\)/)
    assert.ok(!r.doc.content.includes('## Contact details'))
    assert.match(r.warnings[0], /placeholder data/)
  })

  test('an agency with no profile information and the test agency produce no document', () => {
    assert.match(providerDocument({ slug: 'x', abbr: 'X', name: 'X Agency' }, []).skipped, /no profile/)
    assert.match(providerDocument(profile('TMDA'), []).skipped, /test or probe/)
  })
})

describe('portalDocuments', () => {
  const out = portalDocuments(snapshot)

  test('counts, and no document for the probe record or the test agency', () => {
    assert.equal(out.stats.providers, 5)
    assert.equal(out.stats.services, 9)
    assert.ok(out.docs.every(d => !/ssrf/i.test(d.title + d.content)))
    assert.ok(out.docs.every(d => !d.externalId.includes('test-mda')))
    assert.deepEqual(out.skipped.map(s => s.where).sort(), ['NAFDAC/ssrf1777192514', 'test-mda'])
  })

  test('every document is portal-owned, has a unique stable id and a deep link on the portal', () => {
    const ids = out.docs.map(d => d.externalId)
    assert.equal(new Set(ids).size, ids.length)
    for (const d of out.docs) {
      assert.equal(d.origin, PORTAL_ORIGIN)
      assert.match(d.url, /^https:\/\/services\.gov\.ng\/service-provider\//)
    }
  })

  test('no cloud-metadata address or other internal address reaches a document', () => {
    for (const d of out.docs) assert.ok(!/169\.254|localhost|127\.0\.0\.1/.test(d.content), d.externalId)
  })

  test('coming-soon and unusable-fee counts are reported', () => {
    assert.ok(out.stats.comingSoon >= 1)
    assert.ok(out.stats.unusableFees >= 1)
  })

  test('archived agencies and services are left out', () => {
    const snap = structuredClone(snapshot)
    snap.providers[0].detail.archived_at = '2026-01-01'
    snap.providers[1].services[0].archived_at = '2026-01-01'
    const r = portalDocuments(snap)
    assert.ok(r.skipped.some(s => s.reason === 'archived on the portal'))
    assert.ok(r.docs.length < out.docs.length)
  })

  test('text from the portal is never kept as markup', () => {
    const snap = structuredClone(snapshot)
    snap.providers[2].services[0].summary = '<script>steal()</script><img src=x onerror=alert(1)>A genuine, long enough description of this service for the test.'
    const r = portalDocuments(snap)
    assert.ok(r.docs.every(d => !/<script|<img|onerror/i.test(d.content)))
  })
})

describe('createPortalClient', () => {
  const respond = (status, body, headers = {}) => ({ status, ok: status >= 200 && status < 300, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, json: async () => body })

  test('retries a server error and then succeeds', async () => {
    let calls = 0
    const client = createPortalClient({ delayMs: 0, retries: 3, fetchImpl: async () => (++calls < 3 ? respond(503) : respond(200, { data: 1 })) })
    // the real backoff (1s, then 2s) applies, so this test takes about three seconds
    const r = await client.getJson('x')
    assert.deepEqual(r, { data: 1 })
    assert.equal(calls, 3)
  })

  test('a 404 is reported, not thrown', async () => {
    const client = createPortalClient({ delayMs: 0, fetchImpl: async () => respond(404) })
    assert.deepEqual(await client.getJson('missing'), { notFound: true })
  })

  test('other client errors are not retried', async () => {
    let calls = 0
    const client = createPortalClient({ delayMs: 0, retries: 3, fetchImpl: async () => { calls++; return respond(403) } })
    await assert.rejects(client.getJson('x'), /HTTP 403/)
    assert.equal(calls, 1)
  })

  test('gives up after the retries and says which request failed', async () => {
    let calls = 0
    const client = createPortalClient({ delayMs: 0, retries: 1, fetchImpl: async () => { calls++; return respond(500) } })
    await assert.rejects(client.getJson('get-service-detail-by-slug/abc'), /HTTP 500 for get-service-detail-by-slug\/abc/)
    assert.equal(calls, 2)
  })

  test('requests are spaced at least delayMs apart, even when callers overlap', async () => {
    const times = []
    const client = createPortalClient({
      delayMs: 60,
      fetchImpl: async () => { times.push(Date.now()); return respond(200, {}) },
    })
    await Promise.all([client.getJson('a'), client.getJson('b'), client.getJson('c')])
    assert.equal(client.requestCount, 3)
    assert.ok(times[1] - times[0] >= 55 && times[2] - times[1] >= 55, `gaps ${times[1] - times[0]}, ${times[2] - times[1]}`)
  })

  test('identifies itself and asks for JSON', async () => {
    let seen
    const client = createPortalClient({ delayMs: 0, fetchImpl: async (_url, init) => { seen = init.headers; return respond(200, {}) } })
    await client.getJson('x')
    assert.equal(seen.accept, 'application/json')
    assert.match(seen['user-agent'], /NGScorecard/)
  })
})

describe('crawlPortal', () => {
  const api = (overrides = {}) => async (path) => {
    if (overrides[path]) return overrides[path]
    if (path === 'get-providers-for-nav') return { data: [{ slug: 'a', abbr: 'A', name: 'Agency A' }, { slug: 'b', abbr: 'B', name: 'Agency B' }] }
    if (path.startsWith('get-provider-detail-by-slug/')) return { data: { slug: path.split('/')[1], name: 'N', abbr: 'X', services: [{ slug: `${path.split('/')[1]}-s1` }, { slug: `${path.split('/')[1]}-s2` }] } }
    if (path.startsWith('get-service-detail-by-slug/')) return { data: { slug: path.split('/')[1], name: 'S', summary: 'x'.repeat(30) } }
    throw new Error('unexpected ' + path)
  }

  test('walks every agency and every service', async () => {
    const snap = await crawlPortal({ getJson: api() })
    assert.equal(snap.providers.length, 2)
    assert.equal(snap.providers[0].services.length, 2)
    assert.deepEqual(snap.failures, [])
    assert.ok(snap.fetchedAt)
    assert.ok(!('services' in snap.providers[0].detail), 'the service list is stored once, with the full records')
  })

  test('one failing page is recorded and the crawl carries on', async () => {
    const snap = await crawlPortal({ getJson: async (p) => {
      if (p === 'get-service-detail-by-slug/a-s1') throw new Error('HTTP 500 for ' + p)
      if (p === 'get-service-detail-by-slug/b-s2') return { notFound: true }
      return api()(p)
    } })
    assert.equal(snap.providers[0].services.length, 1)
    assert.equal(snap.providers[1].services.length, 1)
    assert.deepEqual(snap.failures.map(f => f.path).sort(), ['service/a-s1', 'service/b-s2'])
  })

  test('limitProviders trials a few agencies only', async () => {
    const snap = await crawlPortal({ getJson: api() }, { limitProviders: 1 })
    assert.equal(snap.providers.length, 1)
  })

  test('an unreadable agency list is an error, not an empty success', async () => {
    await assert.rejects(crawlPortal({ getJson: async () => ({ message: 'changed' }) }), /agency list/)
  })
})
