import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-cross-package-relative.js'

describe('ts/no-cross-package-relative', () => {
  it('fires on cross-package relative import to dsl-renderer', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-cross-package-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "import { Foo } from '../../dsl-renderer/src/Bar'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /Cross-package relative import/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires on cross-package relative import to dsl-ui', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-cross-package-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "import { Bar } from '../../../dsl-ui/src/components/Baz'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on package alias import', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-cross-package-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "import { Foo } from 'dsl-renderer'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on local relative import', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-cross-package-relative-'))
    try {
      const file = join(dir, 'test.ts')
      await writeFile(file, "import { Foo } from './local'\n")
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
