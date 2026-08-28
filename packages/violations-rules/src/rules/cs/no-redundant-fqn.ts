import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Matches 2+ PascalCase segments joined by dots
const FQN_REGEX = /\b([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)+)\b/g

export const rule: Rule<Config> = {
  id: 'cs/no-redundant-fqn',
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
      const lines = text.split(/\r?\n/)
      let inBlockComment = false
      const ifStack: Array<string | null> = []

      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i]
        const trimmed = raw.trimStart()

        if (trimmed.startsWith('#if ')) {
          ifStack.push(trimmed.includes('UNITY_EDITOR') ? 'UNITY_EDITOR' : null)
          continue
        }
        if (trimmed.startsWith('#elif ')) {
          if (ifStack.length > 0) {
            ifStack[ifStack.length - 1] = trimmed.includes('UNITY_EDITOR') ? 'UNITY_EDITOR' : null
          }
          continue
        }
        if (trimmed.startsWith('#else')) {
          if (ifStack.length > 0) {
            ifStack[ifStack.length - 1] = null
          }
          continue
        }
        if (trimmed.startsWith('#endif')) {
          ifStack.pop()
          continue
        }
        if (ifStack.some(c => c === 'UNITY_EDITOR')) continue

        if (inBlockComment) {
          if (raw.includes('*/')) inBlockComment = false
          continue
        }
        if (raw.includes('/*') && !raw.includes('*/')) {
          inBlockComment = true
          continue
        }

        // Skip line comments and using directives
        if (trimmed.startsWith('//') || trimmed.startsWith('using ')) continue

        // Strip trailing line comment before scanning
        const commentIdx = raw.indexOf('//')
        const scanLine = commentIdx >= 0 ? raw.slice(0, commentIdx) : raw

        // Check suppression on this line or the line above
        const suppressLine = i > 0 ? lines[i - 1] : ''
        const suppressed =
          raw.includes('violations-suppress: cs/no-redundant-fqn') ||
          suppressLine.includes('violations-suppress: cs/no-redundant-fqn')
        if (suppressed) continue

        FQN_REGEX.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = FQN_REGEX.exec(scanLine)) !== null) {
          const fqn = match[1]
          if (!fqn.startsWith('System.') && !fqn.startsWith('UnityEngine.')) continue
          // UnityEditor FQNs are intentional
          if (fqn.startsWith('UnityEditor.')) continue
          violations.push({ file, line: i + 1, message: `Redundant FQN \`${fqn}\` - use the short name instead.` })
        }
      }
    }
    return violations
  },
}
