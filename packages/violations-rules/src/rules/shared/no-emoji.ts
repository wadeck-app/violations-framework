import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const EMOJI_RE = /[\u{2300}-\u{23FF}\u{2500}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}]/u

export const rule: Rule<Config> = {
  id: 'shared/no-emoji',
  tags: 'shared',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.cs', '**/*.md'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const text = await readFile(file, 'utf8').catch(() => '')
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (EMOJI_RE.test(lines[i]!)) {
          violations.push({ file, line: i + 1, message: 'Emoji or pictographic symbol not allowed in source files' })
        }
      }
    }
    return violations
  },
}
