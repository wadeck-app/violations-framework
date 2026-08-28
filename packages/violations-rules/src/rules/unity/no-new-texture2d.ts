import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const PATTERN = /\bnew\s+Texture2D\s*\(/

export const rule: Rule<Config> = {
  id: 'unity/no-new-texture2d',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      // Exclude editor dirs
      if (/[/\\]editor[/\\]/i.test(file)) continue
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      if (!PATTERN.test(text)) continue
      const lines = text.split(/\r?\n/)
      const ifStack: Array<string | null> = []
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('#if ')) {
          ifStack.push(trimmed.includes('UNITY_EDITOR') ? 'UNITY_EDITOR' : null)
          continue
        }
        if (trimmed.startsWith('#elif ')) {
          ifStack[ifStack.length - 1] = trimmed.includes('UNITY_EDITOR') ? 'UNITY_EDITOR' : null
          continue
        }
        if (trimmed.startsWith('#else')) {
          ifStack[ifStack.length - 1] = null
          continue
        }
        if (trimmed.startsWith('#endif')) {
          ifStack.pop()
          continue
        }
        if (ifStack.some(c => c === 'UNITY_EDITOR')) continue
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        if (PATTERN.test(line)) {
          violations.push({ file, line: i + 1, message: 'new Texture2D() breaks batching in runtime code - load textures from assets instead.' })
        }
      }
    }
    return violations
  },
}
