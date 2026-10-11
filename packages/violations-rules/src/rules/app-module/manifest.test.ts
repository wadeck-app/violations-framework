import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { validateManifestViaAppCoreCli } from './manifest.js'

// Shells out to the real, globally-installed app-core-cli binary (not a
// fake/stub) - see manifest-exists-and-valid.test.ts for why. If app-core-cli
// is not installed on the machine running these tests, the ok/invalid
// assertions are skipped explicitly rather than silently passing.
const appCoreCliAvailable = validateManifestViaAppCoreCli(join(tmpdir(), 'does-not-exist.json')).kind !== 'unavailable'

describe('app-module manifest helper', () => {
  it('parses a valid manifest via app-core-cli validate --json', { skip: !appCoreCliAvailable && 'app-core-cli not installed on this machine' }, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'manifest-helper-'))
    try {
      const manifestPath = join(dir, 'manifest.json')
      await writeFile(manifestPath, JSON.stringify({
        version: '1.0.0',
        backendEntryPath: './api-backend/index.js',
        extensionPoints: [{ kind: 'page', slot: 'nav', view: { type: 'path', value: './dsl-frontend/page.yaml' } }],
      }))
      const result = validateManifestViaAppCoreCli(manifestPath)
      assert.equal(result.kind, 'ok')
      if (result.kind === 'ok') {
        assert.equal(result.manifest.version, '1.0.0')
        assert.equal(result.manifest.extensionPoints.length, 1)
      }
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('reports "invalid" with app-core-cli\'s own error message for a bad manifest', { skip: !appCoreCliAvailable && 'app-core-cli not installed on this machine' }, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'manifest-helper-'))
    try {
      const manifestPath = join(dir, 'manifest.json')
      await writeFile(manifestPath, JSON.stringify({ version: '1.0.0', extensionPoints: [] }))
      const result = validateManifestViaAppCoreCli(manifestPath)
      assert.equal(result.kind, 'invalid')
      if (result.kind === 'invalid') {
        assert.match(result.message, /backendEntryPath/)
      }
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
