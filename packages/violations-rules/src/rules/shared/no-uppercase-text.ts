import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Stories and tests render fixtures, not product UI: skipped by file name.
export const EXCLUDED_FILE_RE = /\.(?:stories|story|test|spec)\.[cm]?[jt]sx?$/

// Tailwind `uppercase` utility, optionally behind variants (md:, hover:, dark:...).
// Must be a whole class token, so `normal-case`, `text-uppercase-foo` and prose are not matched.
const TAILWIND_UPPERCASE_RE = /(?<=^|[\s"'`{])(?:[\w[\]&>*=-]+:)*!?uppercase(?=$|[\s"'`}])/

// Only trust the Tailwind token on lines that look like a class list; avoids flagging
// prose such as "must be uppercase" in strings or comments.
const CLASS_CONTEXT_RE = /class|clsx|cn\(|cva\(|twMerge|tw`/i

// CSS declaration (kebab) or React style object (camel) setting text-transform to uppercase,
// also catches Tailwind arbitrary properties such as `[text-transform:uppercase]`.
const TEXT_TRANSFORM_RE = /(?:text-transform|textTransform)["']?\s*:\s*["']?uppercase\b/

// font-variant / font-variant-caps with a small-caps family value.
const SMALL_CAPS_RE = /(?:font-variant(?:-caps)?|fontVariant(?:Caps)?)["']?\s*:\s*["']?[^;"'}]*(?:small-caps|all-small-caps|petite-caps|all-petite-caps|titling-caps)/

// OpenType small-caps features forced through font-feature-settings.
const FEATURE_RE = /["'](?:smcp|c2sc|pcap|c2pc)["']/

const HINT = 'Uppercase text reduces readability. Write the label in its natural case instead (e.g. "Side menu", not "SIDE MENU").'

function isCommentLine(line: string): boolean {
  return /^\s*(?:\/\/|\/\*|\*)/.test(line)
}

export const rule: Rule<Config> = {
  id: 'shared/no-uppercase-text',
  tags: 'shared',
  defaultScope: ['**/*.tsx', '**/*.ts', '**/*.css'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []
    for (const file of files) {
      if (EXCLUDED_FILE_RE.test(file)) {
        continue
      }
      const text = await readFile(file, 'utf8').catch(() => '')
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        if (isCommentLine(line)) {
          continue
        }
        let what: string | undefined
        if (TAILWIND_UPPERCASE_RE.test(line) && CLASS_CONTEXT_RE.test(line)) {
          what = 'Tailwind uppercase utility'
        } else if (TEXT_TRANSFORM_RE.test(line)) {
          what = 'CSS text-transform uppercase'
        } else if (SMALL_CAPS_RE.test(line)) {
          what = 'small-caps font variant'
        } else if (FEATURE_RE.test(line)) {
          what = 'small-caps OpenType feature'
        }
        if (what) {
          violations.push({ file, line: i + 1, message: `${what} found. ${HINT}` })
        }
      }
    }
    return violations
  },
}
