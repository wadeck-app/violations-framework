import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Detects Go updater files that spawn npm via exec.Command without terminal suppression.
// On Windows, exec.Command("npm") or exec.Command("cmd", "/C", "npm") always creates
// visible terminal windows - proven in PoC H1-H4. The correct fix is to delegate
// npm install to Node.js with windowsHide:true (without-daemon strategy).
export const rule: Rule<Config> = {
  id: 'cli/updater-strategy-missing-windows-hide',
  tags: 'cli',
  defaultScope: ['**/*.go'],
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

      if (!text.includes('npm') && !text.includes('UpdateCmd')) continue

      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!line.includes('exec.Command') && !line.includes('cmd.Start()')) continue
        if (!line.includes('npm') && !line.includes('cmd[0]')) continue

        const start = Math.max(0, i - 3)
        const end = Math.min(lines.length - 1, i + 15)
        const context = lines.slice(start, end + 1).join('\n')

        const hasWindowsSuppression =
          context.includes('0x08000000') ||
          context.includes('HideWindow') ||
          context.includes('wscript') ||
          context.includes('SW_HIDE') ||
          context.includes('spawnUpdateAndExit')

        if (!hasWindowsSuppression) {
          violations.push({
            file,
            line: i + 1,
            message:
              'Go updater spawns npm without terminal suppression - use the without-daemon strategy (Node.js windowsHide:true) instead of exec.Command("npm") from Go',
          })
        }
      }
    }

    return violations
  },
}
