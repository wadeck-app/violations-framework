import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateSourceManifest, viewContentProblem } from './source-manifest.js'

const ep = { kind: 'page', slot: 'nav', label: 'X', view: { type: 'path', value: './src/dsl-views/a.yaml' } }

function issuesOf(raw: unknown): string[] {
  const result = validateSourceManifest(raw)
  return result.ok ? [] : result.issues
}

describe('app-module/source-manifest validator', () => {
  it('accepts a minimal manifest and returns the parsed shape', () => {
    const result = validateSourceManifest({ id: 'queue', extensionPoints: [ep] })
    assert.ok(result.ok)
    assert.equal(result.ok && result.manifest.id, 'queue')
  })

  it('rejects a non-object root, missing id, empty extensionPoints', () => {
    assert.deepEqual(issuesOf([]), ['(root): must be a JSON object'])
    assert.match(issuesOf({ extensionPoints: [ep] }).join(), /id: required string/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [] }).join(), /extensionPoints: must be an array/)
  })

  it('rejects output-only and unknown keys', () => {
    const issues = issuesOf({ id: 'a', extensionPoints: [ep], version: '1', backendEntryPath: 'x' })
    assert.equal(issues.length, 2)
  })

  it('validates slots: shell slots and <providerId>:<local> pass, others fail', () => {
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [{ ...ep, slot: 'dashboard' }, { ...ep, slot: 'prov:thing' }] }), [])
    assert.match(issuesOf({ id: 'a', extensionPoints: [{ ...ep, slot: 'custom' }] }).join(), /not a shell slot/)
  })

  it('validates the page path: only kind page, and a route-like shape', () => {
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [{ ...ep, path: '/jobs/:id' }] }), [])
    assert.match(issuesOf({ id: 'a', extensionPoints: [{ ...ep, path: 'jobs' }] }).join(), /must look like/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [{ ...ep, kind: 'widget', path: '/x' }] }).join(), /only valid on extension points of kind "page"/)
  })

  it('validates dslLib, requires, expose and lifecycle', () => {
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [ep], dslLib: { shared: { react: '^19' } }, requires: { b: '^1' }, expose: { types: './src/commons/t.ts', slots: { s: { accepts: ['Badge'] } } }, lifecycle: { teardown: './src/backend/t.ts' } }), [])
    assert.match(issuesOf({ id: 'a', extensionPoints: [ep], dslLib: { entry: 'x' } }).join(), /unrecognized key "entry"/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [ep], requires: { 'bad id': '^1' } }).join(), /module id must/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [ep], expose: { slots: { s: { accepts: [] } } } }).join(), /accepts/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [ep], lifecycle: { start: 'x' } }).join(), /unrecognized key "start"/)
  })
})

describe('app-module/source-manifest side menu contributions', () => {
  const menuEp = { kind: 'page', slot: 'flow:nav', label: 'Chart', path: '/chart', view: ep.view }

  it('accepts a complete "<providerId>:nav" contribution', () => {
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [menuEp] }), [])
  })

  it('requires kind page, a non-blank label and a static path', () => {
    assert.match(issuesOf({ id: 'a', extensionPoints: [{ ...menuEp, kind: 'widget', path: undefined }] }).join(), /kind: .*must be "page" \(got "widget"\)/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [{ ...menuEp, label: '  ' }] }).join(), /label: .*add a "label"/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [{ ...menuEp, label: undefined }] }).join(), /label: .*add a "label"/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [{ ...menuEp, path: undefined }] }).join(), /path: .*add a "path"/)
    assert.match(issuesOf({ id: 'a', extensionPoints: [{ ...menuEp, path: '/jobs/:id' }] }).join(), /path: .*":param" segment/)
  })

  it('does not apply to the shell nav slot or to other custom slots', () => {
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [{ kind: 'widget', slot: 'flow:other', view: ep.view }] }), [])
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [{ kind: 'page', slot: 'nav', view: ep.view }] }), [])
  })

  it('reserves "nav" as an expose.slots name', () => {
    assert.match(
      issuesOf({ id: 'a', extensionPoints: [ep], expose: { slots: { nav: { accepts: ['Badge'] } } } }).join(),
      /slot name "nav" is reserved/,
    )
  })
})

describe('app-module/source-manifest showInNav', () => {
  it('accepts a boolean showInNav', () => {
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [ep], showInNav: false }), [])
    assert.deepEqual(issuesOf({ id: 'a', extensionPoints: [ep], showInNav: true }), [])
  })

  it('rejects a non-boolean showInNav with a message naming the field', () => {
    for (const value of ['false', 0, null]) {
      assert.match(issuesOf({ id: 'a', extensionPoints: [ep], showInNav: value }).join(), /showInNav: must be a boolean/, JSON.stringify(value))
    }
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
