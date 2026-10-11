import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ManifestValidationError, parseManifest } from './manifest.js'

describe('app-module manifest helper', () => {
  it('parses a valid manifest', () => {
    const manifest = parseManifest({
      version: '1.0.0',
      backendEntryPath: './api-backend/index.js',
      extensionPoints: [{ kind: 'page', slot: 'nav', view: { type: 'path', value: './dsl-frontend/page.yaml' } }],
    })
    assert.equal(manifest.version, '1.0.0')
    assert.equal(manifest.extensionPoints.length, 1)
  })

  it('rejects a non-object manifest', () => {
    assert.throws(() => parseManifest(null), ManifestValidationError)
    assert.throws(() => parseManifest('nope'), ManifestValidationError)
  })

  it('rejects a manifest missing backendEntryPath', () => {
    assert.throws(
      () => parseManifest({ version: '1.0.0', extensionPoints: [] }),
      /backendEntryPath/,
    )
  })

  it('rejects an extensionPoint with an invalid view type', () => {
    assert.throws(
      () => parseManifest({
        version: '1.0.0',
        backendEntryPath: './api-backend/index.js',
        extensionPoints: [{ kind: 'page', slot: 'nav', view: { type: 'bogus' } }],
      }),
      /view\.type/,
    )
  })

  it('rejects a "path" view with a non-string value', () => {
    assert.throws(
      () => parseManifest({
        version: '1.0.0',
        backendEntryPath: './api-backend/index.js',
        extensionPoints: [{ kind: 'page', slot: 'nav', view: { type: 'path', value: 42 } }],
      }),
      /view\.value/,
    )
  })
})
