import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../../types.js'

export type Config = Record<never, never>

// Detect Instantiate calls passing Quaternion.identity as the rotation argument
// when a parent transform is also provided (4-arg overload).
// Pattern: Instantiate( ... , Quaternion.identity , <something> )
const PATTERN = /\bInstantiate\s*\(.*,\s*Quaternion\.identity\s*,/

export const rule: Rule<Config> = {
  id: 'unity/no-instantiate-world-rotation',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
  defaultSeverity: 'info',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      if (!text.includes('Quaternion.identity')) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        if (PATTERN.test(line)) {
          violations.push({
            file,
            line: i + 1,
            message:
              'Use Instantiate(prefab, parent, false) to preserve local rotation. Quaternion.identity is a world rotation.',
          })
        }
      }
    }
    return violations
  },
}
