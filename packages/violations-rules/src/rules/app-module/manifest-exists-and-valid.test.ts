import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './manifest-exists-and-valid.js'
import { createModule, manifestWith, VALID_MODULE_FILES, type TempModule } from '../test-utils/app-module-fixtures.js'

const withDslLib = manifestWith({ dslLib: { shared: { react: '^19' } } })

describe('app-module/manifest-exists-and-valid', () => {
  let mod: TempModule | undefined
  afterEach(() => mod?.cleanup())

  async function run(files: Record<string, string | null> = {}) {
    mod?.cleanup()
    mod = createModule(files)
    return rule.check([mod.at('package.json')], {})
  }

  it('passes a valid source manifest', async () => {
    assert.equal((await run()).length, 0)
  })

  it('flags a missing manifest.json -- a module shipped with code and no manifest', async () => {
    const violations = await run({ 'manifest.json': null })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /missing manifest\.json/)
  })

  it('flags a manifest that is not JSON', async () => {
    const violations = await run({ 'manifest.json': '{nope' })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /not valid JSON/)
  })

  it('flags a manifest whose root is not a JSON object', async () => {
    const violations = await run({ 'manifest.json': '[]' })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /must be a JSON object/)
  })

  it('leaves schema errors to app-core-sdk/manifest-valid (no id, bad id, build-output keys, dslLib.entry)', async () => {
    const withoutId = JSON.stringify({ extensionPoints: JSON.parse(VALID_MODULE_FILES['manifest.json']).extensionPoints })
    for (const manifest of [withoutId, manifestWith({ id: 'bad id!' }), manifestWith({ version: '1.0.0', backendEntryPath: './api-backend/index.js' }), manifestWith({ dslLib: { entry: './dsl-lib/x.mjs', shared: {} } })]) {
      const violations = (await run({ 'manifest.json': manifest })).filter((v) => !/dslLib/.test(v.message))
      assert.deepEqual(violations, [], manifest)
    }
  })

  it('flags dslLib declared without src/dsl-components/index.ts', async () => {
    const violations = await run({ 'manifest.json': withDslLib })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /src\/dsl-components\/index\.ts/)
  })

  it('flags src/dsl-components files with no dslLib in the manifest', async () => {
    const violations = await run({ 'src/dsl-components/index.ts': 'export default [];\n' })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /no dslLib/)
  })

  it('passes dslLib together with src/dsl-components/index.ts', async () => {
    assert.equal((await run({ 'manifest.json': withDslLib, 'src/dsl-components/index.ts': 'export default [];\n' })).length, 0)
  })

  it('ignores a package.json inside dist-module', async () => {
    mod?.cleanup()
    mod = createModule({ 'dist-module/package.json': '{}' })
    assert.equal((await rule.check([mod.at('dist-module/package.json')], {})).length, 0)
  })
})
