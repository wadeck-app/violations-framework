import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './naming-convention.js'

describe('app-module/naming-convention', () => {
  async function manifestAt(dir: string, packageDirName: string): Promise<string> {
    const packageDir = join(dir, 'packages', packageDirName)
    await mkdir(packageDir, { recursive: true })
    const manifestPath = join(packageDir, 'manifest.json')
    await writeFile(manifestPath, '{}\n')
    return manifestPath
  }

  it('passes a correctly prefixed name', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'naming-'))
    try {
      const manifestPath = await manifestAt(dir, 'app-module-queue')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('rejects a bare "app-module" with no suffix', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'naming-'))
    try {
      const manifestPath = await manifestAt(dir, 'app-module')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /must be named "app-module-<name>"/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('rejects an unrelated name entirely', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'naming-'))
    try {
      const manifestPath = await manifestAt(dir, 'queue-module')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('rejects suffix-style naming (queue-app-module)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'naming-'))
    try {
      const manifestPath = await manifestAt(dir, 'queue-app-module')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
