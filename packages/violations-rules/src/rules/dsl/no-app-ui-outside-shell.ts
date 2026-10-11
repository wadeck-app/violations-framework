import { readFile } from 'node:fs/promises'
import type { Rule, Violation } from '../types.js'

export type Config = Record<never, never>

// Complements dsl/no-app-components (flags components/ by presence) and
// dsl/no-app-hook (flags any exported hook) by catching UI code defined
// ad-hoc anywhere else in a *-app package's src/ - e.g. a component or
// context created directly in a loose file instead of under components/.
//
// Allowed locations (never flagged): build/, generated/, dsl/, mock/, runners/,
// main.tsx, App.tsx, registry.ts. components/ is deliberately NOT allowed here
// even though it's skipped below - dsl/no-app-components already flags every
// file under components/ by presence, so re-flagging it here would duplicate
// the same violation under a different rule id.
const ALLOWED_SUBDIRS = new Set(['build', 'generated', 'dsl', 'mock', 'runners'])
const ALLOWED_FILES = new Set(['main.tsx', 'App.tsx', 'registry.ts'])
const SKIP_SUBDIRS = new Set(['components'])

const APP_SRC_RE = /[\\/]packages[\\/]([^\\/]+-app)[\\/]src[\\/](.+)$/

function relFromAppSrc(file: string): { appPkg: string; relFromSrc: string } | null {
  const normalized = file.split('\\').join('/')
  const m = APP_SRC_RE.exec(normalized)
  if (!m) {
    return null
  }
  return { appPkg: m[1], relFromSrc: m[2] }
}

function isAllowed(relFromSrc: string): boolean {
  if (ALLOWED_FILES.has(relFromSrc)) {
    return true
  }
  const firstSegment = relFromSrc.split('/')[0]
  return firstSegment != null && ALLOWED_SUBDIRS.has(firstSegment)
}

function isSkipped(relFromSrc: string): boolean {
  const firstSegment = relFromSrc.split('/')[0]
  return firstSegment != null && SKIP_SUBDIRS.has(firstSegment)
}

function containsUiCode(source: string): boolean {
  if (/(?:React\.)?createContext\s*[<(]/.test(source)) {
    return true
  }
  return /export\s+function\s+[A-Z]/.test(source)
}

// A file whose only non-blank, non-comment lines are `export { ... } from ...`
// is a re-export shim, not a UI definition - must not be flagged.
function isReExportShim(source: string): boolean {
  const lines = source.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') {
      continue
    }
    if (trimmed.startsWith('//')) {
      continue
    }
    if (/^export\s*\{[^}]*\}\s*from\s*['"]/.test(trimmed)) {
      continue
    }
    if (/^export\s+type\s*\{[^}]*\}\s*from\s*['"]/.test(trimmed)) {
      continue
    }
    return false
  }
  return true
}

// dsl-wdrive-app -> dsl-ui-wdrive, dsl-agent-fleet-app -> dsl-ui-agent-fleet, orch-app -> ui-orch
function companionUiPkg(appPkg: string): string {
  return appPkg.replace(/^dsl-/, 'dsl-ui-').replace(/-app$/, '')
}

export const rule: Rule<Config> = {
  id: 'dsl/no-app-ui-outside-shell',
  tags: 'dsl',
  defaultScope: ['packages/*-app/src/**/*.ts', 'packages/*-app/src/**/*.tsx'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const file of files) {
      const located = relFromAppSrc(file)
      if (!located) {
        continue
      }
      const { appPkg, relFromSrc } = located
      if (isAllowed(relFromSrc) || isSkipped(relFromSrc)) {
        continue
      }

      let source: string
      try {
        source = await readFile(file, 'utf8')
      } catch {
        continue
      }
      if (isReExportShim(source)) {
        continue
      }
      if (!containsUiCode(source)) {
        continue
      }

      violations.push({
        file,
        line: 1,
        message: `UI code (React component or context) found outside allowed locations in ${appPkg}. Move to dsl-ui or ${companionUiPkg(appPkg)}.`,
      })
    }

    return violations
  },
}
