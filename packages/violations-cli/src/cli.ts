#!/usr/bin/env node
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, resolve, extname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { UpdateManager } from '@wadeck-app/shared-cli'
import { ConfigDir } from '@wadeck-app/shared-cli/ConfigDir'
import { loadUserConfig } from './config.js'
import { VERSION } from './version.js'
import { run } from './runner.js'
import { writeReports } from './report.js'
import { compileIfNeeded, typeCheck } from './compiler.js'
import { runSelfChecks, printSelfChecks } from './selfCheck.js'
import type { RuleResult } from '@wadeck-app/violations-rules'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Help constants
// ---------------------------------------------------------------------------

const RULES_GROUP_HELP = `violations rules - manage violation rules

Usage:
  violations rules list [--tag <tag>]
  violations rules info <id>
  violations rules create <name> --lang ts|js
`

const CONFIG_GROUP_HELP = `violations config - manage project configuration

Usage:
  violations config validate
`

const CACHE_GROUP_HELP = `violations cache - manage compilation cache

Usage:
  violations cache clear
`

const CLI_GROUP_HELP = `violations cli - CLI tooling commands

Usage:
  violations cli self-check
  violations cli update
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function printUsage(): void {
	console.log(`violations - code quality rule runner

Usage:
  violations check [--staged] [--files a,b,c]
  violations test [--local] [--rule <id>]
  violations rules list [--tag <tag>]
  violations rules info <id>
  violations rules create <name> --lang ts|js
  violations config validate
  violations cache clear
  violations cli self-check
  violations cli update

Exit codes:
  0  ok
  1  error
  N  violation count (check)

Env vars:
  VIOLATIONS_CONFIG_DIR   override the config directory
  CLI_SELF_CHECK_QUIET    set to 1 to suppress [ok] lines in self-check
