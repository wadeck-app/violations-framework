import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

export const rule: Rule<Config> = {
  id: 'cs/no-xml-doc-summary',
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
      if (!text.includes('<summary>')) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<summary>')) {
          violations.push({ file, line: i + 1, message: 'XML doc <summary> tag is forbidden - use JavaDoc /** ... */ style instead.' })
        }
      }
    }
    return violations
  },
}
