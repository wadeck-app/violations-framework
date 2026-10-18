import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './source-layout.js'
import { createModule, type TempModule } from '../test-utils/app-module-fixtures.js'

describe('app-module/source-layout', () => {
  let mod: TempModule | undefined
  afterEach(() => mod?.cleanup())

  async function run(files: Record<string, string | null> = {}, anchor = 'manifest.json') {
    mod?.cleanup()
    mod = createModule(files)
    return rule.check([mod.at(anchor)], {})
  }

  it('passes the standard layout, including README, config files, dotfolders, .app-core-dev and dist-module', async () => {
    const violations = await run({
      'README.md': '# x\n',
      'tsconfig.json': '{}',
      'vitest.config.ts': 'export default {};\n',
      '.github/workflows/ci.yml': 'on: push\n',
      '.app-core-dev/data.json': '{}',
      'dist-module/manifest.json': '{}',
      'src/commons/shared.ts': 'export const a = 1;\n',
    })
    assert.equal(violations.length, 0)
  })

  it('flags legacy source folders at the root', async () => {
    const violations = await run({ 'api-backend/index.js': 'x', 'dsl-frontend/page.yaml': '$type: Badge\n' })
    const created = mod!
    assert.deepEqual(violations.map((v) => v.file).sort(), [created.at('api-backend'), created.at('dsl-frontend')].sort())
  })

  it('flags a stray source file at the root', async () => {
    assert.equal((await run({ 'helper.ts': 'export {};\n' })).length, 1)
  })

  it('flags an unknown folder and a loose file under src', async () => {
    assert.equal((await run({ 'src/utils/a.ts': 'export {};\n', 'src/loose.ts': 'export {};\n' })).length, 2)
  })

  it('flags a missing src folder', async () => {
    const violations = await run({ 'src/backend/index.ts': null, 'src/dsl-views/page.yaml': null })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /no src\/ folder/)
  })

  it('accepts yaml, yml and json views and flags code in src/dsl-views', async () => {
    const violations = await run({ 'src/dsl-views/b.yml': 'a: 1\n', 'src/dsl-views/c.json': '{}', 'src/dsl-views/d.ts': 'export {};\n', 'src/dsl-views/e.tsx': 'export {};\n' })
    const created = mod!
    assert.deepEqual(violations.map((v) => v.file).sort(), [created.at('src/dsl-views/d.ts'), created.at('src/dsl-views/e.tsx')].sort())
  })

  it('ignores the generated dist-module/manifest.json', async () => {
    const violations = await run({ 'dist-module/manifest.json': '{}', 'dist-module/api-backend/backend.cjs': 'x' }, 'dist-module/manifest.json')
    assert.equal(violations.length, 0)
  })
})
