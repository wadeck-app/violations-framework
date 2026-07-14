import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-raw-gui-layout-in-typed-editor.js'

describe('unity/no-raw-gui-layout-in-typed-editor', () => {
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

  const BASE_CLASS = 'class MyEditor : TypedEditor<MyTarget> {\n'

  it('fires on EditorGUILayout.Space in TypedEditor subclass', async () => {
    const violations = await check(`${BASE_CLASS}  EditorGUILayout.Space(4);\n}\n`)
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 2)
  })

  it('fires on GUILayout.Label in TypedEditor subclass', async () => {
    const violations = await check(`${BASE_CLASS}  GUILayout.Label("title");\n}\n`)
    assert.equal(violations.length, 1)
  })

  it('does not fire when class does not inherit TypedEditor or CustomEditorWindow', async () => {
    const violations = await check('class MyEditor : Editor {\n  EditorGUILayout.Space(4);\n}\n')
    assert.equal(violations.length, 0)
  })

  it('does not fire on // comment', async () => {
    const violations = await check(`${BASE_CLASS}  // EditorGUILayout.Space(4);\n}\n`)
    assert.equal(violations.length, 0)
  })

  it('fires on CustomEditorWindow subclass', async () => {
    const violations = await check('class MyWin : CustomEditorWindow {\n  GUILayout.Space(2);\n}\n')
    assert.equal(violations.length, 1)
  })
})
