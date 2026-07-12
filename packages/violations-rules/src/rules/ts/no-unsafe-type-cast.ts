import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const UNSAFE_CAST_RE = /\bas\s+(?:unknown|any|Record<string,\s*unknown>)(?=\s*[;,)\]|&]|\s*$)/

export const rule: Rule<Config> = {
  id: 'ts/no-unsafe-type-cast',
  tags: 'ts',
  defaultScope: ['**/*.ts', '**/*.tsx'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (!UNSAFE_CAST_RE.test(lines[i])) continue
        violations.push({
          file,
          line: i + 1,
          message:
            'Unsafe cast to unknown/any/Record<string, unknown> - constrain the generic (e.g. "T extends Record<string, unknown>") instead of casting',
        })
      }
    }
    return violations
  },
}
