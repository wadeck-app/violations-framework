import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const ERR_MESSAGE_RE = /\b(err|error|e|ex)\.message\b/

const SKIPPED_SUFFIXES = ['utils/errors.ts', 'src/errors.ts']

export const rule: Rule<Config> = {
  id: 'ts/no-err-message-direct',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const normalised = file.replace(/\\/g, '/')
      if (SKIPPED_SUFFIXES.some(suffix => normalised.endsWith(suffix))) continue

      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        if (!ERR_MESSAGE_RE.test(lines[i])) continue
        violations.push({
          file,
          line: i + 1,
          message: 'Direct .message access on error variable - use getErrorMessage() instead',
        })
      }
    }
    return violations
  },
}
