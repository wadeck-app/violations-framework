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
  // Fix script: node node_modules/@wadeck-app/violations-rules/dist/rules/shared/no-emoji-fix.js --dry-run --root <path>
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const text = await readFile(file, 'utf8').catch(() => '')
      const lines = text.split('\n')
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]!
        const found: Array<{ ch: string; cp: number }> = []
        for (let ci = 0; ci < line.length; ) {
          const cp = line.codePointAt(ci) ?? 0
          const charLen = cp > 0xFFFF ? 2 : 1
          if (cp > 0x007F) {
            const ch = line.slice(ci, ci + charLen)
            if (SYMBOL_RE.test(ch)) {
              found.push({ ch, cp })
            }
          }
          ci += charLen
        }
        if (found.length > 0) {
          const detail = found
            .map(({ ch, cp }) => `'${ch}' (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`)
            .join(', ')
          violations.push({
            file,
            line: li + 1,
            message: `Symbol(s) found: ${detail} - use text alternatives or a Lucide icon component`,
          })
        }
      }
    }
    return violations
  },
}
