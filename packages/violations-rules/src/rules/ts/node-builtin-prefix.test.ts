import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './node-builtin-prefix.js'

async function withFile(content: string, fn: (path: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'node-builtin-prefix-'))
  const file = join(dir, 'test.ts')
  try {
    await writeFile(file, content, 'utf8')
    await fn(file)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

describe('ts/node-builtin-prefix', () => {
  it('flags bare fs import', async () => {
    await withFile(`import { readFile } from 'fs'`, async (file) => {
      const v = await rule.check([file], {})
      assert.equal(v.length, 1)
      assert.match(v[0].message, /use 'node:fs'/)
    })
  })

  it('flags bare path import with double quotes', async () => {
    await withFile(`import path from "path"`, async (file) => {
      const v = await rule.check([file], {})
      assert.equal(v.length, 1)
      assert.match(v[0].message, /use 'node:path'/)
    })
  })

  it('flags require()', async () => {
    await withFile(`const http = require('http')`, async (file) => {
      const v = await rule.check([file], {})
      assert.equal(v.length, 1)
      assert.match(v[0].message, /use 'node:http'/)
    })
  })

  it('does not flag node: prefixed imports', async () => {
    await withFile(`import { readFile } from 'node:fs'`, async (file) => {
      const v = await rule.check([file], {})
      assert.equal(v.length, 0)
    })
  })

  it('does not flag node: prefixed require', async () => {
    await withFile(`const path = require('node:path')`, async (file) => {
      const v = await rule.check([file], {})
      assert.equal(v.length, 0)
    })
  })

  it('does not flag non-node packages', async () => {
    await withFile(`import React from 'react'\nimport { x } from './local'\nimport { y } from '@scope/pkg'`, async (file) => {
      const v = await rule.check([file], {})
      assert.equal(v.length, 0)
    })
  })

  it('flags multiple violations in one file', async () => {
    await withFile(`import { readFile } from 'fs'\nimport { join } from 'path'`, async (file) => {
      const v = await rule.check([file], {})
      assert.equal(v.length, 2)
    })
  })

  it('flags fs/promises without prefix', async () => {
    await withFile(`import { readFile } from 'fs/promises'`, async (file) => {
      const v = await rule.check([file], {})
      assert.equal(v.length, 1)
      assert.match(v[0].message, /use 'node:fs\/promises'/)
    })
  })
})
