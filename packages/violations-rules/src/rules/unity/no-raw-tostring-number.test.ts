import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-raw-tostring-number.js'

describe('unity/no-raw-tostring-number', () => {
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

  it('fires on int variable .ToString() (TYPED_PATTERN)', async () => {
    // int and .ToString() on the same line segment (no semicolon between them)
    const violations = await check('int x = score.ToString();\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('fires on scoreCount.ToString() (VAR_PATTERN)', async () => {
    const violations = await check('label.text = scoreCount.ToString();\n')
    assert.equal(violations.length, 1)
  })

  it('does not fire on Debug.Log line', async () => {
    const violations = await check('Debug.Log(score.ToString());\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on str.ToString() (not a typed numeric var name)', async () => {
    const violations = await check('label.text = myName.ToString();\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on comment line', async () => {
    const violations = await check('// int x = 1; x.ToString()\n')
    assert.equal(violations.length, 0)
  })
})
