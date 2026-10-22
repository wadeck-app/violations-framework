import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SourceManifestSchema } from '@wadeck-app/app-core-sdk'
import { validateSourceManifest, viewContentProblem } from './source-manifest.js'

const ep = { kind: 'page', slot: 'nav', label: 'X', view: { type: 'path', value: './src/dsl-views/a.yaml' } }

function issuesOf(raw: unknown): string[] {
  const result = validateSourceManifest(raw)
  return result.ok ? [] : result.issues
}

// The rules themselves live in app-core's SourceManifestSchema; these tests only pin the adapter:
// a valid manifest passes, and an invalid one reports what the SDK reports, as "<path>: <message>".
describe('app-module/source-manifest adapter (app-core SDK schema)', () => {
  it('accepts a minimal manifest and returns the narrowed shape', () => {
    const result = validateSourceManifest({ id: 'queue', extensionPoints: [ep] })
    assert.ok(result.ok)
    assert.equal(result.ok && result.manifest.id, 'queue')
    assert.equal(result.ok && result.manifest.dslLib, undefined)
  })

  it('returns dslLib.shared when the manifest declares dslLib', () => {
    const result = validateSourceManifest({ id: 'queue', extensionPoints: [ep], dslLib: { shared: { react: '^19' } } })
    assert.ok(result.ok)
    assert.deepEqual(result.ok && result.manifest.dslLib, { shared: { react: '^19' } })
  })

  it('reports exactly the SDK issues, each as "<path>: <message>" ("(root)" when the path is empty)', () => {
    const invalid: unknown[] = [[], { extensionPoints: [ep] }, { id: 'a', extensionPoints: [ep], version: '1' }, { id: 'a', extensionPoints: [{ ...ep, slot: 'custom' }] }]
    for (const raw of invalid) {
      const parsed = SourceManifestSchema.safeParse(raw)
      assert.ok(!parsed.success, JSON.stringify(raw))
      const expected = parsed.error.issues.map((issue) => `${issue.path.length === 0 ? '(root)' : issue.path.join('.')}: ${issue.message}`)
      assert.deepEqual(issuesOf(raw), expected, JSON.stringify(raw))
    }
  })

  // Guards against a stale SDK: these are the app-core rules this package relied on when it was hand-written.
  it('applies the app-core rules the previous hand-written port mirrored', () => {
    const view = ep.view
    const bad: Record<string, unknown> = {
      'non-boolean showInNav': { id: 'a', extensionPoints: [ep], showInNav: 'false' },
      'blank title': { id: 'a', extensionPoints: [ep], title: '   ' },
      'menu page without a label': { id: 'a', extensionPoints: [{ kind: 'page', slot: 'flow:nav', path: '/x', view }] },
      'menu page with a :param path': { id: 'a', extensionPoints: [{ kind: 'page', slot: 'flow:nav', label: 'X', path: '/x/:id', view }] },
      'reserved expose slot "nav"': { id: 'a', extensionPoints: [ep], expose: { slots: { nav: { accepts: ['Badge'] } } } },
      'width on a non-dashboard extension point': { id: 'a', extensionPoints: [{ ...ep, width: 2 }] },
      'width above 4': { id: 'a', extensionPoints: [{ kind: 'widget', slot: 'dashboard', view, width: 5 }] },
    }
    for (const [name, raw] of Object.entries(bad)) {
      assert.ok(issuesOf(raw).length > 0, `${name} should be rejected`)
    }
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [{ kind: 'widget', slot: 'dashboard', view, width: 4, height: 1 }], showInNav: false, title: 'Billing' }), [])
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
