import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './daemon-spawn-no-windows-hide.js'

describe('cli/daemon-spawn-no-windows-hide', () => {
  it('fires when detached:true is present without windowsHide', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'spawn-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
const child = spawn(process.execPath, [script], {
  detached: true,
  stdio: 'ignore',
  env: { ...process.env },
})
child.unref()
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /windowsHide/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when windowsHide:true is present alongside detached:true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'spawn-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
const child = spawn(process.execPath, [script], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
  env: { ...process.env },
})
child.unref()
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when detached:true is absent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'spawn-test-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, `
const child = spawn(process.execPath, [script], {
  stdio: 'inherit',
})
`)
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
