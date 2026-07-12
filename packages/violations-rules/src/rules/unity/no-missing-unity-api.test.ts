import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-missing-unity-api.js'

describe('unity/no-missing-unity-api', () => {
  async function check(code: string) {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const file = join(dir, 'Foo.cs')
      await writeFile(file, code)
      return rule.check([file], {})
    } finally {
      await rm(dir, { recursive: true })
    }
  }

  it('fires on Enum.GetValues<MyEnum>', async () => {
    const violations = await check('var vals = Enum.GetValues<MyEnum>();\n')
    assert.equal(violations.length, 1)
  })

  it('fires on IsAssignableTo', async () => {
    const violations = await check('bool ok = x.IsAssignableTo(typeof(Foo));\n')
    assert.equal(violations.length, 1)
  })

  it('fires on Math.Log2', async () => {
    const violations = await check('double r = Math.Log2(x);\n')
    assert.equal(violations.length, 1)
  })

  it('fires on Random.Shared', async () => {
    const violations = await check('var r = Random.Shared;\n')
    assert.equal(violations.length, 1)
  })

  it('fires on new PriorityQueue', async () => {
    const violations = await check('var q = new PriorityQueue<int, int>();\n')
    assert.equal(violations.length, 1)
  })

  it('fires on Math.BitIncrement', async () => {
    const violations = await check('var r = Math.BitIncrement(x);\n')
    assert.equal(violations.length, 1)
  })

  it('does not fire on commented line', async () => {
    const violations = await check('// Enum.GetValues<MyEnum>()\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on safe Enum.GetValues(typeof(T))', async () => {
    const violations = await check('var vals = (MyEnum[])Enum.GetValues(typeof(MyEnum));\n')
    assert.equal(violations.length, 0)
  })
})
