import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { relative } from 'node:path'
import type { Rule } from '../types.js'
import { createModule } from '../test-utils/app-module-fixtures.js'
import { PARITY_SCENARIOS } from '../test-utils/app-module-parity-scenarios.js'
import { listFiles, toPosix } from './layout.js'
import { rule as backendEntry } from './backend-entry-location.js'
import { rule as importBoundaries } from './import-boundaries.js'
import { rule as manifestValid } from './manifest-exists-and-valid.js'
import { rule as noReact } from './no-react.js'
import { rule as publishing } from './publishing.js'
import { rule as sourceLayout } from './source-layout.js'
import { rule as viewLocation } from './view-location.js'

// The rules replicate `app-core-cli check` (the authoritative layout implementation) with text
// scanning. app-core-cli is NOT a dependency of this repo, so the CLI is not run here: each scenario
// carries the verdict the CLI gives (`fails`), and the rules must reach the same one. If check.ts
// changes, update the scenarios and the rules together.
const MANIFEST_ANCHORED: Array<Rule<Record<never, never>>> = [sourceLayout, backendEntry, viewLocation, publishing]
const SOURCE_FILE_RULES: Array<Rule<Record<never, never>>> = [noReact, importBoundaries]

async function rulesFail(root: string): Promise<string[]> {
  const sourceFiles = listFiles(root).filter((f) => /\.[cm]?[jt]sx?$/.test(f) && toPosix(relative(root, f)).startsWith('src/'))
  const failing: string[] = []
  const runs: Array<[Rule<Record<never, never>>, string[]]> = [
    ...MANIFEST_ANCHORED.map((rule): [Rule<Record<never, never>>, string[]] => [rule, [`${root}/manifest.json`]]),
    ...SOURCE_FILE_RULES.map((rule): [Rule<Record<never, never>>, string[]] => [rule, sourceFiles]),
    [manifestValid, [`${root}/package.json`]],
  ]
  for (const [rule, files] of runs) {
    if ((await rule.check(files, {})).length > 0) {
      failing.push(rule.id)
    }
  }
  return failing
}

describe('app-module rules agree with the `app-core-cli check` verdicts', () => {
  it('has 28 scenarios', () => {
    assert.equal(PARITY_SCENARIOS.length, 28)
  })

  for (const scenario of PARITY_SCENARIOS) {
    it(`${scenario.name}: ${scenario.fails ? 'reported' : 'accepted'}`, async () => {
      const mod = createModule(scenario.files)
      try {
        const failing = await rulesFail(mod.root)
        assert.equal(failing.length > 0, scenario.fails, `rules that reported a violation: [${failing.join(', ')}]`)
      } finally {
        mod.cleanup()
      }
    })
  }
})
