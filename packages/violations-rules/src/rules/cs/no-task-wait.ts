import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

export const rule: Rule<Config> = {
  id: 'cs/no-task-wait',
  tags: 'cs',
  defaultScope: ['**/*.cs'],
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
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trimStart()
        if (trimmed.startsWith('//')) continue
        if (/\.Wait\(/.test(lines[i])) {
          violations.push({ file, line: i + 1, message: 'Synchronous .Wait() call detected - use async/await to avoid deadlocks.' })
        }
      }
    }
    return violations
  },
}
