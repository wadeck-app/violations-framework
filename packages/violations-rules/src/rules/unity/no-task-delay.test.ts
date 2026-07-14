import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-task-delay.js'
import { runFixtureSuiteInline } from '../test-utils/fixture-runner.js'

describe('unity/no-task-delay', () => {
  runFixtureSuiteInline(rule, import.meta.url, 'no-task-delay')

  it('fires on extraBannedMethods', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vtest-'))
    try {
      const file = join(dir, 'Foo.cs')
      writeFileSync(file, 'DelayerHelper.Delay(500);\n')
      const violations = await rule.check([file], { extraBannedMethods: ['DelayerHelper.Delay'] })
      assert.equal(violations.length, 1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('does not fire on extraBannedMethods when not in code', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vtest-'))
    try {
      const file = join(dir, 'Foo.cs')
      writeFileSync(file, 'SomeOtherHelper.DoStuff();\n')
      const violations = await rule.check([file], { extraBannedMethods: ['DelayerHelper.Delay'] })
      assert.equal(violations.length, 0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
