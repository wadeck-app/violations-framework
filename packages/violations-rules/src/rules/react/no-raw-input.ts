import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const ATOMIC_RE = /@registryCategory\s+atomic/
const BANNED_INPUT_TYPES = new Set(['text', 'number', 'email', 'password', 'search'])

function isAtomic(text: string): boolean {
  return ATOMIC_RE.test(text)
}

/**
 * Returns true if the <input block at lineIndex should be flagged.
 * Scans up to 3 following lines for a type= attribute; no type = defaults to text (banned).
 */
function isBannedInputBlock(lines: string[], idx: number): boolean {
  if (!lines[idx].includes('<input')) return false
  const chunk = lines.slice(idx, idx + 4).join(' ')
  const typeMatch = chunk.match(/type\s*=\s*["']([^"']*)["']/)
  if (!typeMatch) {
    // No type attribute - defaults to text, which is banned
    return true
  }
  return BANNED_INPUT_TYPES.has(typeMatch[1].toLowerCase())
}

export const rule: Rule<Config> = {
  id: 'react/no-raw-input',
  tags: 'react',
  defaultScope: ['**/*.tsx'],
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
      if (isAtomic(text)) continue

      for (let i = 0; i < lines.length; i++) {
        if (!isBannedInputBlock(lines, i)) continue
        violations.push({
          file,
          line: i + 1,
          message: 'Raw <input> element - use a FieldText/FieldNumber/etc. atomic instead',
        })
      }
    }

    return violations
  },
}
