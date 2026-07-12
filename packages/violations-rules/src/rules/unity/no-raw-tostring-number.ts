import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const TYPED_PATTERN = /\b(?:int|float|double|long)\b[^;{}]*\.ToString\(\)/
const VAR_PATTERN = /\b(?:\w+(?:Count|Value|Score|Amount|Bonus|Mult|Gold|Level|Tick|Max|Min|Total|Current|Base))\s*\.ToString\(\)/

export const rule: Rule<Config> = {
  id: 'unity/no-raw-tostring-number',
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
      if (!text.includes('.ToString()')) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        // Exclude debug/log lines and padding operations
        if (trimmed.includes('Debug.Log') || trimmed.includes('.PadLeft(') || trimmed.includes('.PadRight(')) continue
        if (TYPED_PATTERN.test(line) || VAR_PATTERN.test(line)) {
          violations.push({ file, line: i + 1, message: 'Use NumberFormatter.Format() instead of .ToString() for numeric values displayed in UI.' })
        }
      }
    }
    return violations
  },
}
