import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const PATTERN = /\bDebug\.Log\s*\(|\bDebug\.LogWarning\s*\(|\bDebug\.LogError\s*\(/

export const rule: Rule<Config> = {
  id: 'unity/no-debug-log',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
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
      if (!PATTERN.test(text)) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        if (PATTERN.test(line)) {
          violations.push({ file, line: i + 1, message: 'Use the project log factory instead of Debug.Log / Debug.LogWarning / Debug.LogError.' })
        }
      }
    }
    return violations
  },
}
