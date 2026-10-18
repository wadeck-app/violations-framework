import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { rule } from './backend-entry-location.js'
import { createModule, type TempModule } from '../test-utils/app-module-fixtures.js'

describe('app-module/backend-entry-location', () => {
  let mod: TempModule | undefined
  afterEach(() => mod?.cleanup())

  it('passes src/backend/index.ts with a default export', async () => {
    mod = createModule()
    assert.equal((await rule.check([mod.at('manifest.json')], {})).length, 0)
  })

  it('passes `export { x as default }`', async () => {
    mod = createModule({ 'src/backend/index.ts': 'function run() {}\nexport { run as default };\n' })
    assert.equal((await rule.check([mod.at('manifest.json')], {})).length, 0)
  })

  it('flags a missing src/backend/index.ts', async () => {
    mod = createModule({ 'src/backend/index.ts': null, 'src/backend/other.ts': 'export {};\n' })
    const violations = await rule.check([mod.at('manifest.json')], {})
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /src\/backend\/index\.ts/)
  })

  it('flags an entry with no default export (a commented-out one does not count)', async () => {
    mod = createModule({ 'src/backend/index.ts': '// export default function () {}\nexport const x = 1;\n' })
    const violations = await rule.check([mod.at('manifest.json')], {})
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /no default export/)
  })

  it('ignores the generated dist-module manifest', async () => {
    mod = createModule({ 'dist-module/manifest.json': '{}' })
    assert.equal((await rule.check([mod.at('dist-module/manifest.json')], {})).length, 0)
  })

  it('flags the legacy layout (entry only under api-backend/)', async () => {
    mod = createModule({ 'src/backend/index.ts': null })
    mkdirSync(mod.at('api-backend'), { recursive: true })
    writeFileSync(mod.at('api-backend/index.js'), 'export default () => {};\n')
    assert.equal((await rule.check([mod.at('manifest.json')], {})).length, 1)
  })

  it('has the expected id and scope', () => {
    assert.equal(rule.id, 'app-module/backend-entry-location')
    assert.deepEqual(rule.defaultScope, ['**/app-module-*/manifest.json'])
  })
})
