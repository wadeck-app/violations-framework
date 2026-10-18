import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

// Inline temp modules for the app-module/* rule tests. `files` overrides or adds files by
// module-relative path; null deletes a default file.
export const VALID_MODULE_FILES: Record<string, string> = {
  'manifest.json': JSON.stringify({
    id: 'fixture',
    extensionPoints: [{ kind: 'page', slot: 'nav', label: 'Fixture', view: { type: 'path', value: './src/dsl-views/page.yaml' } }],
  }),
  'package.json': JSON.stringify({ name: 'app-module-fake', files: ['dist-module'] }),
  '.gitignore': 'dist-module\n',
  'src/backend/index.ts': 'export default function (ctx: unknown): void {\n  void ctx\n}\n',
  'src/dsl-views/page.yaml': '$type: Badge\nlabel: ok\n',
}

export type TempModule = {
  // Parent folder of the module; removed by cleanup().
  base: string
  // Module root (<base>/packages/app-module-fake).
  root: string
  // Absolute path of a module-relative path.
  at(rel: string): string
  cleanup(): void
}

export function createModule(files: Record<string, string | null> = {}, folderName = 'app-module-fake'): TempModule {
  const base = mkdtempSync(join(tmpdir(), 'violations-app-module-'))
  const root = join(base, 'packages', folderName)
  const merged: Record<string, string | null> = { ...VALID_MODULE_FILES, ...files }
  for (const [rel, content] of Object.entries(merged)) {
    if (content === null) {
      continue
    }
    const abs = join(root, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content)
  }
  mkdirSync(root, { recursive: true })
  return { base, root, at: (rel) => join(root, rel), cleanup: () => rmSync(base, { recursive: true, force: true }) }
}

// The valid manifest with extra top-level keys merged in (dslLib, requires, ...).
export function manifestWith(extra: Record<string, unknown>): string {
  return JSON.stringify({ ...JSON.parse(VALID_MODULE_FILES['manifest.json']), ...extra })
}

export function manifestWithView(view: unknown): string {
  return JSON.stringify({ id: 'fixture', extensionPoints: [{ kind: 'page', slot: 'nav', label: 'F', view }] })
}
