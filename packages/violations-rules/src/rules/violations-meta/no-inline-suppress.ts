import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Standalone suppress: line starts with optional whitespace then a comment marker
const STANDALONE_RE = /^\s*(?:\/\/|\{?\/\*|#|<!--)\s*violations-suppress:/
const ANY_SUPPRESS_RE = /violations-suppress:/

export const rule: Rule<Config> = {
  id: 'violations-meta/no-inline-suppress',
  tags: 'violations-meta',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.cs'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const file of files) {
      let lines: string[]
      try {
        const text = await readFile(file, 'utf8')
        lines = text.split(/\r?\n/)
      } catch {
        continue
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!ANY_SUPPRESS_RE.test(line)) continue
        if (STANDALONE_RE.test(line)) continue
        violations.push({
          file,
          line: i + 1,
          message: 'Inline violations-suppress: move the comment to the line above',
        })
      }
    }

    return violations
  },
}
