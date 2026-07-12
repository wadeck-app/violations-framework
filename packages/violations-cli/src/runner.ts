import { readFile, mkdir } from 'node:fs/promises'
import { join, resolve, dirname, basename, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import micromatch from 'micromatch'
import { walk } from './walk.js'
import { isSuppressed, getSuppressReason } from './suppress.js'
import { compileIfNeeded } from './compiler.js'
import type { Rule, RuleResult, ViolationsConfig, Violation, RuleOverride } from 'wadeck-violations-rules'

export interface RunOptions {
	projectRoot: string
	files?: string[]
	staged?: boolean
}

const __dirname = dirname(fileURLToPath(import.meta.url))

async function getFrameworkVersion(): Promise<string> {
	try {
		const pkgPath = join(__dirname, '..', 'package.json')
		const raw = await readFile(pkgPath, 'utf8')
		const pkg = JSON.parse(raw) as { version: string }
		return pkg.version
	} catch {
		return '0.0.0'
	}
}

async function loadConfig(projectRoot: string, frameworkVersion: string): Promise<ViolationsConfig> {
	const configTs = join(projectRoot, '.violations', 'config.ts')
	const cacheDir = join(projectRoot, '.violations', '.cache')
	const configJs = join(cacheDir, 'config.js')
	const manifestPath = join(cacheDir, 'manifest.json')

	if (existsSync(configTs)) {
		await compileIfNeeded(configTs, configJs, manifestPath, frameworkVersion)
		const mod = await import(pathToFileURL(configJs).href + '?t=' + Date.now()) as { default: ViolationsConfig }
		return mod.default
	}

	const configJs2 = join(projectRoot, '.violations', 'config.js')
	if (existsSync(configJs2)) {
		const mod = await import(pathToFileURL(configJs2).href + '?t=' + Date.now()) as { default: ViolationsConfig }
		return mod.default
	}

	throw new Error(`No .violations/config.ts or config.js found in ${projectRoot}`)
}

async function loadRule(
	ruleKey: string,
	projectRoot: string,
	cacheDir: string,
	manifestPath: string,
	frameworkVersion: string
): Promise<Rule | null> {
	const isLocal = ruleKey.startsWith('./') || ruleKey.startsWith('../')

	if (isLocal) {
		const resolvedBase = resolve(projectRoot, ruleKey)
		let importPath = resolvedBase

		if (extname(resolvedBase) === '.ts') {
			const compiled = join(cacheDir, 'rules', basename(resolvedBase, '.ts') + '.js')
			await compileIfNeeded(resolvedBase, compiled, manifestPath, frameworkVersion)
			importPath = compiled
		}

		try {
			const mod = await import(pathToFileURL(importPath).href + '?t=' + Date.now()) as { default?: Rule; rule?: Rule }
			return mod.default ?? mod.rule ?? null
		} catch (err) {
			console.warn(`[violations] Failed to load local rule ${ruleKey}: ${String(err)}`)
			return null
		}
	}

	// Package rule -- try wadeck-violations-rules/rules/<id>
	try {
		const mod = await import(`wadeck-violations-rules/rules/${ruleKey}`) as { default?: Rule; rule?: Rule }
		return mod.default ?? mod.rule ?? null
	} catch {
		console.warn(`[violations] Package rule '${ruleKey}' not found -- skipping (will be available in Phase 4)`)
		return null
	}
}

function stripMetaFields(override: RuleOverride): Record<string, unknown> {
	const { $severity: _s, $scopeAdd: _a, $exclude: _e, ...rest } = override as RuleOverride & Record<string, unknown>
	return rest
}

export async function run(options: RunOptions): Promise<RuleResult[]> {
	const { projectRoot } = options
	const frameworkVersion = await getFrameworkVersion()
	const config = await loadConfig(projectRoot, frameworkVersion)
	const cacheDir = join(projectRoot, '.violations', '.cache')
	const manifestPath = join(cacheDir, 'manifest.json')

	await mkdir(cacheDir, { recursive: true })

	const rulesConfig = config.rules ?? {}
	const results: RuleResult[] = []

	await Promise.all(
		Object.entries(rulesConfig).map(async ([ruleKey, override]) => {
			// $severity: false = disabled
			if (override !== true && override != null && (override as RuleOverride).$severity === false) {
				return
			}

			const rule = await loadRule(ruleKey, projectRoot, cacheDir, manifestPath, frameworkVersion)
			if (!rule) return

			// Determine effective severity
			const effectiveSeverity =
				override !== true && override != null && (override as RuleOverride).$severity != null
					? ((override as RuleOverride).$severity as 'error' | 'warning' | 'info')
					: rule.defaultSeverity

			// Resolve scope: defaultScope + $scopeAdd
			const scopePatterns = [
				...rule.defaultScope,
				...(override !== true && override != null ? ((override as RuleOverride).$scopeAdd ?? []) : []),
			]

			// Resolve excludes: globalExclude + $exclude
			const excludePatterns = [
				...(config.globalExclude ?? []),
				...(override !== true && override != null ? ((override as RuleOverride).$exclude ?? []) : []),
			]

			// Walk project root
			let walkedFiles = await walk(projectRoot, {
				extensions: [],
				excludeGlobs: excludePatterns,
			})

			// Filter by scope (relative paths)
			walkedFiles = walkedFiles.filter(absPath => {
				const rel = absPath.replace(projectRoot.split('\\').join('/') + '/', '').replace(/^\//, '')
				return micromatch.isMatch(rel, scopePatterns)
			})

			// Intersect with options.files if provided
			if (options.files && options.files.length > 0) {
				const filesSet = new Set(options.files.map(f => f.split('\\').join('/')))
				walkedFiles = walkedFiles.filter(f => filesSet.has(f))
			}

			if (walkedFiles.length === 0) {
				results.push({
					ruleId: rule.id,
					severity: effectiveSeverity,
					violations: [],
					suppressed: [],
					counts: { violations: 0, suppressed: 0 },
				})
				return
			}

			// Build config for rule.check()
			const ruleConfig = override !== true && override != null ? stripMetaFields(override as RuleOverride) : {}

			// Run check
			let violations: Violation[]
			try {
				violations = await rule.check(walkedFiles, ruleConfig as never)
			} catch (err) {
				console.warn(`[violations] Rule ${rule.id} threw: ${String(err)}`)
				violations = []
			}

			// Apply suppression
			const active: Violation[] = []
			const suppressed: Violation[] = []

			for (const v of violations) {
				if (isSuppressed(v.file, v.line, rule.id)) {
					const reason = getSuppressReason(v.file, v.line)
					suppressed.push(reason ? { ...v, message: reason } : v)
				} else {
					active.push(v)
				}
			}

			results.push({
				ruleId: rule.id,
				severity: effectiveSeverity,
				violations: active,
				suppressed,
				counts: { violations: active.length, suppressed: suppressed.length },
			})
		})
	)

	return results
}
