import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { rule } from './no-off-outside-tests.js'

describe('queue-sdk/no-off-outside-tests', () => {
  let dir: string | undefined
  afterEach(() => {
    if (dir !== undefined) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  async function run(files: Record<string, string>) {
    dir = mkdtempSync(join(tmpdir(), 'queue-sdk-off-'))
    const paths: string[] = []
    for (const [name, content] of Object.entries(files)) {
      const path = join(dir, name)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, content)
      paths.push(path)
    }
    return rule.check(paths, {})
  }

  const header = "import { createQueuePublisher } from '@wadeck-app/queue-sdk'\n"

  it('has the expected id and is always active', () => {
    assert.equal(rule.id, 'queue-sdk/no-off-outside-tests')
    assert.equal(rule.alwaysActive, true)
    assert.equal(rule.defaultSeverity, 'error')
  })

  it('flags `off: true` in the options object, with the line of the key', async () => {
    const violations = await run({ 'src/pub.ts': `${header}\nexport const p = createQueuePublisher({\n  url: 'x',\n  off: true,\n})\n` })
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 5)
    assert.match(violations[0].message, /QUEUE_SDK_OFF=1/)
  })

  it('flags a quoted key and a shorthand `off`', async () => {
    assert.equal((await run({ 'a.ts': `${header}createQueuePublisher({ 'off': true })\n` })).length, 1)
    assert.equal((await run({ 'b.ts': `${header}const off = true\ncreateQueuePublisher({ url: 'x', off })\n` })).length, 1)
  })

  it('flags an aliased import and a namespace member call', async () => {
    assert.equal((await run({ 'a.ts': "import { createQueuePublisher as make } from '@wadeck-app/queue-sdk'\nmake({ off: true })\n" })).length, 1)
    assert.equal((await run({ 'b.ts': "import * as sdk from '@wadeck-app/queue-sdk'\nsdk.createQueuePublisher({ off: true })\n" })).length, 1)
  })

  it('flags CommonJS require forms', async () => {
    assert.equal((await run({ 'a.cjs': "const { createQueuePublisher } = require('@wadeck-app/queue-sdk')\ncreateQueuePublisher({ off: true })\n" })).length, 1)
    assert.equal((await run({ 'b.cjs': "const sdk = require('@wadeck-app/queue-sdk')\nsdk.createQueuePublisher({ off: true })\n" })).length, 1)
  })

  it('resolves a variable declared as an object literal in the same file', async () => {
    const violations = await run({ 'a.ts': `${header}const options = { url: 'x', off: true }\ncreateQueuePublisher(options)\n` })
    assert.equal(violations.length, 1)
    assert.equal(violations[0].line, 2)
  })

  it('does not flag other options, nested `off` keys, `off` methods or non-object arguments', async () => {
    const files = {
      'a.ts': `${header}createQueuePublisher({ url: 'x', tags: { off: 1 }, off() { return 1 } })\n`,
      'b.ts': `${header}createQueuePublisher(buildOptions())\ncreateQueuePublisher(imported)\n`,
      'c.ts': `${header}createQueuePublisher({ ...base, url: 'x' })\n`,
    }
    assert.deepEqual(await run(files), [])
  })

  it('ignores comments and strings that mention off', async () => {
    const source = `${header}// createQueuePublisher({ off: true })\n/* createQueuePublisher({ off: true }) */\nconst text = "createQueuePublisher({ off: true })"\ncreateQueuePublisher({ url: 'a//b' /* off: true */ })\n`
    assert.deepEqual(await run({ 'a.ts': source }), [])
  })

  it('skips test files and test folders', async () => {
    const source = `${header}createQueuePublisher({ off: true })\n`
    const files = {
      'src/a.test.ts': source,
      'src/a.spec.ts': source,
      'src/__tests__/a.ts': source,
      'tests/a.ts': source,
      'test/a.ts': source,
      'testing/a.ts': source,
      'e2e/a.ts': source,
      'fixtures/a.ts': source,
    }
    assert.deepEqual(await run(files), [])
  })

  it('ignores files that do not import the queue SDK (including a same-named local function)', async () => {
    const files = {
      'a.ts': 'function createQueuePublisher(options: unknown) { return options }\ncreateQueuePublisher({ off: true })\n',
      'b.ts': "import { createQueuePublisher } from './local'\ncreateQueuePublisher({ off: true })\n",
    }
    assert.deepEqual(await run(files), [])
  })

  it('does not treat the same function from another package as the SDK', async () => {
    const source = "import { createQueuePublisher } from 'other-lib'\nimport { x } from '@wadeck-app/queue-sdk'\ncreateQueuePublisher({ off: true })\n"
    assert.deepEqual(await run({ 'a.ts': source }), [])
  })
})
