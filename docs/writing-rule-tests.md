# Writing tests for violation rules

Every rule file - whether a local project rule in `.violations/rules/` or a built-in framework rule - must have a sibling test file named `<rule-id>.test.ts` (or `.test.js`).

This requirement is enforced by the `violations-meta/no-rule-without-test` rule.

---

## Test file location

Place the test file next to the rule file:

```
.violations/rules/
  my-rule.ts          ← rule implementation
  my-rule.test.ts     ← required test file
```

---

## Minimal test structure

Tests use Node's built-in `node:test` runner. No external framework is needed.

```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './my-rule.js'

describe('my-rule', () => {
  it('fires when the bad pattern is present', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'my-rule-'))
    try {
      const file = join(dir, 'bad.ts')
      await writeFile(file, 'const x = BAD_PATTERN')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 1)
      assert.match(violations[0].message, /expected pattern/)
      assert.equal(violations[0].line, 1)
    } finally {
      await rm(dir, { recursive: true })
    }
  })

  it('does not fire on valid code', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'my-rule-'))
    try {
      const file = join(dir, 'good.ts')
      await writeFile(file, 'const x = GOOD_PATTERN')
      const violations = await rule.check([file], {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
```

---

## Running tests

```bash
# Run all tests (from the violations-framework repo)
npm test

# Run a single test file
node --test packages/violations-rules/src/rules/violations-meta/my-rule.test.ts
```

For local project rules compiled from `.violations/rules/`, run tests via:

```bash
violations test
```

---

## Minimum coverage

Every test file must include at minimum:

- One **true positive**: the rule fires on code that should be flagged
- One **true negative**: the rule does not fire on valid code

Edge cases (empty file, wrong extension, suppression) are encouraged but optional.
