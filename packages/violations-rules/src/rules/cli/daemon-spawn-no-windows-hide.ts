import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Detects spawn() calls with detached:true that are missing windowsHide:true.
// On Windows, a detached spawn without windowsHide creates a visible terminal window.
// Pattern: `detached: true` in a spawn options block without `windowsHide` nearby.
export const rule: Rule<Config> = {
  id: 'cli/daemon-spawn-no-windows-hide',
  tags: 'cli',
  defaultScope: ['**/*.ts', '**/*.js', '**/*.mjs', '**/*.cjs'],
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
        if (!lines[i].includes('detached: true')) continue

        // Look within the surrounding 10 lines for windowsHide
        const start = Math.max(0, i - 5)
        const end = Math.min(lines.length - 1, i + 10)
        const context = lines.slice(start, end + 1).join('\n')

        if (!context.includes('windowsHide')) {
          violations.push({
            file,
            line: i + 1,
            message:
              'spawn() with detached:true is missing windowsHide:true - on Windows this flashes a visible terminal window',
          })
        }
      }
    }

    return violations
  },
}
