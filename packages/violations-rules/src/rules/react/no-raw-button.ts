import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const ATOMIC_RE = /@registryCategory\s+atomic/

/**
 * Returns true if the file is an atomic component (first 20 lines contain @registryCategory atomic).
 */
function isAtomic(lines: string[]): boolean {
  const head = lines.slice(0, 20)
  return head.some(l => ATOMIC_RE.test(l))
}

export const rule: Rule<Config> = {
  id: 'react/no-raw-button',
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
      if (isAtomic(lines)) continue

      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].includes('<button')) continue
        violations.push({
          file,
          line: i + 1,
          message: 'Raw <button> element - use <Button> instead',
        })
      }
    }

    return violations
  },
}
