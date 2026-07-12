import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-button-classname-style-override.js'

describe('tailwind/no-button-classname-style-override', () => {
  it('fires when <Button> has className with text-* style token', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-btn-cn-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<Button className="text-red-500 font-bold">Submit</Button>\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.equal(violations[0].line, 1)
      assert.match(violations[0].message, /style tokens/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires when <Button> has className with bg-* style token', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-btn-cn-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<Button className="bg-blue-500">Submit</Button>\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('fires when <Button> has className with px-N token', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-btn-cn-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<Button className="px-4 py-2">Submit</Button>\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when <Button> className contains only layout tokens (shrink-0, w-full)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-btn-cn-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<Button className="shrink-0 w-full ml-auto">Submit</Button>\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when <Button> uses dynamic className expression', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-btn-cn-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<Button className={btnClass}>Submit</Button>\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when there is no <Button> in the file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'no-btn-cn-'))
    try {
      const file = join(dir, 'Form.tsx')
      await writeFile(file, '<div className="text-red-500">text</div>\n')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('returns empty array for empty file list', async () => {
    const violations = await rule.check([], {})
    assert.equal(violations.length, 0)
  })
})
