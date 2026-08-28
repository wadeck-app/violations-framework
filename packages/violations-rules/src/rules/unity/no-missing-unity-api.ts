import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const CHECKS = [
  { pattern: /Enum\.GetValues<[A-Za-z]/, message: 'Enum.GetValues<T>() is absent in Unity Mono - use (T[])Enum.GetValues(typeof(T)) instead.' },
  { pattern: /\.IsAssignableTo\(/, message: 'Type.IsAssignableTo() is absent in Unity Mono - use target.IsAssignableFrom(source) instead.' },
  { pattern: /Math\.Log2\(/, message: 'Math.Log2() is absent in Unity Mono - use Math.Log(x, 2.0) instead.' },
  { pattern: /Random\.Shared\b/, message: 'Random.Shared is absent in Unity Mono (.NET 6+) - use new Random() or the project random utility instead.' },
  { pattern: /new\s+PriorityQueue\s*</, message: 'PriorityQueue<,> is absent in Unity Mono (.NET 6+) - use SortedList or an alternative data structure.' },
  { pattern: /Math\.(BitIncrement|BitDecrement|FusedMultiplyAdd|ILogB|ScaleB)\(/, message: 'Math.BitIncrement/BitDecrement/FusedMultiplyAdd/ILogB/ScaleB are absent in Unity Mono (.NET 5+) - no direct equivalent available.' },
]

export const rule: Rule<Config> = {
  id: 'unity/no-missing-unity-api',
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
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trimStart()
        if (trimmed.startsWith('//')) continue
        for (const check of CHECKS) {
          if (check.pattern.test(lines[i])) {
            violations.push({ file, line: i + 1, message: check.message })
          }
        }
      }
    }
    return violations
  },
}
