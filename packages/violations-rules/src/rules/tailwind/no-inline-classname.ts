import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = {
  maxChars?: number
}

const DEFAULT_MAX_CHARS = 80

// Matches a static className="..." or className='...' attribute value
const CLASS_RE = /className=["']([^"']+)["']/

/**
 * Returns true if the line contains dynamic className content that cannot be
 * statically measured: template literals, interpolations, or array joins.
 */
function isDynamic(line: string): boolean {
  if (line.includes('`')) return true
  if (line.includes('${')) return true
  if (line.includes('className={[')) return true
  return false
}

/**
 * Returns true if the line is a module-level constant declaration.
 * These are the intended extraction targets - they must not be flagged.
 */
function isConstDeclaration(line: string): boolean {
  return /^\s*(export\s+)?(const|let)\s+/.test(line)
}

export const rule: Rule<Config> = {
  id: 'tailwind/no-inline-classname',
  tags: 'tailwind',
  defaultScope: ['**/*.tsx'],
  defaultSeverity: 'warning',

  async check(files: string[], config: Config): Promise<Violation[]> {
    const maxChars = config.maxChars ?? DEFAULT_MAX_CHARS
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
        if (!line.includes('className=')) continue
        if (isDynamic(line)) continue
        if (isConstDeclaration(line)) continue

        const match = CLASS_RE.exec(line)
        if (!match) continue

        const classValue = match[1]
        if (classValue.length > maxChars) {
          violations.push({
            file,
            line: i + 1,
            message: `Inline className string is ${classValue.length} chars (max ${maxChars}) - extract to a named module-level constant`,
          })
        }
      }
    }

    return violations
  },
}
