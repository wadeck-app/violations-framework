import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const SAFE_PATTERN = /\bStringHelper\.Split\s*\(|\bStringArrayHelper\.Split\s*\(/
const FLAG_PATTERN = /\.Split\s*\(/

export const rule: Rule<Config> = {
  id: 'unity/no-string-split',
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
      if (!FLAG_PATTERN.test(text)) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('///')) continue
        if (!FLAG_PATTERN.test(line)) continue
        if (SAFE_PATTERN.test(line)) continue
        violations.push({ file, line: i + 1, message: 'Use StringHelper.Split(...) instead of .Split(...) - some overloads throw MissingMethodException under Unity Mono.' })
      }
    }
    return violations
  },
}
