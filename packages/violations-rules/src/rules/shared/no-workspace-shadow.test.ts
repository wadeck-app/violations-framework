import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-workspace-shadow.js'

async function setupWorkspace(root: string) {
  await mkdir(join(root, 'packages', 'pkg-a'), { recursive: true })
  await mkdir(join(root, 'packages', 'pkg-b'), { recursive: true })
  await writeFile(join(root, 'packages', 'pkg-a', 'package.json'), JSON.stringify({ name: 'pkg-a', version: '1.0.0' }))
  await writeFile(join(root, 'packages', 'pkg-b', 'package.json'), JSON.stringify({ name: 'pkg-b', version: '1.0.0' }))
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'root', workspaces: ['packages/*'] }))
  return join(root, 'package.json')
}

describe('shared/no-workspace-shadow', () => {
  it('fires when a workspace package is shadowed by a real directory in node_modules', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ws-shadow-'))
    try {
      const rootPkg = await setupWorkspace(dir)
      const shadowDir = join(dir, 'packages', 'pkg-b', 'node_modules', 'pkg-a')
      await mkdir(shadowDir, { recursive: true })
      await writeFile(join(shadowDir, 'package.json'), JSON.stringify({ name: 'pkg-a', version: '1.2.0' }))

      const violations = await rule.check([rootPkg], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /pkg-a/)
      assert.match(violations[0].message, /shadowed/)
      assert.match(violations[0].message, /rm -rf/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when the node_modules entry is a symlink (legitimate workspace link)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ws-shadow-'))
    try {
      const rootPkg = await setupWorkspace(dir)
      const nmDir = join(dir, 'packages', 'pkg-b', 'node_modules')
      await mkdir(nmDir, { recursive: true })
      const target = join(dir, 'packages', 'pkg-a')
      try {
        await symlink(target, join(nmDir, 'pkg-a'))
      } catch (e) {
        // Windows requires elevated privileges or Developer Mode for symlinks - skip
        const code = (e as NodeJS.ErrnoException).code
        if (code === 'EPERM' || code === 'EACCES') return
        throw e
      }
      const violations = await rule.check([rootPkg], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when no shadow exists', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ws-shadow-'))
    try {
      const rootPkg = await setupWorkspace(dir)
      const violations = await rule.check([rootPkg], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('skips non-workspace package.json files silently', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ws-shadow-'))
    try {
      const pkgFile = join(dir, 'package.json')
      await writeFile(pkgFile, JSON.stringify({ name: 'just-a-lib', version: '1.0.0' }))
      const violations = await rule.check([pkgFile], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty for empty file list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
