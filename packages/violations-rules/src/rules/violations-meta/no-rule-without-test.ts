import { access } from 'node:fs/promises'
import { dirname, basename, join } from 'node:path'
import type { Rule, Violation } from '../../types.js'

export type Config = {
  ruleFiles: string[]
}

// Rules that are intentionally exempt from the test requirement
const EXEMPT_RULE_IDS = new Set(['no-rule-without-test', 'violations-meta/no-rule-without-test'])

function isExempt(ruleFile: string): boolean {
  const base = basename(ruleFile).replace(/\.(ts|js)$/, '')
  return EXEMPT_RULE_IDS.has(base) || EXEMPT_RULE_IDS.has(basename(dirname(ruleFile)) + '/' + base)
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export const rule: Rule<Config> = {
  id: 'violations-meta/no-rule-without-test',
  tags: 'violations-meta',
  defaultScope: ['.violations/rules/**/*.ts', '.violations/rules/**/*.js'],
  defaultSeverity: 'error',

  async check(_files: string[], config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const ruleFile of config.ruleFiles) {
      // Skip test files themselves
      if (ruleFile.endsWith('.test.ts') || ruleFile.endsWith('.test.js')) continue
      // Skip exempt rules
      if (isExempt(ruleFile)) continue

      const dir = dirname(ruleFile)
      const base = basename(ruleFile).replace(/\.(ts|js)$/, '')

      const testTs = join(dir, `${base}.test.ts`)
      const testJs = join(dir, `${base}.test.js`)

      const hasTest = (await fileExists(testTs)) || (await fileExists(testJs))
      if (!hasTest) {
        violations.push({
          file: ruleFile,
          line: 1,
          message: `Rule '${base}' has no corresponding test file (${base}.test.ts or ${base}.test.js)`,
        })
      }
    }

    return violations
  },
}
