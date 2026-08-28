import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

const EXCLUDE_RE = /(^|\/)_generated\//

// Matches a class declaration inheriting from TypedEditor<...> or CustomEditorWindow.
// TypedEditor.cs/CustomEditorWindow.cs themselves declare `: UnityEditor.Editor` /
// `: EditorWindow` respectively, so they never match - no filename-based exemption needed.
const INHERITS_BASE = /class\s+\w+(?:<[^>]*>)?\s*:\s*(?:TypedEditor<|CustomEditorWindow\b)/

// Raw Unity GUI APIs that must be replaced by the base class helper methods
const RAW_API_CALLS = [
  'EditorGUILayout.Space(',
  'GUILayout.Space(',
  'EditorGUILayout.LabelField(',
  'GUILayout.Label(',
]

export const rule: Rule<Config> = {
  id: 'unity/no-raw-gui-layout-in-typed-editor',
  tags: 'unity',
  defaultScope: ['Assets/**/*.cs'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      const rel = file.split('\\').join('/')
      if (EXCLUDE_RE.test(rel)) continue
      let text: string
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      if (!INHERITS_BASE.test(text)) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trimStart()
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
        const matchedApi = RAW_API_CALLS.find(api => line.includes(api))
        if (!matchedApi) continue
        violations.push({
          file,
          line: i + 1,
          message: `Raw \`${matchedApi}\` call forbidden in a TypedEditor<T>/CustomEditorWindow subclass - use the base class helper instead.`,
        })
      }
    }
    return violations
  },
}
