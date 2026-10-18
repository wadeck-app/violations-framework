import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './naming-convention.js'
import { createModule, type TempModule } from '../test-utils/app-module-fixtures.js'

describe('app-module/naming-convention', () => {
  let mod: TempModule | undefined
  afterEach(() => mod?.cleanup())

  async function checkFolder(name: string) {
    mod?.cleanup()
    mod = createModule({}, name)
    return rule.check([mod.at('manifest.json')], {})
  }

  it('passes a correctly prefixed name', async () => {
    assert.equal((await checkFolder('app-module-queue')).length, 0)
  })

  it('rejects a bare "app-module" with no suffix', async () => {
    const violations = await checkFolder('app-module')
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /must be named "app-module-<name>"/)
  })

  it('rejects an unrelated name entirely', async () => {
    assert.equal((await checkFolder('queue-module')).length, 1)
  })

  it('rejects suffix-style naming (queue-app-module)', async () => {
    assert.equal((await checkFolder('queue-app-module')).length, 1)
  })

  it('skips the generated dist-module/manifest.json and .app-core-dev', async () => {
    mod?.cleanup()
    mod = createModule({ 'dist-module/manifest.json': '{}', '.app-core-dev/x/manifest.json': '{}' })
    assert.equal((await rule.check([mod.at('dist-module/manifest.json'), mod.at('.app-core-dev/x/manifest.json')], {})).length, 0)
  })
})
