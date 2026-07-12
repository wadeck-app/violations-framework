import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

const PATTERN = /\bFindObjectOfType\s*[<(]|\bFindComponent\s*\(/
const EXEMPT_BASE = /:\s*(ScriptableObject|EditorWindow)\b/

export const rule: Rule<Config> = {
  id: 'unity/no-find-object-of-type',
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
      if (EXEMPT_BASE.test(text)) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        if (PATTERN.test(line)) {
          violations.push({ file, line: i + 1, message: 'Prefer [SerializeField] wiring over FindObjectOfType / FindComponent.' })
        }
      }
    }
    return violations
  },
}
