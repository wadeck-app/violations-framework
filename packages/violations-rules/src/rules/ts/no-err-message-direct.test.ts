import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-err-message-direct.js'

describe('ts/no-err-message-direct', () => {
  it('fires on err.message in catch block', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-err-message-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, 'catch (err) { console.log(err.message) }\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /getErrorMessage/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on comment lines containing err.message', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-err-message-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, '// err.message is forbidden here\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on files ending with utils/errors.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-err-message-'))
    try {
      const { mkdir } = await import('node:fs/promises')
      await mkdir(join(dir, 'utils'), { recursive: true })
      const file = join(dir, 'utils', 'errors.ts')
      await writeFile(file, 'return err.message\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on files ending with src/errors.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-err-message-'))
    try {
      const { mkdir } = await import('node:fs/promises')
      await mkdir(join(dir, 'src'), { recursive: true })
      const file = join(dir, 'src', 'errors.ts')
      await writeFile(file, 'return error.message\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
