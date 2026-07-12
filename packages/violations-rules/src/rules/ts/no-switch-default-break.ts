import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const DEFAULT_LABEL_RE = /\bdefault\s*:/
const SINGLE_LINE_BREAK_RE = /\bdefault\s*:\s*(break|return)\s*;/

export const rule: Rule<Config> = {
  id: 'ts/no-switch-default-break',
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
        const line = lines[i]
        const trimmed = line.trimStart()

        // Skip comment lines
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue

        if (!DEFAULT_LABEL_RE.test(line)) continue

        // Skip if this line already contains a throw
        if (/\bthrow\b/.test(line)) continue

        // Single-line: default: break; or default: return ...;
        if (SINGLE_LINE_BREAK_RE.test(line)) {
          violations.push({
            file,
            line: i + 1,
            message: 'Switch default must throw an error - silent break/return is a hidden fallback.',
          })
          continue
        }

        // Multi-line lookahead: scan next up to 4 non-empty lines
        let found = false
        let checked = 0
        for (let j = i + 1; j < lines.length && checked < 4; j++) {
          const next = lines[j].trim()
          if (next === '' || next === '{') continue
          checked++
          if (next.startsWith('throw')) {
            // throw found - OK, no violation
            found = false
            break
          }
          if (/^break\s*;/.test(next) || /^return(\s|;)/.test(next)) {
            found = true
            break
          }
          // Something else (not throw, not break/return) - unclear, no fire
          break
        }
        if (found) {
          violations.push({
            file,
            line: i + 1,
            message: 'Switch default must throw an error - silent break/return is a hidden fallback.',
          })
        }
      }
    }
    return violations
  },
}
