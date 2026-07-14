import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-raw-exception.js'
import { runFixtureSuiteInline } from '../test-utils/fixture-runner.js'

describe('cs/no-raw-exception', () => {
  runFixtureSuiteInline(rule, import.meta.url, 'no-raw-exception')

  it('fires with custom bannedTypes config', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vtest-'))
    try {
      const file = join(dir, 'Foo.cs')
      writeFileSync(file, 'throw new MyException("oops");\n')
      const violations = await rule.check([file], { bannedTypes: ['MyException'] })
      assert.equal(violations.length, 1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
