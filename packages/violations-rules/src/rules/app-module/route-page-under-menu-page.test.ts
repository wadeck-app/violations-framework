import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './route-page-under-menu-page.js'
import { createModule, type TempModule } from '../test-utils/app-module-fixtures.js'

type Page = { slot: string; path?: string }

function manifestOf(pages: Page[]): string {
  return JSON.stringify({
    id: 'fixture',
    extensionPoints: pages.map((p) => ({ kind: 'page', label: 'X', view: { type: 'path', value: './src/dsl-views/page.yaml' }, ...p })),
  })
}

describe('app-module/route-page-under-menu-page', () => {
  let mod: TempModule | undefined
  afterEach(() => mod?.cleanup())

  async function run(pages: Page[] | string) {
    mod?.cleanup()
    mod = createModule({ 'manifest.json': typeof pages === 'string' ? pages : manifestOf(pages) })
    return rule.check([mod.at('manifest.json')], {})
  }

  it('flags a detail route next to a home-only menu (the project bug: nav "/" + route /p/:project)', async () => {
    const violations = await run([{ slot: 'nav', path: '/' }, { slot: 'route', path: '/p/:project' }])
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /route page \/p\/:project highlights no menu entry/)
    assert.match(violations[0].message, /nav \/projects, route \/projects\/:project/)
  })

  it('flags a home route "/" when no nav page is "/" and says to add one (moving it under a menu page is impossible)', async () => {
    const violations = await run([{ slot: 'route', path: '/' }, { slot: 'nav', path: '/jobs' }])
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /add a nav page with path "\/"/)
  })

  it('passes a home route "/" when a nav page is "/"', async () => {
    assert.equal((await run([{ slot: 'nav', path: '/' }, { slot: 'route', path: '/' }])).length, 0)
  })

  it('flags a route under no menu page when other menu pages exist', async () => {
    const violations = await run([{ slot: 'nav', path: '/' }, { slot: 'nav', path: '/schedule' }, { slot: 'route', path: '/jobs/:id' }])
    assert.equal(violations.length, 1)
  })

  it('reports each unhighlighted route', async () => {
    const violations = await run([{ slot: 'nav', path: '/' }, { slot: 'route', path: '/jobs/new' }, { slot: 'route', path: '/jobs/:id/edit' }])
    assert.equal(violations.length, 2)
  })

  it('passes a route under a non-home menu page', async () => {
    assert.equal((await run([{ slot: 'nav', path: '/projects' }, { slot: 'route', path: '/projects/:project' }])).length, 0)
  })

  it('passes a route equal to a menu page path', async () => {
    assert.equal((await run([{ slot: 'nav', path: '/' }, { slot: 'nav', path: '/jobs' }, { slot: 'route', path: '/jobs' }])).length, 0)
  })

  it('does not match on a partial segment (/job is not a prefix of /jobs/1)', async () => {
    assert.equal((await run([{ slot: 'nav', path: '/job' }, { slot: 'route', path: '/jobs/1' }])).length, 1)
  })

  it('treats params as any value', async () => {
    assert.equal((await run([{ slot: 'nav', path: '/:tenant/jobs' }, { slot: 'route', path: '/acme/jobs/1' }])).length, 0)
    assert.equal((await run([{ slot: 'nav', path: '/jobs' }, { slot: 'route', path: '/:area/x' }])).length, 0)
    assert.equal((await run([{ slot: 'nav', path: '/:tenant/jobs' }, { slot: 'route', path: '/acme/other/1' }])).length, 1)
  })

  it('ignores a trailing slash', async () => {
    assert.equal((await run([{ slot: 'nav', path: '/jobs/' }, { slot: 'route', path: '/jobs/1' }])).length, 0)
  })

  it('does not flag a module with no nav page', async () => {
    assert.equal((await run([{ slot: 'route', path: '/anything' }])).length, 0)
  })

  it('ignores pages in a custom slot (only slot "route" is routed) and path-less nav pages', async () => {
    assert.equal((await run([{ slot: 'nav', path: '/projects' }, { slot: 'other:slot', path: '/settings' }])).length, 0)
    assert.equal((await run([{ slot: 'nav' }, { slot: 'route', path: '/a/:id' }])).length, 1)
  })

  it('does not flag nav pages themselves', async () => {
    assert.equal((await run([{ slot: 'nav', path: '/' }, { slot: 'nav', path: '/other' }])).length, 0)
  })

  it('skips malformed manifests (left to manifest-exists-and-valid / app-core-sdk/manifest-valid)', async () => {
    for (const raw of ['{nope', '[]', '{"id":"x"}', '{"extensionPoints":[null,1,{"kind":"page"}]}']) {
      assert.deepEqual(await run(raw), [], raw)
    }
  })

  it('ignores a manifest outside an app-module-* folder', async () => {
    mod?.cleanup()
    mod = createModule({ 'manifest.json': manifestOf([{ slot: 'nav', path: '/' }, { slot: 'route', path: '/p/:id' }]) }, 'other-package')
    assert.deepEqual(await rule.check([mod.at('manifest.json')], {}), [])
  })
})
