import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { matchesGlob } from 'node:path'
import { rule } from './no-raw-timers.js'
import { createModule, type TempModule } from '../test-utils/app-module-fixtures.js'

describe('app-module/no-raw-timers', () => {
  it('has the correct rule id and severity', () => {
    assert.equal(rule.id, 'app-module/no-raw-timers')
    assert.equal(rule.defaultSeverity, 'error')
  })

  it('scopes itself to src/backend of any app-module-* folder, wherever it sits in the repo', () => {
    assert.ok(rule.defaultScope.length > 0)
    assert.ok(rule.defaultScope.every((p) => p.startsWith('**/app-module-*/src/backend/')))
  })

  describe('defaultScope matching', () => {
    const inScope = (p: string): boolean => rule.defaultScope.some((g) => matchesGlob(p, g))

    it('includes backend files, nested or at the repo root', () => {
      assert.ok(inScope('repo/packages/app-module-fake/src/backend/index.ts'))
      assert.ok(inScope('app-module-fake/src/backend/lib/timers.mjs'))
    })

    it('excludes browser-side and legacy folders', () => {
      assert.ok(!inScope('packages/app-module-fake/src/dsl-components/Card.ts'))
      assert.ok(!inScope('packages/app-module-fake/src/commons/a.ts'))
      assert.ok(!inScope('packages/app-module-fake/api-backend/backend.mjs'))
    })
  })

  describe('check()', () => {
    let mod: TempModule | undefined
    afterEach(() => mod?.cleanup())

    async function run(content: string, file = 'src/backend/index.ts') {
      mod?.cleanup()
      mod = createModule({ [file]: content })
      return rule.check([mod.at(file)], {})
    }

    it('flags a raw setInterval call', async () => {
      const violations = await run('setInterval(() => {}, 1000);\n')
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /setInterval/)
    })

    it('flags raw setTimeout and addEventListener usage', async () => {
      assert.equal((await run('setTimeout(fn, 1);\n')).length, 1)
      assert.equal((await run("window.addEventListener('x', fn);\n")).length, 1)
    })

    it('does not flag moduleContext.setInterval/.on usage', async () => {
      assert.equal((await run("ctx.setInterval(() => {}, 1000);\nctx.on('y', fn);\n")).length, 0)
    })

    it('ignores test files', async () => {
      assert.equal((await run('setInterval(() => {}, 1000);\n', 'src/backend/index.test.ts')).length, 0)
    })

    it('ignores generated dist-module and .app-core-dev files', async () => {
      assert.equal((await run('setInterval(() => {}, 1000);\n', 'dist-module/api-backend/backend.mjs')).length, 0)
      assert.equal((await run('setInterval(() => {}, 1000);\n', '.app-core-dev/data/x.mjs')).length, 0)
    })
  })
})
