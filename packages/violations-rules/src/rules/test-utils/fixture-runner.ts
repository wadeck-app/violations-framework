import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } from 'node:fs'
import { join, dirname, relative, basename, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import type { Rule } from '../../types.js'

function collectFixtures(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const result: string[] = []
  for (const entry of entries) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...collectFixtures(abs))
    else if (entry.name.endsWith('.cs') && !entry.name.endsWith('.cs.expected')) result.push(abs)
  }
  return result
}

function resolveFixturesDir(callerImportMetaUrl: string, fixtureDirName: string): string {
  const callerPath = fileURLToPath(callerImportMetaUrl)
  // Tests run from dist/ but fixtures live in src/.
  // Replace the first /dist/ segment with /src/ to locate fixtures alongside source.
  const srcPath = callerPath.replace(
    new RegExp(`(${sep.replace('\\', '\\\\')}|/)dist(${sep.replace('\\', '\\\\')}|/)`),
    `$1src$2`,
  )
  return join(dirname(srcPath), 'fixtures', fixtureDirName)
}

function runFixtureSuiteInDir(fixturesDir: string, rule: Rule<Record<string, unknown>>): void {
  const fixtures = collectFixtures(fixturesDir)

  for (const fixtureAbs of fixtures) {
    const relToBase = relative(fixturesDir, fixtureAbs).replace(/\\/g, '/')
    it(relToBase, async () => {
      const expectedFile = fixtureAbs + '.expected'
      assert.ok(existsSync(expectedFile), `Missing .expected: ${relToBase}.expected`)
      const expectedRaw = readFileSync(expectedFile, 'utf8').trim()

      const expectedViolations = expectedRaw === 'CLEAN'
        ? []
        : expectedRaw.split('\n').map(line => {
            const colonIdx = line.indexOf(':')
            return { line: parseInt(line.slice(0, colonIdx), 10), ruleId: line.slice(colonIdx + 1).trim() }
          })

      const tmpRoot = mkdtempSync(join(tmpdir(), 'vtest-'))
      const relDir = dirname(relToBase)
      const destDir = relDir === '.' ? tmpRoot : join(tmpRoot, relDir)
      mkdirSync(destDir, { recursive: true })
      const destFile = join(destDir, basename(fixtureAbs))
      copyFileSync(fixtureAbs, destFile)

      try {
        const actual = (await rule.check([destFile], {})).map(v => ({
          line: v.line,
          ruleId: rule.id,
        }))
        assert.deepEqual(
          actual.sort((a, b) => a.line - b.line),
          expectedViolations.sort((a, b) => a.line - b.line),
        )
      } finally {
        rmSync(tmpRoot, { recursive: true, force: true })
      }
    })
  }
}

/**
 * Registers a `describe` block that runs one `it()` per fixture file found
 * under `src/rules/<tag>/fixtures/<fixtureDirName>`.
 *
 * @param rule - The rule under test.
 * @param callerImportMetaUrl - Pass `import.meta.url` from the calling test file.
 * @param fixtureDirName - Name of the fixtures subdirectory (e.g. `'no-namespace'`).
 * @param describeLabel - Optional override for the describe label; defaults to `rule.id`.
 */
export function runFixtureSuite(
  rule: Rule<Record<string, unknown>>,
  callerImportMetaUrl: string,
  fixtureDirName: string,
  describeLabel?: string,
): void {
  const fixturesDir = resolveFixturesDir(callerImportMetaUrl, fixtureDirName)
  describe(describeLabel ?? rule.id, () => {
    runFixtureSuiteInDir(fixturesDir, rule)
  })
}

/**
 * Same as `runFixtureSuite` but registers the fixture `it()` calls directly
 * into the **current** `describe` block instead of creating a new one.
 * Use this when the caller already wraps the suite in its own `describe`.
 */
export function runFixtureSuiteInline(
  rule: Rule<Record<string, unknown>>,
  callerImportMetaUrl: string,
  fixtureDirName: string,
): void {
  const fixturesDir = resolveFixturesDir(callerImportMetaUrl, fixtureDirName)
  runFixtureSuiteInDir(fixturesDir, rule)
}
