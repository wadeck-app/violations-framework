import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hasDefaultExport, importSpecifiers, isExcludedPath, isNodeSpecifier, isReactSpecifier, moduleRootOf, moduleRootOfRootFile, srcFolderOf } from './layout.js'

describe('app-module/layout helpers', () => {
  it('moduleRootOf finds the nearest app-module-* ancestor, with Windows separators too', () => {
    assert.equal(moduleRootOf('/repo/packages/app-module-queue/src/backend/index.ts'), '/repo/packages/app-module-queue')
    assert.equal(moduleRootOf('C:\\repo\\packages\\app-module-queue\\manifest.json'), 'C:/repo/packages/app-module-queue')
    assert.equal(moduleRootOf('/repo/packages/other/src/a.ts'), undefined)
  })

  it('excludes dist-module, .app-core-dev, node_modules and .check-out by default', () => {
    for (const folder of ['dist-module', '.app-core-dev', 'node_modules', '.check-out']) {
      const file = `/repo/packages/app-module-queue/${folder}/x/manifest.json`
      assert.ok(isExcludedPath(file), folder)
      assert.equal(moduleRootOf(file), undefined, folder)
    }
    assert.ok(!isExcludedPath('/repo/packages/app-module-queue/src/backend/index.ts'))
  })

  it('moduleRootOfRootFile only accepts files directly in the module root', () => {
    assert.equal(moduleRootOfRootFile('/r/app-module-a/manifest.json'), '/r/app-module-a')
    assert.equal(moduleRootOfRootFile('/r/app-module-a/src/manifest.json'), undefined)
  })

  it('srcFolderOf maps a path to its source folder', () => {
    assert.equal(srcFolderOf('/r/app-module-a', '/r/app-module-a/src/commons/x.ts'), 'commons')
    assert.equal(srcFolderOf('/r/app-module-a', '/r/app-module-a/src/utils/x.ts'), undefined)
    assert.equal(srcFolderOf('/r/app-module-a', '/r/app-module-a/src/backend'), 'backend')
  })

  it('classifies react and node specifiers', () => {
    assert.ok(isReactSpecifier('react') && isReactSpecifier('react-dom/client') && isReactSpecifier('react/jsx-runtime'))
    assert.ok(!isReactSpecifier('react-query'))
    assert.ok(isNodeSpecifier('node:fs') && isNodeSpecifier('fs/promises') && isNodeSpecifier('path'))
    assert.ok(!isNodeSpecifier('lodash'))
  })

  it('importSpecifiers reads static, side-effect, dynamic and re-export forms, not types or comments', () => {
    const source = "import a from 'a'\nimport 'b'\nconst c = await import('c')\nexport * from 'd'\nimport type { X } from 'e'\n// import f from 'f'\nconst url = 'http://x.y'\n"
    assert.deepEqual(importSpecifiers(source).map((i) => i.spec).sort(), ['a', 'b', 'c', 'd'])
  })

  it('hasDefaultExport ignores commented-out exports', () => {
    assert.ok(hasDefaultExport('export default function () {}'))
    assert.ok(hasDefaultExport('export { run as default }'))
    assert.ok(!hasDefaultExport('// export default 1\nexport const a = 1'))
  })
})
