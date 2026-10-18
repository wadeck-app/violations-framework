import { readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { isDir, listFiles, moduleRootOfRootFile, OUTPUT_DIR, SRC_DIRS } from './layout.js'

export type Config = Record<never, never>

// Module layout (decision 81): only manifest.json/package files at the root, sources only under
// src/{backend,dsl-views,dsl-components,commons}, and only data files in src/dsl-views.
// Mirrors `app-core-cli check`. Anchored on manifest.json (always present in a module).
const ROOT_DIRS = new Set(['src', OUTPUT_DIR, 'node_modules'])
const ROOT_FILES = new Set(['manifest.json', 'package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock'])
const ROOT_FILE_PATTERNS = [/^README(\..+)?$/i, /^LICENSE(\..+)?$/i, /^CHANGELOG(\..+)?$/i, /^tsconfig(\..+)?\.json$/, /\.config\.(?:[cm]?[jt]s|json)$/]
const VIEW_EXTENSIONS = new Set(['.yaml', '.yml', '.json'])

function isRootEntryAllowed(name: string, isDirectory: boolean): boolean {
  // Dot entries (.gitignore, .app-core-dev, .github, ...) are always allowed.
  if (name.startsWith('.')) {
    return true
  }
  if (isDirectory) {
    return ROOT_DIRS.has(name)
  }
  return ROOT_FILES.has(name) || ROOT_FILE_PATTERNS.some((pattern) => pattern.test(name))
}

export const rule: Rule<Config> = {
  id: 'app-module/source-layout',
  tags: 'app-module',
  alwaysActive: true,
  defaultScope: ['**/app-module-*/manifest.json'],
  defaultSeverity: 'error',

  async check(files: string[], _config: Config): Promise<Violation[]> {
    const violations: Violation[] = []

    for (const manifestPath of files) {
      const root = moduleRootOfRootFile(manifestPath)
      if (root === undefined) {
        continue
      }

      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (!isRootEntryAllowed(entry.name, entry.isDirectory())) {
          violations.push({
            file: join(root, entry.name),
            line: 1,
            message: `"${entry.name}" is not allowed at the module root. Move sources into src/{${SRC_DIRS.join(',')}}; only src, ${OUTPUT_DIR}, node_modules, dot folders, manifest.json, package files, README*, LICENSE*, tsconfig*.json and *.config.* are allowed.`,
          })
        }
      }

      const srcDir = join(root, 'src')
      if (!isDir(srcDir)) {
        violations.push({ file: manifestPath, line: 1, message: `the module has no src/ folder. Create src/ with the folders you need among ${SRC_DIRS.join(', ')}.` })
        continue
      }
      for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
          violations.push({ file: join(srcDir, entry.name), line: 1, message: `files are not allowed directly under src/. Move it into one of src/${SRC_DIRS.join(', src/')}.` })
        } else if (!(SRC_DIRS as readonly string[]).includes(entry.name)) {
          violations.push({ file: join(srcDir, entry.name), line: 1, message: `"${entry.name}" is not a known source folder. Use only ${SRC_DIRS.join(', ')} under src/ (shared code goes to src/commons).` })
        }
      }

      const viewsDir = join(srcDir, 'dsl-views')
      if (isDir(viewsDir)) {
        for (const file of listFiles(viewsDir)) {
          const ext = extname(file).toLowerCase()
          if (!VIEW_EXTENSIONS.has(ext)) {
            violations.push({
              file,
              line: 1,
              message: `only .yaml, .yml and .json files are allowed in src/dsl-views, got "${ext || '(no extension)'}". Move code to src/dsl-components (React) or src/backend.`,
            })
          }
        }
      }
    }

    return violations
  },
}
