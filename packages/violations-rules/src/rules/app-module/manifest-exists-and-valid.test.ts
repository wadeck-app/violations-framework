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

  it('flags a manifest without an id', async () => {
    const violations = await run({ 'manifest.json': JSON.stringify({ extensionPoints: JSON.parse(VALID_MODULE_FILES['manifest.json']).extensionPoints }) })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /id: Required/)
  })

  it('flags an invalid id', async () => {
    const violations = await run({ 'manifest.json': manifestWith({ id: 'bad id!' }) })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /module id must/)
  })

  it('flags build-output fields in the source manifest (version, backendEntryPath)', async () => {
    const violations = await run({ 'manifest.json': manifestWith({ version: '1.0.0', backendEntryPath: './api-backend/index.js' }) })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /failed validation/)
    assert.match(violations[0].message, /Unrecognized key.*'version'/)
    assert.match(violations[0].message, /'backendEntryPath'/)
  })

  it('flags dslLib.entry (written by `package`, not by the author)', async () => {
    const violations = await run({ 'manifest.json': manifestWith({ dslLib: { entry: './dsl-lib/x.mjs', shared: {} } }) })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /Unrecognized key.*'entry'/)
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
