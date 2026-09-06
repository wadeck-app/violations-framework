import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const PATTERN = /\bUNITY_INCLUDE_TESTS\b/

export const rule: Rule<Config> = {
  id: 'unity/no-unity-include-tests-in-unittest-project',
  tags: 'unity',
  defaultScope: ['UnitTests/**/*.cs'],
  defaultSeverity: 'warning',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        if (PATTERN.test(lines[i])) {
          violations.push({ file, line: i + 1, message: 'UNITY_INCLUDE_TESTS is always true in UnitTests/ and must not be used here.' })
        }
      }
    }
    return violations
  },
}
