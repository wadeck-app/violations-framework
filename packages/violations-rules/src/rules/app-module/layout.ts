import { existsSync, readdirSync, statSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { join, relative, sep } from 'node:path'

// Shared by the app-module/* rules. Replicates the layout verdicts of `app-core-cli check`
// (app-core: packages/app-core-cli/src/check.ts, the authoritative implementation) with plain text
// scanning: the CLI is a bin-only package and these rules must run without it.
// layout-parity.test.ts pins the expected verdict of 28 reference modules, so a drift is visible.

export const SRC_DIRS = ['backend', 'dsl-views', 'dsl-components', 'commons'] as const
export type SrcDir = (typeof SRC_DIRS)[number]

export const OUTPUT_DIR = 'dist-module'
export const BACKEND_ENTRY = 'src/backend/index.ts'

// Folders that are never module sources: generated output, dev scratch data, installed dependencies.
// Rule has no `defaultExclude` field (only config-level globalExclude / $exclude), so every app-module
// rule applies this default itself through moduleRootOf() / isExcludedPath().
export const EXCLUDED_FOLDERS = [OUTPUT_DIR, '.app-core-dev', 'node_modules', '.check-out'] as const

// Which source folder may not import which.
export const FORBIDDEN_FOLDER_IMPORTS: Record<SrcDir, SrcDir[]> = {
  backend: ['dsl-components'],
  commons: ['backend', 'dsl-components'],
  'dsl-components': ['backend'],
  'dsl-views': [],
}

const NODE_BUILTINS = new Set(builtinModules)

export function toPosix(p: string): string {
  return p.split(sep).join('/').replaceAll('\\', '/')
}

// True when the path is inside generated output, dev scratch data or installed dependencies.
export function isExcludedPath(file: string): boolean {
  const posix = toPosix(file)
  return EXCLUDED_FOLDERS.some((folder) => posix.includes(`/${folder}/`))
}

// The module folder of a file: the nearest ancestor named app-module-<name>. Generated output and
// installed dependencies are not module sources.
export function moduleRootOf(file: string): string | undefined {
  if (isExcludedPath(file)) {
    return undefined
  }
  const parts = toPosix(file).split('/')
  for (let i = parts.length - 2; i >= 0; i--) {
    if (/^app-module-.+/.test(parts[i])) {
      return parts.slice(0, i + 1).join('/')
    }
  }
  return undefined
}

// The module root of a file that sits directly in it (manifest.json, package.json), else undefined.
export function moduleRootOfRootFile(file: string): string | undefined {
  const root = moduleRootOf(file)
  if (root === undefined) {
    return undefined
  }
  const posix = toPosix(file)
  return posix.slice(0, posix.lastIndexOf('/')) === root ? root : undefined
}

export function srcFolderOf(moduleRoot: string, absolute: string): SrcDir | undefined {
  const rel = toPosix(relative(join(moduleRoot, 'src'), absolute))
  return SRC_DIRS.find((dir) => rel === dir || rel.startsWith(`${dir}/`))
}

export function isReactSpecifier(spec: string): boolean {
  return spec === 'react' || spec === 'react-dom' || spec.startsWith('react/') || spec.startsWith('react-dom/')
}

export function isNodeSpecifier(spec: string): boolean {
  return spec.startsWith('node:') || NODE_BUILTINS.has(spec)
}

// Comments are removed first so a commented-out import is not reported. The `//` pattern skips `://`
// so URLs inside strings survive.
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')
}

// Runtime import specifiers. `import type` / `export type` are erased by the compiler, so like the CLI
// (esbuild) they do not count. `line` is where the statement starts.
export function importSpecifiers(source: string): Array<{ spec: string; line: number }> {
  const stripped = stripComments(source)
  const patterns = [
    /\b(?:import|export)\s+(?!type\s)[^'"`;]*?\sfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]
  const found: Array<{ spec: string; line: number }> = []
  for (const pattern of patterns) {
    for (const match of stripped.matchAll(pattern)) {
      found.push({ spec: match[1], line: stripped.slice(0, match.index).split('\n').length })
    }
  }
  return found
}

export function hasDefaultExport(source: string): boolean {
  const stripped = stripComments(source)
  return /\bexport\s+default\b/.test(stripped) || /\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/.test(stripped)
}

export function isDir(p: string): boolean {
  return existsSync(p) && statSync(p).isDirectory()
}

export function listFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(abs))
    } else {
      files.push(abs)
    }
  }
  return files.sort()
}
