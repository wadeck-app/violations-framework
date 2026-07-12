import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const ATOMIC_RE = /@registryCategory\s+atomic/

function isAtomic(lines: string[]): boolean {
  return lines.slice(0, 20).some(l => ATOMIC_RE.test(l))
}

/**
 * Returns true for files that are allowed to contain inline SVG:
 *   - @registryCategory atomic files
 *   - Chart.tsx in a display/ directory (recharts generates SVG internally)
 */
function isExcluded(file: string, lines: string[]): boolean {
  if (isAtomic(lines)) return true
  // Normalise path separators
  const fwd = file.replace(/\\/g, '/')
  if (/\/display\/Chart\.tsx$/.test(fwd)) return true
  return false
}

export const rule: Rule<Config> = {
  id: 'react/no-inline-svg',
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
      if (isExcluded(file, lines)) continue

      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].includes('<svg')) continue
        violations.push({
          file,
          line: i + 1,
          message: 'Inline <svg> element - extract to a dedicated SVG component or asset',
        })
      }
    }

    return violations
  },
}
