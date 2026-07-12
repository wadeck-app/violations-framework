import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-inline-subcomponent.js'

describe('ts/no-inline-subcomponent', () => {
  it('fires when file has 2+ component functions', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-subcomponent-'))
    try {
      const file = join(dir, 'MyPage.tsx')
      await writeFile(
        file,
        `export function Foo() {
  return null
}

function Bar() {
  return null
}
`,
      )
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /multiple function components/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when file has only 1 component function', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-subcomponent-'))
    try {
      const file = join(dir, 'MyPage.tsx')
      await writeFile(
        file,
        `export function MyPage() {
  return null
}
`,
      )
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on .dialogs.tsx files even with multiple components', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-subcomponent-'))
    try {
      const file = join(dir, 'my.dialogs.tsx')
      await writeFile(
        file,
        `export function Foo() {
  return null
}

function Bar() {
  return null
}
`,
      )
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on .skeleton.tsx files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-inline-subcomponent-'))
    try {
      const file = join(dir, 'my.skeleton.tsx')
      await writeFile(
        file,
        `export function Foo() {
  return null
}

function Bar() {
  return null
}
`,
      )
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
