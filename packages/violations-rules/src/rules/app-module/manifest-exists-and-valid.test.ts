import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './manifest-exists-and-valid.js'
import { validateManifestViaAppCoreCli } from './manifest.js'

// These tests shell out to the real, globally-installed app-core-cli binary
// (not a fake/stub) to exercise the actual validate contract - see
// app-core-cli/src/validate.ts and cli.ts for the exit-code/stdio contract
// this rule depends on. If app-core-cli is not installed on the machine
// running these tests, the ok/invalid assertions are skipped explicitly
// rather than silently passing.
const appCoreCliAvailable = validateManifestViaAppCoreCli(join(tmpdir(), 'does-not-exist.json')).kind !== 'unavailable'

describe('app-module/manifest-exists-and-valid', () => {
  async function setup(): Promise<{ dir: string; packageJsonPath: string }> {
    const dir = await mkdtemp(join(tmpdir(), 'manifest-'))
    const appModuleDir = join(dir, 'packages', 'app-module-fake')
    await mkdir(appModuleDir, { recursive: true })
    const packageJsonPath = join(appModuleDir, 'package.json')
    await writeFile(packageJsonPath, '{}\n')
    return { dir, packageJsonPath }
  }

  it('flags a missing manifest.json - the real-world gap found when a module ships code with no manifest', async () => {
    const { dir, packageJsonPath } = await setup()
    try {
      const violations = await rule.check([packageJsonPath], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /missing manifest\.json/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('flags an invalid manifest.json via app-core-cli validate', { skip: !appCoreCliAvailable && 'app-core-cli not installed on this machine' }, async () => {
    const { dir, packageJsonPath } = await setup()
    try {
      const manifestPath = join(dirname(packageJsonPath), 'manifest.json')
      await writeFile(manifestPath, JSON.stringify({ version: '1.0.0', extensionPoints: [] }))
      const violations = await rule.check([packageJsonPath], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /failed validation/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('passes a real, valid manifest.json via app-core-cli validate', { skip: !appCoreCliAvailable && 'app-core-cli not installed on this machine' }, async () => {
    const { dir, packageJsonPath } = await setup()
    try {
      const manifestPath = join(dirname(packageJsonPath), 'manifest.json')
      await writeFile(manifestPath, JSON.stringify({
        version: '1.0.0',
        backendEntryPath: './api-backend/index.js',
        extensionPoints: [{ kind: 'widget', slot: 'dashboard', view: { type: 'inline', value: { $type: 'Badge', label: 'ok' } } }],
      }))
      const violations = await rule.check([packageJsonPath], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('reports "unavailable" (not a false pass/fail) when app-core-cli is not resolvable on PATH', async () => {
    const emptyBinDir = await mkdtemp(join(tmpdir(), 'empty-bin-'))
    const originalPath = process.env.PATH
    process.env.PATH = emptyBinDir
    try {
      const result = validateManifestViaAppCoreCli(join(tmpdir(), 'whatever.json'))
      assert.equal(result.kind, 'unavailable')
    } finally {
      process.env.PATH = originalPath
      await rm(emptyBinDir, { recursive: true })
    }
  })
})
