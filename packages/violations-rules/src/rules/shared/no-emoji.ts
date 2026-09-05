import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Matches any visual symbol or emoji that should not appear in source code:
//   - Extended_Pictographic: all emoji and pictographic characters (comprehensive, future-proof)
//   - Symbol: math (Sm), currency (Sc), modifier (Sk), other (So) symbols
//
// ASCII (U+0000-U+007F) is excluded: <, >, =, $, `, * etc. are valid code operators.
// Normal letters in any script (Letter / Mark / Number categories) are never matched.
// Surrogate pairs are stepped over correctly via codePointAt + charLen.
const SYMBOL_RE = /\p{Extended_Pictographic}|\p{Symbol}/u

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
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]!
        for (let ci = 0; ci < line.length; ) {
          const cp = line.codePointAt(ci) ?? 0
          const charLen = cp > 0xFFFF ? 2 : 1
          if (cp > 0x007F) {
            const ch = line.slice(ci, ci + charLen)
            if (SYMBOL_RE.test(ch)) {
              violations.push({
                file,
                line: li + 1,
                message: `Emoji/symbol '${ch}' (U+${cp.toString(16).toUpperCase().padStart(4, '0')}) not allowed - use a text alternative or a Lucide icon component`,
              })
            }
          }
          ci += charLen
        }
      }
    }
    return violations
  },
}
