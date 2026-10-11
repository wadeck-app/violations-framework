import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './backend-entry-location.js'
import { validateManifestViaAppCoreCli } from './manifest.js'

// This rule's violations only surface once app-core-cli parses the manifest
// (result.kind === 'ok') - if the binary isn't installed on the machine
// running these tests, skip explicitly rather than silently passing.
const appCoreCliAvailable = validateManifestViaAppCoreCli(join(tmpdir(), 'does-not-exist.json')).kind !== 'unavailable'

describe('app-module/backend-entry-location', () => {
  async function setup(): Promise<{ dir: string; manifestPath: string }> {
    const dir = await mkdtemp(join(tmpdir(), 'backend-loc-'))
    const appModuleDir = join(dir, 'packages', 'app-module-fake')
    await mkdir(appModuleDir, { recursive: true })
    return { dir, manifestPath: join(appModuleDir, 'manifest.json') }
  }

  async function writeManifest(manifestPath: string, backendEntryPath: string): Promise<void> {
    await writeFile(manifestPath, JSON.stringify({
      version: '1.0.0',
      backendEntryPath,
      extensionPoints: [{ kind: 'widget', slot: 'dashboard', view: { type: 'inline', value: { $type: 'Badge', label: 'ok' } } }],
    }))
  }

  it('flags a backendEntryPath outside api-backend/', { skip: !appCoreCliAvailable && 'app-core-cli not installed on this machine' }, async () => {
    const { dir, manifestPath } = await setup()
    try {
      await writeManifest(manifestPath, './backend.js')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /api-backend\//)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not flag a backendEntryPath inside api-backend/', async () => {
    const { dir, manifestPath } = await setup()
    try {
      await writeManifest(manifestPath, './api-backend/index.js')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('rejects a sneaky look-alike folder (api-backend-fake/) via proper path containment', { skip: !appCoreCliAvailable && 'app-core-cli not installed on this machine' }, async () => {
    const { dir, manifestPath } = await setup()
    try {
      await writeManifest(manifestPath, './api-backend-fake/index.js')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
