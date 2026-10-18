import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './view-location.js'
import { createModule, manifestWithView, type TempModule } from '../test-utils/app-module-fixtures.js'

describe('app-module/view-location', () => {
  let mod: TempModule | undefined
  afterEach(() => mod?.cleanup())

  async function run(files: Record<string, string | null> = {}) {
    mod?.cleanup()
    mod = createModule(files)
    return rule.check([mod.at('manifest.json')], {})
  }

  it('passes a view inside src/dsl-views', async () => {
    assert.equal((await run()).length, 0)
  })

  it('flags a view outside src/dsl-views (legacy dsl-frontend/)', async () => {
    const violations = await run({
      'manifest.json': manifestWithView({ type: 'path', value: './dsl-frontend/page.yaml' }),
      'dsl-frontend/page.yaml': '$type: Badge\n',
    })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /src\/dsl-views\//)
  })

  it('flags a referenced view that does not exist', async () => {
    const violations = await run({ 'manifest.json': manifestWithView({ type: 'path', value: './src/dsl-views/missing.yaml' }) })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /does not exist/)
  })

  it('flags a view that is a YAML sequence or scalar, not an object', async () => {
    assert.equal((await run({ 'src/dsl-views/page.yaml': '- a\n- b\n' })).length, 1)
    assert.equal((await run({ 'src/dsl-views/page.yaml': 'just text\n' })).length, 1)
    assert.equal((await run({ 'src/dsl-views/page.yaml': '' })).length, 1)
  })

  it('accepts a YAML object preceded by comments and a document marker', async () => {
    assert.equal((await run({ 'src/dsl-views/page.yaml': '# header\n---\n$type: Badge\n' })).length, 0)
  })

  it('checks .json views with a real JSON parser', async () => {
    const manifest = manifestWithView({ type: 'path', value: './src/dsl-views/page.json' })
    assert.equal((await run({ 'manifest.json': manifest, 'src/dsl-views/page.json': '{"$type":"Badge"}' })).length, 0)
    const bad = await run({ 'manifest.json': manifest, 'src/dsl-views/page.json': '{nope' })
    assert.equal(bad.length, 1)
    assert.match(bad[0].message, /not valid JSON/)
    assert.equal((await run({ 'manifest.json': manifest, 'src/dsl-views/page.json': '[1]' })).length, 1)
  })

  it('ignores inline views (no path to check)', async () => {
    assert.equal((await run({ 'manifest.json': manifestWithView({ type: 'inline', value: { $type: 'Badge', label: 'ok' } }) })).length, 0)
  })

  it('leaves an invalid manifest to manifest-exists-and-valid', async () => {
    assert.equal((await run({ 'manifest.json': '{}' })).length, 0)
  })
})