`)
}

function getProjectRoot(): string {
	return process.cwd()
}

function getDotViolationsDir(projectRoot: string): string {
	return join(projectRoot, '.violations')
}

async function getPackageVersion(): Promise<string> {
	try {
		const pkgPath = join(__dirname, '..', 'package.json')
		const raw = await readFile(pkgPath, 'utf8')
		const pkg = JSON.parse(raw) as { version: string }
		return pkg.version
	} catch {
		return '0.0.0'
	}
}

// ---------------------------------------------------------------------------
// `violations check`
// ---------------------------------------------------------------------------

function formatViolations(results: RuleResult[]): { lines: string[]; errors: number; warnings: number } {
	const lines: string[] = []
	let errors = 0
	let warnings = 0

	for (const result of results) {
		for (const v of result.violations) {
			const loc = v.line ? `${v.file}:${v.line}` : v.file
			lines.push(`${loc}  ${v.message}  [${result.ruleId}]`)
			if (result.severity === 'error') errors++
			else if (result.severity === 'warning') warnings++
		}
	}

	return { lines, errors, warnings }
}


async function cmdCheck(args: string[]): Promise<void> {
	const projectRoot = getProjectRoot()
	const dotViolationsDir = getDotViolationsDir(projectRoot)

	const configTs = join(dotViolationsDir, 'config.ts')
	const configJs = join(dotViolationsDir, 'config.js')
	if (!existsSync(configTs) && !existsSync(configJs)) {
		process.stderr.write('No .violations/config.ts found. Run: violations rules create\n')
		process.exit(1)
	}

	let staged = false
	let files: string[] | undefined

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--staged') {
			staged = true
		} else if (args[i] === '--files' && args[i + 1]) {
			files = args[i + 1].split(',').map(f => f.trim())
			i++
		} else if (args[i]?.startsWith('--files=')) {
			files = args[i].slice('--files='.length).split(',').map(f => f.trim())
		}
	}

	const results = await run({ projectRoot, staged, files })
	await writeReports(dotViolationsDir, results)

	const { lines, errors, warnings } = formatViolations(results)
	const totalViolations = results.reduce((s, r) => s + r.counts.violations, 0)

	for (const line of lines) {
		console.log(line)
	}

	if (totalViolations === 0) {
		console.log('[ok] 0 violations')
	} else {
		const parts: string[] = []
		if (errors > 0) parts.push(`${errors} error${errors === 1 ? '' : 's'}`)
		if (warnings > 0) parts.push(`${warnings} warning${warnings === 1 ? '' : 's'}`)
		const rest = totalViolations - errors - warnings
		if (rest > 0) parts.push(`${rest} info`)
		const breakdown = parts.length > 0 ? `  (${parts.join(', ')})` : ''
		console.log(`${totalViolations} violation${totalViolations === 1 ? '' : 's'}${breakdown}`)
	}

	process.exit(Math.min(totalViolations, 254))
}

// ---------------------------------------------------------------------------
// `violations test`
// ---------------------------------------------------------------------------

async function cmdTest(args: string[]): Promise<void> {
	const projectRoot = getProjectRoot()
	const dotViolationsDir = getDotViolationsDir(projectRoot)

	let localOnly = false
	let ruleId: string | undefined

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--local') {
			localOnly = true
		} else if (args[i] === '--rule' && args[i + 1]) {
			ruleId = args[i + 1]
			i++
		} else if (args[i]?.startsWith('--rule=')) {
			ruleId = args[i].slice('--rule='.length)
		}
	}

	const { run: nodeTestRun, describe: _d } = await import('node:test')

	// Collect test files
	const testFiles: string[] = []

	if (ruleId) {
		// Single rule: search local then compiled package
		const localPattern = join(dotViolationsDir, 'rules', `${ruleId}.test.*`)
		const localFiles = await glob(localPattern)
		testFiles.push(...localFiles)

		// Also look for compiled package test
		const pkgTest = join(__dirname, '..', 'dist', 'rules', `${ruleId}.test.js`)
		if (existsSync(pkgTest)) testFiles.push(pkgTest)
	} else if (localOnly) {
		const localDir = join(dotViolationsDir, 'rules')
		if (existsSync(localDir)) {
			const found = await globDir(localDir, /\.test\.[jt]s$/)
			testFiles.push(...found)
		}
	} else {
		// All: compiled package tests + local
		const pkgTestDir = join(__dirname, '..', 'dist', 'rules')
		if (existsSync(pkgTestDir)) {
			const found = await globDir(pkgTestDir, /\.test\.js$/)
			testFiles.push(...found)
		}
		const localDir = join(dotViolationsDir, 'rules')
		if (existsSync(localDir)) {
			const found = await globDir(localDir, /\.test\.[jt]s$/)
			testFiles.push(...found)
		}
	}

	if (testFiles.length === 0) {
		console.log('No test files found.')
		process.exit(0)
	}

	// Compile TS test files before running
	const cacheDir = join(dotViolationsDir, '.cache')
	const manifestPath = join(cacheDir, 'manifest.json')
	const frameworkVersion = await getPackageVersion()
	const runnable: string[] = []

	for (const f of testFiles) {
		if (f.endsWith('.ts')) {
			const compiled = join(cacheDir, 'rules', basename(f, '.ts') + '.test.js')
			await compileIfNeeded(f, compiled, manifestPath, frameworkVersion)
			runnable.push(compiled)
		} else {
			runnable.push(f)
		}
	}

	// Use node:test programmatic runner
	let failed = false
	for (const file of runnable) {
		const stream = nodeTestRun({ files: [file] })
		// TestsStream is a readable stream - consume it
		await new Promise<void>((resolveP) => {
			stream.on('error', () => {
				failed = true
				resolveP()
			})
			stream.on('close', resolveP)
			// Pipe to process.stdout for output
			stream.pipe(process.stdout, { end: false })
		})
	}

	process.exit(failed ? 1 : 0)
}

// Minimal glob helper for directory listing
async function globDir(dir: string, pattern: RegExp): Promise<string[]> {
	const { readdir } = await import('node:fs/promises')
	const entries = await readdir(dir, { withFileTypes: true, recursive: true })
	const results: string[] = []
	for (const entry of entries) {
		if (entry.isFile() && pattern.test(entry.name)) {
			// Node 22: Dirent has .parentPath; Node 18/20: .path
			const parent = (entry as import('node:fs').Dirent & { parentPath?: string }).parentPath ?? dir
			results.push(join(parent, entry.name))
		}
	}
	return results
}

// Minimal single-file glob using pattern with wildcards
async function glob(pattern: string): Promise<string[]> {
	// Simple: check if file exists literally first
	if (existsSync(pattern)) return [pattern]
	// Otherwise check common extensions
	for (const ext of ['.ts', '.js']) {
		const candidate = pattern.replace(/\.\*$/, ext)
		if (existsSync(candidate)) return [candidate]
	}
	return []
}

// ---------------------------------------------------------------------------
// `violations rules list`
// ---------------------------------------------------------------------------

async function cmdRulesList(args: string[]): Promise<void> {
	let tagFilter: string | undefined
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--tag' && args[i + 1]) {
			tagFilter = args[i + 1]
			i++
		} else if (args[i]?.startsWith('--tag=')) {
			tagFilter = args[i].slice('--tag='.length)
		}
	}

	// Phase 3: rules index is empty
	let rules: Array<{ id: string; tags: string; defaultSeverity: string; defaultScope: string[] }> = []

	try {
		const mod = await import('@wadeck-app/violations-rules') as { allRules?: typeof rules }
		if (mod.allRules) {
			rules = mod.allRules
		}
	} catch {
		// Phase 4 not done yet
	}

	if (tagFilter) {
		rules = rules.filter(r => r.tags === tagFilter)
	}

	if (rules.length === 0) {
		console.log('No rules loaded yet.')
		return
	}

	// Table: id | tag | severity | description
	for (const r of rules) {
		const id = r.id.padEnd(40)
		const tag = r.tags.padEnd(12)
		const sev = r.defaultSeverity
		console.log(`${id} ${tag} ${sev}`)
	}
}

// ---------------------------------------------------------------------------
// `violations rules info`
// ---------------------------------------------------------------------------

async function cmdRulesInfo(id: string): Promise<void> {
	if (!id) {
		process.stderr.write('Usage: violations rules info <id>\n')
		process.exit(1)
	}

	let rule: { id: string; tags: string; defaultSeverity: string; defaultScope: string[] } | undefined

	try {
		const mod = await import(`@wadeck-app/violations-rules/rules/${id}`) as { default: typeof rule }
		rule = mod.default
	} catch {
		// Not found
	}

	if (!rule) {
		console.log(`Rule not found: ${id}`)
		process.exit(1)
	}

	console.log(`id:              ${rule.id}`)
	console.log(`tag:             ${rule.tags}`)
	console.log(`defaultSeverity: ${rule.defaultSeverity}`)
	console.log(`defaultScope:    ${rule.defaultScope.join(', ')}`)
}

// ---------------------------------------------------------------------------
// `violations rules create`
// ---------------------------------------------------------------------------

function buildRuleTemplate(name: string, lang: 'ts' | 'js'): string {
	if (lang === 'ts') {
		return `import type { Rule, Violation } from '@wadeck-app/violations-rules'

