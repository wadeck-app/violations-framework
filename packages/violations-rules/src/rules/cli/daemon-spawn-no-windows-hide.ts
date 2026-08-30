import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Detects child_process calls that are missing windowsHide:true.
// On Windows, spawning a process without windowsHide creates a visible terminal window.
//
// Patterns detected:
// 1. spawn() with detached:true but without windowsHide:true
// 2. execSync() / execFileSync() / execFile() without windowsHide:true
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

      // Pass 1: spawn() with detached:true missing windowsHide:true
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

      // Pass 2: execSync() / execFileSync() / execFile() missing windowsHide:true
      const EXEC_PATTERN = /\b(execSync|execFileSync|execFile)\s*\(/
      const WINDOWS_HIDE_PATTERN = /windowsHide\s*:\s*true/
      for (let i = 0; i < lines.length; i++) {
        if (!EXEC_PATTERN.test(lines[i])) continue

        // Look at current line and next 5 lines (covers multi-line options objects)
        const end = Math.min(lines.length - 1, i + 5)
        const context = lines.slice(i, end + 1).join('\n')

        if (!WINDOWS_HIDE_PATTERN.test(context)) {
          violations.push({
            file,
            line: i + 1,
            message:
              'execSync/execFileSync/execFile is missing windowsHide:true - on Windows this flashes a visible terminal window',
          })
        }
      }
    }

    return violations
  },
}
