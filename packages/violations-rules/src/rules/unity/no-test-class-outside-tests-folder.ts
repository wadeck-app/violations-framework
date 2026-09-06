import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const CLASS_PATTERN = /\bclass\s+(Test_\w+)/

export const rule: Rule<Config> = {
  id: 'unity/no-test-class-outside-tests-folder',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const segments = file.split(/[/\\]/)
      if (segments.includes('_tests')) continue
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const m = CLASS_PATTERN.exec(lines[i])
        if (m) {
          violations.push({ file, line: i + 1, message: `Class '${m[1]}' must be declared inside a _tests/ folder.` })
        }
      }
    }
    return violations
  },
}
