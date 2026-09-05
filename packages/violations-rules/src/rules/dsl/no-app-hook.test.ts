import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-app-hook.js'

describe('dsl/no-app-hook', () => {
  async function withAppFile(content: string): Promise<[string, () => Promise<void>]> {
    const dir = await mkdtemp(join(tmpdir(), 'no-app-hook-'))
    const srcDir = join(dir, 'packages', 'orch-app', 'src')
    await mkdir(srcDir, { recursive: true })
    const file = join(srcDir, 'hooks.ts')
    await writeFile(file, content)
    return [file, () => rm(dir, { recursive: true })]
  }

  it('flags an exported function hook', async () => {
    const [file, cleanup] = await withAppFile('export function useMyData() { return null }')
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /useMyData/)
    } finally {
      await cleanup()
    }
  })

  it('flags an exported const arrow hook', async () => {
    const [file, cleanup] = await withAppFile('export const useCounter = () => 0')
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /useCounter/)
    } finally {
      await cleanup()
    }
  })

  it('does not flag a non-exported hook', async () => {
    const [file, cleanup] = await withAppFile('function useInternal() { return null }')
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('does not flag an exported non-hook function', async () => {
    const [file, cleanup] = await withAppFile('export function fetchData() { return null }')
    try {
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await cleanup()
    }
  })

  it('returns empty array when files list is empty', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