export const rule: Rule = {
  id: 'local/${name}',
  tags: 'shared',
  defaultScope: ['**/*'],
  defaultSeverity: 'error',
  async check(files: string[], _config: Record<never, never>): Promise<Violation[]> {
    const violations: Violation[] = []
    // TODO: implement
    return violations
  },
}

export default rule
`
	}
	return `/** @type {import('@wadeck-app/violations-rules').Rule} */
export const rule = {
  id: 'local/${name}',
  tags: 'shared',
  defaultScope: ['**/*'],
  defaultSeverity: 'error',
  async check(files, _config) {
    /** @type {import('@wadeck-app/violations-rules').Violation[]} */
    const violations = []
    // TODO: implement
    return violations
  },
}

export default rule
`
}

function buildTestTemplate(name: string, lang: 'ts' | 'js'): string {
	if (lang === 'ts') {
		return `import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './${name}.js'

describe('local/${name}', () => {
  it('returns no violations for a clean file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-test-'))
    try {
      const file = join(dir, 'clean.txt')
      await writeFile(file, 'clean content\\n')
      const result = await rule.check([file], {})
      assert.equal(result.length, 0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('returns a violation for a bad file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-test-'))
    try {
      const file = join(dir, 'bad.txt')
      await writeFile(file, 'TODO: implement test fixture\\n')
      const result = await rule.check([file], {})
      // TODO: assert result.length > 0
      assert.ok(Array.isArray(result))
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
`
	}
	return `import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rule } from './${name}.js'

describe('local/${name}', () => {
  it('returns no violations for a clean file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'violations-test-'))
    try {
      const file = join(dir, 'clean.txt')
      await writeFile(file, 'clean content\\n')
      const result = await rule.check([file], {})
      assert.equal(result.length, 0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
`
}

async function cmdRulesCreate(name: string, args: string[]): Promise<void> {
	if (!name) {
		process.stderr.write('Usage: violations rules create <name> --lang ts|js\n')
		process.exit(1)
	}

	let lang: 'ts' | 'js' = 'ts'
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--lang' && args[i + 1]) {
			const val = args[i + 1]
			if (val === 'ts' || val === 'js') lang = val
			i++
		} else if (args[i]?.startsWith('--lang=')) {
			const val = args[i].slice('--lang='.length)
			if (val === 'ts' || val === 'js') lang = val
		}
	}

	const projectRoot = getProjectRoot()
	const rulesDir = join(projectRoot, '.violations', 'rules')
	await mkdir(rulesDir, { recursive: true })

	const ruleFile = join(rulesDir, `${name}.${lang}`)
	const testFile = join(rulesDir, `${name}.test.${lang}`)

	if (existsSync(ruleFile)) {
		process.stderr.write(`Rule already exists: ${ruleFile}\n`)
		process.exit(1)
	}

	await writeFile(ruleFile, buildRuleTemplate(name, lang), 'utf8')
	await writeFile(testFile, buildTestTemplate(name, lang), 'utf8')

	console.log(`Created: ${ruleFile}`)
	console.log(`Created: ${testFile}`)
}

// ---------------------------------------------------------------------------
// `violations config validate`
// ---------------------------------------------------------------------------

async function cmdConfigValidate(): Promise<void> {
	const projectRoot = getProjectRoot()
	const dotViolationsDir = getDotViolationsDir(projectRoot)
	const configTs = join(dotViolationsDir, 'config.ts')

	if (!existsSync(configTs)) {
		process.stderr.write('[fail] No .violations/config.ts found. Run: violations rules create\n')
		process.exit(1)
	}

	const errors: string[] = []

	// Type-check the config
	const { errors: typeErrors } = await typeCheck(configTs)
	errors.push(...typeErrors)

	if (errors.length > 0) {
		process.stderr.write('[fail] TypeScript errors in config.ts:\n')
		for (const e of errors) {
			process.stderr.write(`  ${e}\n`)
		}
	}

	// Compile + dynamic import to inspect rule IDs
	const cacheDir = join(dotViolationsDir, '.cache')
	const manifestPath = join(cacheDir, 'manifest.json')
	const configJs = join(cacheDir, 'config.js')
	const frameworkVersion = await getPackageVersion()

	try {
		await compileIfNeeded(configTs, configJs, manifestPath, frameworkVersion)
		const mod = await import(pathToFileURL(configJs).href + '?t=' + Date.now()) as { default: { rules?: Record<string, unknown> } }
		const config = mod.default
		const rulesConfig = config.rules ?? {}
		const ruleErrors: string[] = []

		for (const ruleKey of Object.keys(rulesConfig)) {
			const isLocal = ruleKey.startsWith('./') || ruleKey.startsWith('../')
			if (isLocal) {
				const resolvedBase = resolve(projectRoot, ruleKey)
				const resolvedTs = extname(resolvedBase) === '' ? resolvedBase + '.ts' : resolvedBase
				const resolvedJs = extname(resolvedBase) === '' ? resolvedBase + '.js' : resolvedBase.replace(/\.ts$/, '.js')
				if (!existsSync(resolvedBase) && !existsSync(resolvedTs) && !existsSync(resolvedJs)) {
					ruleErrors.push(`Rule not found: ${ruleKey} (resolved to ${resolvedBase})`)
				}
			} else {
				// Package rule - try to import it
				try {
					await import(`@wadeck-app/violations-rules/rules/${ruleKey}`)
				} catch {
					ruleErrors.push(`Package rule not found: ${ruleKey} (will be available in Phase 4)`)
				}
			}
		}

		if (ruleErrors.length > 0) {
			process.stderr.write('[fail] Rule resolution errors:\n')
			for (const e of ruleErrors) {
				process.stderr.write(`  ${e}\n`)
			}
			errors.push(...ruleErrors)
		}
	} catch (err) {
		errors.push(`Failed to load config: ${String(err)}`)
		process.stderr.write(`[fail] Failed to load config: ${String(err)}\n`)
	}

	if (errors.length === 0) {
		console.log('[ok] config is valid.')
		process.exit(0)
	} else {
		process.exit(1)
	}
}

// ---------------------------------------------------------------------------
// `violations cache clear`
// ---------------------------------------------------------------------------

async function cmdCacheClear(): Promise<void> {
	const projectRoot = getProjectRoot()
	const cacheDir = join(projectRoot, '.violations', '.cache')

	if (existsSync(cacheDir)) {
		await rm(cacheDir, { recursive: true, force: true })
	}

	process.stdout.write('[ok] cache cleared.\n')
}

// ---------------------------------------------------------------------------
// `violations cli self-check`
// ---------------------------------------------------------------------------

function cmdCliSelfCheck(): void {
	const results = runSelfChecks()
	printSelfChecks(results)
	const allPassed = results.every(r => r.ok)
	process.exit(allPassed ? 0 : 1)
}

// ---------------------------------------------------------------------------
// `violations cli update`
// ---------------------------------------------------------------------------

function cmdCliUpdate(): void {
	const bundlePath = process.env['LAUNCHER_BUNDLE_OVERRIDE'] ?? fileURLToPath(import.meta.url)
	const bundleDir = dirname(bundlePath)
	const updaterPath = join(bundleDir, 'violations-updater.cjs')

	if (!existsSync(updaterPath)) {
		process.stderr.write('[fail] updater not found (dev mode?)\n')
		process.exit(1)
	}

	execFileSync(process.execPath, [updaterPath], {
		stdio: 'inherit',
		env: { ...process.env, UPDATER_FORCE: '1' },
	})
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	const argv = process.argv.slice(2)

	// Show update notice from a previous background update run
	const updater = new UpdateManager('@wadeck-app/violations-cli')
	const updateState = updater.readAndClearState()
	if (updateState?.status === 'success') {
		process.stderr.write(`violations updated to ${updateState.newVersion}\n`)
	}
	if (updateState?.status === 'rolled-back') {
		process.stderr.write(
			`[violations] Update to v${updateState.targetVersion} failed (self-check failed). Rolled back to v${updateState.previousVersion}.\n`
		)
	}
	if (updateState?.status === 'update-failed') {
		process.stderr.write(`[violations] Update check failed (${updateState.reason}).\n`)
	}

	const configDir = process.env['VIOLATIONS_CONFIG_DIR'] ?? ConfigDir.get('violations')
	const userConfig = loadUserConfig(configDir)
	const bundlePath = process.env['LAUNCHER_BUNDLE_OVERRIDE'] ?? fileURLToPath(import.meta.url)

	if (argv[0] === '--version' || argv[0] === '-V') {
		console.log(VERSION)
		process.exit(0)
	}

	if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
		printUsage()
		process.exit(0)
	}

	const command = argv[0]
	const rest = argv.slice(1)

	try {
		if (command === 'check') {
			await cmdCheck(rest)
		} else if (command === 'test') {
			await cmdTest(rest)
		} else if (command === 'rules') {
			const sub = rest[0]
			const subRest = rest.slice(1)
			if (sub === '--help' || sub === '-h') {
				process.stdout.write(RULES_GROUP_HELP)
				process.exit(0)
			} else if (sub === 'list') {
				await cmdRulesList(subRest)
			} else if (sub === 'info') {
				await cmdRulesInfo(subRest[0])
			} else if (sub === 'create') {
				await cmdRulesCreate(subRest[0], subRest.slice(1))
			} else {
				process.stderr.write(`[fail] Unknown subcommand: rules ${sub ?? ''}\nRun: violations rules --help\n`)
				process.exit(1)
			}
		} else if (command === 'config') {
			const sub = rest[0]
			if (sub === '--help' || sub === '-h') {
				process.stdout.write(CONFIG_GROUP_HELP)
				process.exit(0)
			} else if (sub === 'validate') {
				await cmdConfigValidate()
			} else {
				process.stderr.write(`[fail] Unknown subcommand: config ${sub ?? ''}\nRun: violations config --help\n`)
				process.exit(1)
			}
		} else if (command === 'cache') {
			const sub = rest[0]
			if (sub === '--help' || sub === '-h') {
				process.stdout.write(CACHE_GROUP_HELP)
				process.exit(0)
			} else if (sub === 'clear') {
				await cmdCacheClear()
			} else {
				process.stderr.write(`[fail] Unknown subcommand: cache ${sub ?? ''}\nRun: violations cache --help\n`)
				process.exit(1)
			}
		} else if (command === 'cli') {
			const sub = rest[0]
			if (sub === '--help' || sub === '-h') {
				process.stdout.write(CLI_GROUP_HELP)
				process.exit(0)
			} else if (sub === 'self-check') {
				cmdCliSelfCheck()
			} else if (sub === 'update') {
				cmdCliUpdate()
			} else {
				process.stderr.write(`[fail] Unknown subcommand: cli ${sub ?? ''}\nRun: violations cli --help\n`)
				process.exit(1)
			}
		} else {
			process.stderr.write(`[fail] Unknown command: ${command}\nRun: violations --help\n`)
			process.exit(1)
		}
	} finally {
		if (!userConfig.update.disabled) {
			updater.scheduleBackgroundUpdate(bundlePath, 'violations-updater.cjs')
		}
	}
}

const isEntryPoint =
	process.argv[1] !== undefined &&
	(process.argv[1] === fileURLToPath(import.meta.url) ||
		process.argv[1].endsWith('cli.js') ||
		process.argv[1].endsWith('violations'))

if (isEntryPoint) {
	main().catch(err => {
		process.stderr.write(`violations: ${String(err)}\n`)
		process.exit(1)
	})
}
export { main as runViolationsCommand }
