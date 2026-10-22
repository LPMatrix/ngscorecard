// The local government dataset and the page's route. The per-state totals below
// are the official ones (774 in all: 768 in the 36 states plus the 6 area
// councils of the Federal Capital Territory), kept here as an independent check
// on whatever the import script wrote.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import data from '../src/content/localGovernments.json' with { type: 'json' }
import { NG_ZONES, NG_ZONE_ORDER } from '../src/lib/zones.js'
import { matchRoute, routePath, buildPath } from '../src/routes.js'

const OFFICIAL = {
  Abia: 17, Adamawa: 21, 'Akwa Ibom': 31, Anambra: 21, Bauchi: 20, Bayelsa: 8, Benue: 23, Borno: 27, 'Cross River': 18,
  Delta: 25, Ebonyi: 13, Edo: 18, Ekiti: 16, Enugu: 17, 'Federal Capital Territory': 6, Gombe: 11, Imo: 27, Jigawa: 27,
  Kaduna: 23, Kano: 44, Katsina: 34, Kebbi: 21, Kogi: 21, Kwara: 16, Lagos: 20, Nasarawa: 13, Niger: 25, Ogun: 20,
  Ondo: 18, Osun: 30, Oyo: 33, Plateau: 17, Rivers: 23, Sokoto: 23, Taraba: 16, Yobe: 17, Zamfara: 14,
}

describe('local government data', () => {
  test('the official totals themselves add up to 774', () => {
    assert.equal(Object.values(OFFICIAL).reduce((a, b) => a + b, 0), 774)
  })

  test('774 areas in 37 states, and the file says so', () => {
    const counted = data.states.reduce((n, s) => n + s.lgas.length, 0)
    assert.equal(counted, 774)
    assert.equal(data.total, 774)
    assert.equal(data.states.length, 37)
  })

  test('every state has exactly its official number of areas', () => {
    const got = Object.fromEntries(data.states.map((s) => [s.state, s.lgas.length]))
    assert.deepEqual(got, OFFICIAL)
  })

  test('no duplicates, blanks, stray spaces or lower-case names', () => {
    for (const s of data.states) {
      assert.equal(new Set(s.lgas).size, s.lgas.length, `${s.state} has a duplicate`)
      for (const n of s.lgas) {
        assert.equal(n, n.trim().replace(/\s+/g, ' '), `${s.state}: "${n}" has odd spacing`)
        assert.match(n, /^[A-Z]/, `${s.state}: "${n}" should start with a capital`)
      }
    }
  })

  test('each state sits in a real zone that agrees with the shared zone table, and there are six zones', () => {
    for (const s of data.states) {
      assert.equal(s.zone, NG_ZONES[s.state], s.state)
      assert.ok(NG_ZONE_ORDER.includes(s.zone), s.state)
    }
    assert.deepEqual([...new Set(data.states.map((s) => s.zone))].sort(), [...NG_ZONE_ORDER].sort())
  })

  test('states are ordered by zone, then alphabetically, and areas alphabetically', () => {
    const order = data.states.map((s) => [NG_ZONE_ORDER.indexOf(s.zone), s.state])
    const sorted = [...order].sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1], 'en'))
    assert.deepEqual(order, sorted)
    for (const s of data.states) assert.deepEqual(s.lgas, [...s.lgas].sort((a, b) => a.localeCompare(b, 'en')), s.state)
  })

  test('it records where the names came from', () => {
    assert.match(data.source.url, /^https:\/\//)
    assert.ok(data.source.license && data.source.retrieved && data.source.name)
  })

  test('a few well-known areas are where they should be', () => {
    const lgas = (st) => data.states.find((s) => s.state === st).lgas
    assert.ok(lgas('Lagos').includes('Ikeja') && lgas('Lagos').includes('Eti-Osa'))
    assert.ok(lgas('Oyo').includes('Oyo East') && lgas('Oyo').includes('Oyo West'))
    assert.ok(lgas('Kano').includes('Kumbotso'))
    assert.ok(lgas('Federal Capital Territory').includes('Bwari'))
  })
})

describe('the /local-governments route', () => {
  test('matches with and without a trailing slash, and in other locales', () => {
    assert.equal(matchRoute('/local-governments').name, 'localGovernments')
    assert.equal(matchRoute('/local-governments/').name, 'localGovernments')
    assert.equal(matchRoute('/ha/local-governments').name, 'localGovernments')
    assert.equal(matchRoute('/ha/local-governments').locale, 'ha')
  })
  test('is not mistaken for an administration', () => {
    assert.notEqual(matchRoute('/local-governments').name, 'scorecard')
  })
  test('builds its own path', () => {
    assert.equal(routePath('localGovernments'), '/local-governments')
    assert.equal(buildPath('localGovernments', {}, 'en'), '/local-governments')
  })
})
