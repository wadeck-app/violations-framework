import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rule } from './no-react.js'
import { createModule, type TempModule } from '../test-utils/app-module-fixtures.js'

describe('app-module/no-react', () => {
  let mod: TempModule | undefined
  afterEach(() => mod?.cleanup())

  async function run(files: Record<string, string>) {
    mod?.cleanup()
    mod = createModule(files)
    const created = mod
    return rule.check(Object.keys(files).map((f) => created.at(f)), {})
  }

  it('allows .tsx and react in src/dsl-components', async () => {
    const violations = await run({ 'src/dsl-components/Card.tsx': "import { useState } from 'react';\nexport const Card = () => <div />;\n" })
    assert.equal(violations.length, 0)
  })

  it('flags a .tsx file in src/backend', async () => {
    const violations = await run({ 'src/backend/Widget.tsx': 'export const x = 1;\n' })
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /src\/dsl-components/)
  })

  it('flags a .jsx file in src/commons', async () => {
    assert.equal((await run({ 'src/commons/x.jsx': 'export const x = 1;\n' })).length, 1)
  })

  it('flags a react import in src/backend', async () => {
    const violations = await run({ 'src/backend/index.ts': "import { useState } from 'react';\nexport default () => {};\n" })
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('flags react-dom and subpath imports in src/commons', async () => {
    const violations = await run({
      'src/commons/a.ts': "import { createRoot } from 'react-dom/client';\nexport const a = createRoot;\n",
      'src/commons/b.ts': "export * from 'react/jsx-runtime';\n",
    })
    assert.equal(violations.length, 2)
  })

  it('does not flag type-only imports, comments or packages that merely start with react', async () => {
    const violations = await run({
      'src/backend/index.ts': "// import x from 'react';\nimport type { ReactNode } from 'react';\nimport q from 'react-query';\nexport default () => {};\n",
    })
    assert.equal(violations.length, 0)
  })

  it('applies to test files too, like `check`', async () => {
    assert.equal((await run({ 'src/backend/index.test.ts': "import { useState } from 'react';\n" })).length, 1)
  })

  it('ignores generated dist-module files', async () => {
    assert.equal((await run({ 'dist-module/api-backend/backend.cjs': "require('react');\n" })).length, 0)
  })
})
