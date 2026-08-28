import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = {
  extraBannedMethods?: string[]
}

export const rule: Rule<Config> = {
  id: 'unity/no-task-delay',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], config: Config): Promise<Violation[]> {
    const extraMethods = config.extraBannedMethods ?? []
    const extraParts = extraMethods.map(m => {
      const escaped = m.replace(/\./g, '\\.')
      return `\\b${escaped}\\s*\\(`
    })
    const pattern = new RegExp([`\\bTask\\.Delay\\s*\\(`, ...extraParts].join('|'))
    const violations: Violation[] = []
    for (const file of files) {
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      if (!pattern.test(text)) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        if (pattern.test(line)) {
          violations.push({ file, line: i + 1, message: 'Use Tween.Delay(...) instead of Task.Delay(...).' })
        }
      }
    }
    return violations
  },
}
