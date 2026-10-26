import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './no-raw-color-in-views.js'

describe('app-module/no-raw-color-in-views', () => {
  async function checkLine(line: string): Promise<ReturnType<typeof rule.check>> {
    const dir = await mkdtemp(join(tmpdir(), 'violations-raw-color-'))
    const appDir = join(dir, 'packages', 'app-module-fake', 'src', 'dsl-views')
    await mkdir(appDir, { recursive: true })
    const file = join(appDir, 'view.yaml')
    await writeFile(file, `${line}\n`)
    try {
      return await rule.check([file], {})
    } finally {
      await rm(dir, { recursive: true })
    }
  }

  const flagged: Array<[string, string]> = [
    ['color: "#fff"', 'hex-color'],
    ["color: '#1e293b'", 'hex-color'],
    ['color: "#1e293bcc"', 'hex-color'],
    ['background: rgb(0 0 0)', 'functional-color'],
    ['background: hsla(10, 20%, 30%, 0.5)', 'functional-color'],
    ['className: bg-white p-2', 'fixed-palette-class'],
    ['className: "text-gray-700"', 'fixed-palette-class'],
    ['className: hover:border-red-500', 'fixed-palette-class'],
    ['className: dark:bg-surface', 'dark-variant'],
  ]

  for (const [line, kind] of flagged) {
    it(`flags ${kind}: ${line}`, async () => {
      const violations = await checkLine(line)
      assert.equal(violations.length, 1, `expected exactly 1 violation for: ${line}`)
    })
  }

  const clean: string[] = [
    '# a comment mentioning #fff and bg-white',
    'variant: danger',
    'className: bg-surface text-content border-border',
    'className: text-muted',
    'label: "Issue #123"',
    'label: "Dark mode"',
    'key: dark',
    'className: text-white-ish',
  ]

  for (const line of clean) {
    it(`does not flag: ${line}`, async () => {
      const violations = await checkLine(line)
      assert.equal(violations.length, 0, `expected no violations for: ${line}`)
    })
  }

  it('reports the matched text and the Dark theme README pointer in the message', async () => {
    const violations = await checkLine('color: "#fff"')
    assert.equal(violations.length, 1)
    assert.match(violations[0].message, /"#fff"/)
    assert.match(violations[0].message, /ThemeScope/)
    assert.match(violations[0].message, /Dark theme/)
  })

  it('does not flag a YAML comment line even if it contains flaggable text', async () => {
    const violations = await checkLine('  # className: bg-white')
    assert.equal(violations.length, 0)
  })

  // Real-world true negative: the 3 shipped app-module-queue DSL views (queue
  // repo, verified by hand before writing this rule) - inlined here rather
  // than read from the other repo's path, so this test has no cross-repo
  // filesystem dependency.
  const realWorldFixtures: Record<string, string> = {
    'dlq-widget.yaml': [
      '# See status-widget.yaml for the StatTile confirmation note.',
      '$sources:',
      '  status:',
      '    url: GET /api/modules/queue/status',
      '',
      '$type: StatTile',
      'label: Failed events (DLQ)',
      'value: $sources.status.dlqCount',
      '',
    ].join('\n'),
    'history-page.yaml': [
      '# DataTable schema: rows + columns[{key,label,format?,mono?}]. format enum includes "datetime" (ts column).',
      '# Pagination and PageSizeSelect require dsl-ui version with urlParam support (not yet published).',
      '$sources:',
      '  history:',
      '    url: GET /api/modules/queue/history',
      '    params:',
      '      page: $urlParam.page',
      '      limit: $urlParam.size',
      '',
      '$type: PageContent',
      'sections:',
      '  - $type: DataTable',
      '    rows: $sources.history.entries',
      '    columns:',
      '      - { key: "ts", label: "Time", format: "datetime" }',
      '      - { key: "event", label: "Event" }',
      '      - { key: "eventId", label: "Event ID", mono: true }',
      '      - { key: "project", label: "Project" }',
      '      - { key: "matchedCount", label: "Matched" }',
      '      - { key: "totalCount", label: "Total" }',
      '',
      '  # HorizontalStack takes Tailwind classes; its DSL children key is `items` (see dsl-agent-fleet-app dashboard.yaml)',
      '  - $type: HorizontalStack',
      '    justify: justify-between',
      '    align: items-center',
      '    gap: gap-3',
      '    items:',
      '      - $type: Pagination',
      '        urlParam: page',
      '        total: $sources.history.total',
      '        size: $sources.history.limit',
      '',
      '      - $type: PageSizeSelect',
      '        urlParam: size',
      '        options: [20, 50, 100]',
      '        value: $sources.history.limit',
      '',
    ].join('\n'),
    'status-widget.yaml': [
      '# StatTile confirmed as a real registered dsl-ui $type (packages/dsl-ui/src/components/layout/StatTile.tsx,',
      '# @registryTags "stat kpi metric dashboard") - contract is TS-interface-only (no generated zod schema),',
      '# confirmed via dsl-owner research 2026-10-11: { label: string, value: string|number, trend?, icon?, loading? }.',
      '$sources:',
      '  status:',
      '    url: GET /api/modules/queue/status',
      '',
      '$type: StatTile',
      'label: Pending events',
      'value: $sources.status.pendingCount',
      '',
    ].join('\n'),
  }

  it('reports 0 violations against the 3 real app-module-queue DSL views', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-raw-color-realworld-'))
    const appDir = join(dir, 'packages', 'app-module-queue', 'src', 'dsl-views')
    await mkdir(appDir, { recursive: true })
    try {
      const files: string[] = []
      for (const [name, content] of Object.entries(realWorldFixtures)) {
        const file = join(appDir, name)
        await writeFile(file, content)
        files.push(file)
      }
      const violations = await rule.check(files, {})
      assert.equal(violations.length, 0)
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
