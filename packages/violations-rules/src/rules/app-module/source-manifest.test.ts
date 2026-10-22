import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readManifestShape, viewContentProblem } from './source-manifest.js'

// Schema validation is app-core's job (app-core-sdk/manifest-valid); this reader only has to be lenient.
describe('app-module/source-manifest readManifestShape', () => {
  it('returns undefined when the root is not a JSON object', () => {
    for (const raw of [[], null, 'x', 3]) {
      assert.equal(readManifestShape(raw), undefined, JSON.stringify(raw))
    }
  })

  it('reads the views of extension points and keeps their original index', () => {
    const shape = readManifestShape({
      id: 'a',
      extensionPoints: [{ view: { type: 'inline', value: {} } }, 'garbage', { view: { type: 'path', value: './src/dsl-views/a.yaml' } }],
    })
    assert.deepEqual(shape?.views, [
      { index: 0, type: 'inline', value: {} },
      { index: 2, type: 'path', value: './src/dsl-views/a.yaml' },
    ])
  })

  it('skips malformed entries instead of failing (schema errors belong to app-core)', () => {
    const shape = readManifestShape({ extensionPoints: [{ view: 3 }, { view: { type: 4 } }, null] })
    assert.deepEqual(shape, { views: [], hasDslLib: false })
    assert.deepEqual(readManifestShape({ extensionPoints: 'nope' }), { views: [], hasDslLib: false })
  })

  it('reports whether dslLib is declared', () => {
    assert.equal(readManifestShape({ dslLib: { shared: {} } })?.hasDslLib, true)
    assert.equal(readManifestShape({ id: 'a' })?.hasDslLib, false)
  })
})

describe('app-module/source-manifest viewContentProblem', () => {
  it('accepts YAML mappings (block, quoted key, flow) and JSON objects', () => {
    assert.equal(viewContentProblem('a.yaml', '$type: Badge\n'), undefined)
    assert.equal(viewContentProblem('a.yaml', '"$type": Badge\n'), undefined)
    assert.equal(viewContentProblem('a.yml', '{ $type: Badge }\n'), undefined)
    assert.equal(viewContentProblem('a.json', '{"$type":"Badge"}'), undefined)
  })

  it('rejects empty files, sequences, scalars and non-object JSON', () => {
    for (const text of ['', '# only a comment\n', '- a\n', '[a]\n', 'plain\n']) {
      assert.ok(viewContentProblem('a.yaml', text), JSON.stringify(text))
    }
    assert.ok(viewContentProblem('a.json', '[]'))
    assert.match(viewContentProblem('a.json', '{') ?? '', /not valid JSON/)
  })
})
