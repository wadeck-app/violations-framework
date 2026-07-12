import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-task-delay.js'

describe('unity/no-task-delay', () => {
  async function check(code: string, config = {}) {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const file = join(dir, 'Foo.cs')
      await writeFile(file, code)
      return rule.check([file], config)
    } finally {
      await rm(dir, { recursive: true })
    }
  }

  it('fires on await Task.Delay', async () => {
    const violations = await check('await Task.Delay(1000);\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('does not fire on commented Task.Delay', async () => {
    const violations = await check('// await Task.Delay(1000);\n')
    assert.equal(violations.length, 0)
  })

  it('fires on extraBannedMethods', async () => {
    const violations = await check('DelayerHelper.Delay(500);\n', { extraBannedMethods: ['DelayerHelper.Delay'] })
    assert.equal(violations.length, 1)
  })

  it('does not fire on extraBannedMethods when not in code', async () => {
    const violations = await check('SomeOtherHelper.DoStuff();\n', { extraBannedMethods: ['DelayerHelper.Delay'] })
    assert.equal(violations.length, 0)
  })
})
