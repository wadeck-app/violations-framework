import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const UNITY_USING = /^\s*using\s+(Unity[A-Za-z0-9_.]*)\s*;/

export const rule: Rule<Config> = {
  id: 'unity/logic-no-unity-using',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      // Only files whose path has a 'logic' segment
      const parts = file.split(/[/\\]/)
      if (!parts.includes('logic')) continue
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(UNITY_USING)
        if (match) {
          violations.push({ file, line: i + 1, message: `Logic file imports ${match[1]} - Unity dependency is forbidden in logic/ layer.` })
        }
      }
    }
    return violations
  },
}
