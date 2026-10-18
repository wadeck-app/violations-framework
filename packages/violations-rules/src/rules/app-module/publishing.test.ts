import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './publishing.js'
import { createModule, type TempModule } from '../test-utils/app-module-fixtures.js'

describe('app-module/publishing', () => {
  let mod: TempModule | undefined
  afterEach(() => mod?.cleanup())

  async function run(files: Record<string, string | null> = {}) {
    mod?.cleanup()
    mod = createModule(files)
    return rule.check([mod.at('manifest.json')], {})
  }

  it('passes .gitignore with dist-module and files == ["dist-module"]', async () => {
    assert.equal((await run()).length, 0)
  })

  it('accepts /dist-module/ and CRLF line endings in .gitignore', async () => {
    assert.equal((await run({ '.gitignore': 'node_modules\r\n/dist-module/\r\n' })).length, 0)
  })

  it('flags a missing .gitignore', async () => {
    const violations = await run({ '.gitignore': null })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /gitignored/)
  })

  it('flags a .gitignore that does not list dist-module', async () => {
    assert.equal((await run({ '.gitignore': 'node_modules\ndist\n' })).length, 1)
  })

  it('flags files other than ["dist-module"]', async () => {
    for (const files of [undefined, ['dist-module', 'src'], ['src'], []]) {
      assert.equal((await run({ 'package.json': JSON.stringify({ name: 'x', files }) })).length, 1)
    }
  })

  it('flags a package.json that is not JSON', async () => {
    assert.equal((await run({ 'package.json': '{nope' })).length, 1)
  })

  it('does not require a package.json (only .gitignore)', async () => {
    assert.equal((await run({ 'package.json': null })).length, 0)
  })

  it('ignores the generated dist-module manifest', async () => {
    mod?.cleanup()
    mod = createModule({ 'dist-module/manifest.json': '{}', '.gitignore': null })
    assert.equal((await rule.check([mod.at('dist-module/manifest.json')], {})).length, 0)
  })
})
