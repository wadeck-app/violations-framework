import { manifestWith, manifestWithView } from './app-module-fixtures.js'

// Reference modules for layout-parity.test.ts, ported from app-core (.violations/lib/appModuleLayoutParity.test.ts).
// `fails` is the verdict of `app-core-cli check` (packages/app-core-cli/src/check.ts) on the module:
// true = it reports at least one problem. The app-module rules must reach the same verdict.
// Files are module-relative; null deletes a default file of the valid module (see app-module-fixtures.ts).
export type ParityScenario = { name: string; fails: boolean; files: Record<string, string | null> }

export const PARITY_SCENARIOS: ParityScenario[] = [
  { name: 'valid module', fails: false, files: {} },
  {
    name: 'valid module with commons, components and tooling files',
    fails: false,
    files: {
      'README.md': '#',
      'tsconfig.json': '{}',
      'src/commons/a.ts': 'export const a = 1;\n',
      'manifest.json': manifestWith({ dslLib: { shared: { react: '^19' } } }),
      'src/dsl-components/index.ts': "import { a } from '../commons/a.js';\nexport default [a];\n",
      'src/dsl-components/Card.tsx': "import { useState } from 'react';\nexport const Card = useState;\n",
    },
  },
  { name: 'legacy root folder', fails: true, files: { 'api-backend/index.js': 'x' } },
  { name: 'stray root file', fails: true, files: { 'helper.ts': 'export {};\n' } },
  { name: 'unknown src folder', fails: true, files: { 'src/utils/a.ts': 'export {};\n' } },
  { name: 'loose file under src', fails: true, files: { 'src/loose.ts': 'export {};\n' } },
  { name: 'code in dsl-views', fails: true, files: { 'src/dsl-views/x.ts': 'export {};\n' } },
  { name: 'tsx in backend', fails: true, files: { 'src/backend/W.tsx': 'export const x = 1;\n' } },
  { name: 'react in backend', fails: true, files: { 'src/backend/index.ts': "import 'react';\nexport default () => {};\n" } },
  { name: 'react in commons', fails: true, files: { 'src/commons/a.ts': "import { useState } from 'react';\nexport { useState };\n" } },
  { name: 'node in commons', fails: true, files: { 'src/commons/a.ts': "import fs from 'node:fs';\nexport { fs };\n" } },
  { name: 'bare node builtin in commons', fails: true, files: { 'src/commons/a.ts': "import path from 'path';\nexport { path };\n" } },
  { name: 'backend imports dsl-components', fails: true, files: { 'src/backend/index.ts': "import '../dsl-components/x.js';\nexport default () => {};\n" } },
  { name: 'dsl-components imports backend', fails: true, files: { 'src/dsl-components/x.ts': "import { y } from '../backend/y.js';\nexport { y };\n" } },
  { name: 'commons imports backend', fails: true, files: { 'src/commons/a.ts': "import { y } from '../backend/y.js';\nexport { y };\n" } },
  { name: 'type-only import of node in commons', fails: false, files: { 'src/commons/a.ts': "import type { Stats } from 'node:fs';\nexport type S = Stats;\n" } },
  { name: 'commented-out react import', fails: false, files: { 'src/backend/index.ts': "// import 'react';\nexport default () => {};\n" } },
  { name: 'missing backend entry', fails: true, files: { 'src/backend/index.ts': null, 'src/backend/other.ts': 'export {};\n' } },
  { name: 'backend entry without default export', fails: true, files: { 'src/backend/index.ts': 'export const x = 1;\n' } },
  {
    name: 'view outside dsl-views',
    fails: true,
    files: { 'manifest.json': manifestWithView({ type: 'path', value: './page.yaml' }), 'page.yaml': '$type: Badge\n' },
  },
  { name: 'missing view file', fails: true, files: { 'src/dsl-views/page.yaml': null } },
  { name: 'view not an object', fails: true, files: { 'src/dsl-views/page.yaml': '- a\n' } },
  { name: 'manifest not an object', fails: true, files: { 'manifest.json': '[]' } },
  { name: 'dslLib without components entry', fails: true, files: { 'manifest.json': manifestWith({ dslLib: { shared: {} } }) } },
  { name: 'components without dslLib', fails: true, files: { 'src/dsl-components/index.ts': 'export default [];\n' } },
  { name: 'no .gitignore', fails: true, files: { '.gitignore': null } },
  { name: '.gitignore without dist-module', fails: true, files: { '.gitignore': 'dist\n' } },
  { name: 'wrong package files', fails: true, files: { 'package.json': JSON.stringify({ files: ['src'] }) } },
]
