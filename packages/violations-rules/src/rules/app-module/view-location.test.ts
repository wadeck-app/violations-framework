import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './view-location.js'

describe('app-module/view-location', () => {
  async function setup(): Promise<{ dir: string; manifestPath: string }> {
    const dir = await mkdtemp(join(tmpdir(), 'view-loc-'))
    const appModuleDir = join(dir, 'packages', 'app-module-fake')
    await mkdir(appModuleDir, { recursive: true })
    return { dir, manifestPath: join(appModuleDir, 'manifest.json') }
  }

  async function writeManifest(manifestPath: string, viewPath: string): Promise<void> {
    await writeFile(manifestPath, JSON.stringify({
      version: '1.0.0',
      backendEntryPath: './api-backend/index.js',
      extensionPoints: [{ kind: 'page', slot: 'nav', view: { type: 'path', value: viewPath } }],
    }))
  }

  it('flags a view path outside dsl-frontend/', async () => {
    const { dir, manifestPath } = await setup()
    try {
      await writeManifest(manifestPath, './page.yaml')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /dsl-frontend\//)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not flag a view path inside dsl-frontend/', async () => {
    const { dir, manifestPath } = await setup()
    try {
      await writeManifest(manifestPath, './dsl-frontend/page.yaml')
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('ignores inline views (no path to check)', async () => {
    const { dir, manifestPath } = await setup()
    try {
      await writeFile(manifestPath, JSON.stringify({
        version: '1.0.0',
        backendEntryPath: './api-backend/index.js',
        extensionPoints: [{ kind: 'widget', slot: 'dashboard', view: { type: 'inline', value: { $type: 'Badge', label: 'ok' } } }],
      }))
      const violations = await rule.check([manifestPath], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
