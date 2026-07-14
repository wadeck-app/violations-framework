import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-async-lambda-into-syncrunner.js'

describe('unity/no-async-lambda-into-syncrunner', () => {
  async function check(code: string) {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const file = join(dir, 'Foo.cs')
      await writeFile(file, code)
      return rule.check([file], {})
    } finally {
      await rm(dir, { recursive: true })
    }
  }

  it('fires on RunSync += async on same line', async () => {
    const violations = await check('RunSync += async () => { await Task.Yield(); };\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('fires on RunSync += wrapped async on next line', async () => {
    const violations = await check('RunSync +=\n    async () => { await Task.Yield(); };\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('does not fire on RunAsync += async', async () => {
    const violations = await check('RunAsync += async () => { await Task.Yield(); };\n')
    assert.equal(violations.length, 0)
  })

  it('skips files under _generated/', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const genDir = join(dir, '_generated')
      await import('node:fs').then(fs => fs.promises.mkdir(genDir))
      const file = join(genDir, 'Foo.cs')
      await writeFile(file, 'RunSync += async () => {};\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
