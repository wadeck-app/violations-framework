import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './logic-no-unity-using.js'

describe('unity/logic-no-unity-using', () => {
  it('fires on Unity using in logic/ file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const logicDir = join(dir, 'logic')
      await mkdir(logicDir)
      const file = join(logicDir, 'GameLogic.cs')
      await writeFile(file, 'using UnityEngine;\npublic class GameLogic {}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.ok(violations[0].message.includes('UnityEngine'))
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on Unity using in non-logic/ file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const uiDir = join(dir, 'ui')
      await mkdir(uiDir)
      const file = join(uiDir, 'GameUI.cs')
      await writeFile(file, 'using UnityEngine;\npublic class GameUI {}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on non-Unity using in logic/ file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'))
    try {
      const logicDir = join(dir, 'logic')
      await mkdir(logicDir)
      const file = join(logicDir, 'GameLogic.cs')
      await writeFile(file, 'using System;\npublic class GameLogic {}\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
