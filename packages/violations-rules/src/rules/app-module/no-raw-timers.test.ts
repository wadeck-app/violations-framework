import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-raw-timers.js'

describe('app-module/no-raw-timers', () => {
  it('has the correct rule id and severity', () => {
    assert.equal(rule.id, 'app-module/no-raw-timers')
    assert.equal(rule.defaultSeverity, 'error')
  })

  it('scopes itself to packages/app-module-*/api-backend/** (not browser bundles like dsl-lib/)', () => {
    assert.ok(rule.defaultScope.length > 0)
    assert.ok(rule.defaultScope.every((p) => p.includes('packages/app-module-*/api-backend/')))
  })

  describe('check()', () => {
    async function setup(): Promise<{ dir: string; file: string }> {
      const dir = await mkdtemp(join(tmpdir(), 'app-module-timers-'))
      const appModuleDir = join(dir, 'packages', 'app-module-fake', 'src')
      await mkdir(appModuleDir, { recursive: true })
      return { dir, file: join(appModuleDir, 'backend.ts') }
    }

    it('flags a raw setInterval call', async () => {
      const { dir, file } = await setup()
      try {
        await writeFile(file, 'setInterval(() => {}, 1000);\n')
        const violations = await rule.check([file], {})
        assert.equal(violations.length, 1)
        assert.match(violations[0].message, /setInterval/)
      } finally {
        await rm(dir, { recursive: true })
      }
    })

    it('flags raw addEventListener usage', async () => {
      const { dir, file } = await setup()
      try {
        await writeFile(file, "window.addEventListener('x', fn);\n")
        const violations = await rule.check([file], {})
        assert.equal(violations.length, 1)
      } finally {
        await rm(dir, { recursive: true })
      }
    })

    it('does not flag moduleContext.setInterval/.on usage', async () => {
      const { dir, file } = await setup()
      try {
        await writeFile(file, "ctx.setInterval(() => {}, 1000);\nctx.on('y', fn);\n")
        const violations = await rule.check([file], {})
        assert.equal(violations.length, 0)
      } finally {
        await rm(dir, { recursive: true })
      }
    })

    it('ignores test files', async () => {
      const { dir, file } = await setup()
      try {
        const testFile = file.replace('.ts', '.test.ts')
        await writeFile(testFile, 'setInterval(() => {}, 1000);\n')
        const violations = await rule.check([testFile], {})
        assert.equal(violations.length, 0)
      } finally {
        await rm(dir, { recursive: true })
      }
    })
  })
})
