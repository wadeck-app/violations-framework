import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { editorPrefixGuard, unitTestPrefixGuard } from './prefix-guard.js'

async function checkWith(rule: typeof editorPrefixGuard, code: string) {
  const dir = await mkdtemp(join(tmpdir(), 'test-'))
  try {
    const file = join(dir, 'Foo.cs')
    await writeFile(file, code)
    return rule.check([file], {})
  } finally {
    await rm(dir, { recursive: true })
  }
}

describe('unity/editor-prefix-guard', () => {
  it('fires when Editor_ used outside #if UNITY_EDITOR', async () => {
    const violations = await checkWith(editorPrefixGuard, 'void Editor_DoSomething() {}\n')
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 1)
  })

  it('does not fire when Editor_ is inside #if UNITY_EDITOR', async () => {
    const violations = await checkWith(
      editorPrefixGuard,
      '#if UNITY_EDITOR\nvoid Editor_DoSomething() {}\n#endif\n',
    )
    assert.equal(violations.length, 0)
  })

  it('does not fire on // line comment', async () => {
    const violations = await checkWith(editorPrefixGuard, '// Editor_Foo\n')
    assert.equal(violations.length, 0)
  })
})

describe('unity/unit-test-prefix-guard', () => {
  it('fires when UnitTest_ used outside #if UNITY_INCLUDE_TESTS', async () => {
    const violations = await checkWith(unitTestPrefixGuard, 'void UnitTest_Run() {}\n')
    assert.equal(violations.length, 1)
  })

  it('does not fire when UnitTest_ is inside #if UNITY_INCLUDE_TESTS', async () => {
    const violations = await checkWith(
      unitTestPrefixGuard,
      '#if UNITY_INCLUDE_TESTS\nvoid UnitTest_Run() {}\n#endif\n',
    )
    assert.equal(violations.length, 0)
  })
})
