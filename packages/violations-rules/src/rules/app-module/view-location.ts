import { existsSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import type { Rule, Violation } from '../types.js'
import { moduleRootOfRootFile, toPosix } from './layout.js'
import { validateSourceManifest, viewContentProblem } from './source-manifest.js'

export type Config = Record<never, never>

// Every path-type view in the source manifest must be a file inside src/dsl-views/ holding a YAML/JSON
// object (DSL data, never code). Mirrors `app-core-cli check`. An invalid manifest is left to
// app-module/manifest-exists-and-valid.
export const rule: Rule<Config> = {
  id: 'app-module/view-location',
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

      let result
      try {
        result = validateSourceManifest(JSON.parse(readFileSync(manifestPath, 'utf-8')))
      } catch {
        continue
      }
      if (!result.ok) {
        continue
      }

      const viewsDir = join(root, 'src', 'dsl-views')
      const seen = new Set<string>()
      result.manifest.extensionPoints.forEach((ep, index) => {
        if (ep.view.type !== 'path') {
          return
        }
        const value = String(ep.view.value)
        const abs = resolve(root, value)
        if (seen.has(abs)) {
          return
        }
        seen.add(abs)

        const insideViews = toPosix(relative(viewsDir, abs))
        if (insideViews.startsWith('..') || isAbsolute(insideViews)) {
          violations.push({ file: manifestPath, line: 1, message: `extensionPoints[${index}].view.value "${value}" must be inside src/dsl-views/. Move the file there and reference it as "./src/dsl-views/<file>.yaml".` })
          return
        }
        if (!existsSync(abs) || !statSync(abs).isFile()) {
          violations.push({ file: manifestPath, line: 1, message: `extensionPoints[${index}].view.value "${value}" does not exist. Create the file, or fix the path.` })
          return
        }
        const problem = viewContentProblem(abs, readFileSync(abs, 'utf-8'))
        if (problem !== undefined) {
          violations.push({ file: abs, line: 1, message: problem })
        }
      })
    }

    return violations
  },
}
