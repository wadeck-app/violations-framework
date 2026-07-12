import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = {
  extraWords?: string[]
}

// violations-suppress: shared/no-french accented chars are intentionally part of the detection regex
const ACCENTED = /[àâäçéèêëîïôùûüÿœæÀÂÄÇÉÈÊËÎÏÔÙÛÜŸŒÆ]/

// Superset of CF word list (11 words) and poker-grid word list (16 words).
// violations-suppress-start: shared/no-french intentional - French word list documentation
// CF list: avec, pour, cette, dans, sans, une, des, les, est, pas, sur
// poker-grid adds: du, de, le, la, et
// violations-suppress-end: shared/no-french
const BUILTIN_FRENCH_WORDS = [
  'avec', 'pour', 'cette', 'dans', 'sans', 'une', 'des', 'les', 'est', 'pas', 'sur',
  'du', 'de', 'le', 'la', 'et',
]

function buildFrenchWordRe(extraWords: string[]): RegExp {
  const words = [...BUILTIN_FRENCH_WORDS, ...extraWords]
  return new RegExp('(?:^|\\s)(' + words.join('|') + ')(?:\\s|$)', 'i')
}

export const rule: Rule<Config> = {
  id: 'shared/no-french',
  tags: 'shared',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.md'],
  defaultSeverity: 'error',

  async check(files: string[], config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    const frenchWordRe = buildFrenchWordRe(config.extraWords ?? [])

    for (const file of files) {
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }

      // Fast pre-check: skip files with no accented chars and no French words
      if (!ACCENTED.test(text) && !frenchWordRe.test(text)) continue

      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (ACCENTED.test(line)) {
          violations.push({
            file,
            line: i + 1,
            message: 'Contains accented character - all code and comments must be in English.',
          })
        } else if (frenchWordRe.test(line)) {
          violations.push({
            file,
            line: i + 1,
            message: 'Contains French word - all code and comments must be in English.',
          })
        }
      }
    }

    return violations
  },
}
