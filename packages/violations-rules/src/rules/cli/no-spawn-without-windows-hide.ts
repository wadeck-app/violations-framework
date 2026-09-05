import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Detects spawn/spawnSync/execFile/execFileSync calls missing windowsHide:true.
// Without it, Windows opens a visible cmd.exe terminal window for every subprocess.
const SPAWN_CALL_RE = /\b(spawn|spawnSync|execFile|execFileSync)\s*\(/
const WINDOWS_HIDE_RE = /windowsHide\s*:\s*true/

export const rule: Rule<Config> = {
  id: 'cli/no-spawn-without-windows-hide',
  tags: 'cli',
  defaultScope: ['**/*.ts', '**/*.js', '**/*.mjs', '**/*.cjs'],
  defaultSeverity: 'warning',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const file of files) {
      if (file.includes('.test.') || file.includes('.spec.')) continue

      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }

      const lines = text.split('\n')

      for (let i = 0; i < lines.length; i++) {
        if (!SPAWN_CALL_RE.test(lines[i])) continue

        // Scan current line + next 8 lines to capture multi-line options objects
        const block = lines.slice(i, i + 9).join('\n')
        if (WINDOWS_HIDE_RE.test(block)) continue

        violations.push({
          file,
          line: i + 1,
          message: 'spawn/spawnSync/execFile/execFileSync without windowsHide:true will open a visible terminal window on Windows. Add windowsHide:true to the options.',
        })
      }
    }

    return violations
  },
}
