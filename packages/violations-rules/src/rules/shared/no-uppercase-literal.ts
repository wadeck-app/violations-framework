import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'
import { EXCLUDED_FILE_RE } from './no-uppercase-text.js'

export type Config = {
  // extends the default list; matched case-insensitively against each all-caps word
  allowedAcronyms?: string[]
}

// Words shorter than this are never flagged (CPU, API, ID, URL, SQL...).
const MIN_LETTERS = 4

const DEFAULT_ACRONYMS = [
  'HTTP', 'HTTPS', 'JSON', 'HTML', 'YAML', 'UUID', 'JSONL', 'XML', 'TOML', 'CSV',
  'REST', 'HTTP2', 'OAUTH', 'SAML', 'ONNX', 'WASM', 'GRPC', 'IPV4', 'IPV6',
  'LDAP', 'SMTP', 'IMAP', 'CRON', 'UTF8', 'ASCII', 'JWT',
]

const LABEL_KEYS = 'label|title|subtitle|text|groupLabel|caption|header|placeholder'

// key (optionally quoted, JSON/TS object) then ':' or '=' (JSX attribute), then a quoted value.
const QUOTED_RE = new RegExp(`(?:^|[\\s{,(])["']?(?:${LABEL_KEYS})["']?\\s*[:=]\\s*(["'\`])((?:(?!\\1).)*)\\1`)

// YAML only: bare scalar value (`label: TOOLS`), optional trailing comment.
const YAML_BARE_RE = new RegExp(`^\\s*(?:-\\s+)?(?:${LABEL_KEYS})\\s*:\\s*([^\\s"'#|>&*!][^#]*?)\\s*(?:#.*)?$`)

function isCommentLine(line: string, isYaml: boolean): boolean {
  return isYaml ? /^\s*#/.test(line) : /^\s*(?:\/\/|\/\*|\*)/.test(line)
}

/**
 * Returns the first all-caps word of at least MIN_LETTERS letters that is not allowed,
 * or undefined when the value is fine. Values with an underscore are identifiers
 * (SNAKE_CASE constants, enum keys) and are never flagged.
 */
function findShoutedWord(value: string, allowed: ReadonlySet<string>): string | undefined {
  if (value.includes('_')) {
    return undefined
  }
  // A single lowercase letter means normal prose casing, not text written in capitals.
  if (/\p{Ll}/u.test(value)) {
    return undefined
  }
  const words = value.match(/\p{Lu}+/gu) ?? []
  return words.find(w => w.length >= MIN_LETTERS && !allowed.has(w))
}

export const rule: Rule<Config> = {
  id: 'shared/no-uppercase-literal',
  tags: 'shared',
  defaultScope: ['**/*.ts', '**/*.tsx', '**/*.yaml', '**/*.yml', '**/*.json'],
  defaultSeverity: 'error',
  async check(files: string[], config: Config): Promise<Violation[]> {
    const allowed = new Set([...DEFAULT_ACRONYMS, ...(config.allowedAcronyms ?? [])].map(a => a.toUpperCase()))
    const violations: Violation[] = []
    for (const file of files) {
      if (EXCLUDED_FILE_RE.test(file)) {
        continue
      }
      const isYaml = /\.ya?ml$/.test(file)
      const text = await readFile(file, 'utf8').catch(() => '')
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        if (isCommentLine(line, isYaml)) {
          continue
        }
        const value = QUOTED_RE.exec(line)?.[2] ?? (isYaml ? YAML_BARE_RE.exec(line)?.[1] : undefined)
        if (value === undefined) {
          continue
        }
        const word = findShoutedWord(value, allowed)
        if (word) {
          violations.push({
            file,
            line: i + 1,
            message: `Text written in capitals ("${value}", word "${word}"). Write it in natural case (e.g. "Tools"), or add "${word}" to allowedAcronyms if it is a real acronym.`,
          })
        }
      }
    }
    return violations
  },
}
