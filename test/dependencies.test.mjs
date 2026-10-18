// Guards against the failure that stopped the dev server twice: code importing a
// package that is not in package.json (so it is missing on a fresh install and in
// production), or importing a model provider's own SDK instead of OpenRouter.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { join, relative } from 'node:path'

const root = process.cwd()
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})])

const walk = (dir) => readdirSync(dir).flatMap(name => {
  const p = join(dir, name)
  if (name === 'node_modules' || name.startsWith('.')) return []
  return statSync(p).isDirectory() ? walk(p) : [p]
})

// application code that runs on the server or in scripts (tests may import dev tools)
const files = ['server', 'scripts', 'api', 'src']
  .flatMap(d => { try { return walk(join(root, d)) } catch { return [] } })
  .filter(f => /\.(m?js|vue)$/.test(f))

const SPECIFIER = /(?:^|[\s;(])(?:import\s+(?:[\w*{}\s,$]+\s+from\s+)?|import\s*\(\s*|export\s+[\w*{}\s,$]+\s+from\s+)['"]([^'"]+)['"]/g
const packageOf = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])

const importsOf = (file) => {
  const src = readFileSync(file, 'utf8')
  const out = new Set()
  for (const m of src.matchAll(SPECIFIER)) {
    const spec = m[1]
    if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:') || spec.startsWith('#')) continue
    if (builtinModules.includes(spec.split('/')[0])) continue
    out.add(packageOf(spec))
  }
  return out
}

describe('dependencies', () => {
  test('every package imported by application code is declared in package.json', () => {
    const missing = []
    for (const f of files) {
      for (const name of importsOf(f)) {
        if (!declared.has(name)) missing.push(`${relative(root, f)} imports "${name}"`)
      }
    }
    assert.deepEqual(missing, [], 'add the package to package.json (or remove the import)')
  })

  test('nothing imports a model provider\'s own SDK; all model calls go through OpenRouter', () => {
    const offenders = files.filter(f => [...importsOf(f)].some(n => /^@anthropic-ai\//.test(n) || n === 'anthropic' || n === '@google/generative-ai'))
    assert.deepEqual(offenders.map(f => relative(root, f)), [])
    assert.ok(!declared.has('@anthropic-ai/sdk'), 'the Anthropic SDK is not a dependency')
  })

  test('the scan actually sees imports (so the checks above are not vacuous)', () => {
    const seen = new Set(files.flatMap(f => [...importsOf(f)]))
    for (const expected of ['express', 'openai', 'drizzle-orm']) assert.ok(seen.has(expected), expected)
    assert.ok(files.length > 30)
  })
})
