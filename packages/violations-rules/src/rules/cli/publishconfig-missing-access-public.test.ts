import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './publishconfig-missing-access-public.js'

describe('cli/publishconfig-missing-access-public', () => {
  it('fires on scoped package with publishConfig but no access:public', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pkg-test-'))
    try {
      const file = join(dir, 'package.json')
      await writeFile(file, JSON.stringify({
        name: '@wadeck-app/my-cli',
        version: '1.0.0',
        publishConfig: { '@wadeck-app:registry': 'https://npm.pkg.github.com/' },
      }))
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /access.*public/)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when access:public is present', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pkg-test-'))
    try {
      const file = join(dir, 'package.json')
      await writeFile(file, JSON.stringify({
        name: '@wadeck-app/my-cli',
        version: '1.0.0',
        publishConfig: {
          '@wadeck-app:registry': 'https://npm.pkg.github.com/',
          access: 'public',
        },
      }))
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on unscoped package', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pkg-test-'))
    try {
      const file = join(dir, 'package.json')
      await writeFile(file, JSON.stringify({
        name: 'my-cli',
        version: '1.0.0',
        publishConfig: { registry: 'https://registry.npmjs.org/' },
      }))
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire when no publishConfig', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pkg-test-'))
    try {
      const file = join(dir, 'package.json')
      await writeFile(file, JSON.stringify({
        name: '@wadeck-app/private-internal',
        version: '1.0.0',
      }))
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
