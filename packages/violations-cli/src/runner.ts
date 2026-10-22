import { readFile, mkdir, readdir } from 'node:fs/promises'
import { join, resolve, dirname, basename, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import picomatch from 'picomatch'
import { walk } from './walk.js'
import { isSuppressed, getSuppressReason } from './suppress.js'
import { compileIfNeeded } from './compiler.js'
import type { Rule, RuleResult, ViolationsConfig, Violation, RuleOverride } from '@wadeck-app/violations-rules'

export interface RunOptions {
	projectRoot: string
	files?: string[]
	staged?: boolean
	overrideConfig?: ViolationsConfig
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

// Rule shipped by an npm package of the project, keyed by its import specifier (scoped package).
export const APP_CORE_SDK_RULE_KEY = '@wadeck-app/app-core-sdk/violations'

function isPackageRuleKey(ruleKey: string): boolean {
	return ruleKey.startsWith('@')
}

// A key that is loaded from outside the library (local file or project package), as opposed to a library rule id.
function isExternalRuleKey(ruleKey: string): boolean {
	return ruleKey.startsWith('./') || ruleKey.startsWith('../') || isPackageRuleKey(ruleKey)
}

// Resolves the package from the project root, so the version the project is built against is the one that runs.
async function loadPackageRule(ruleKey: string, projectRoot: string): Promise<Rule> {
	let resolved: string
	try {
		resolved = createRequire(join(projectRoot, 'package.json')).resolve(ruleKey)
	} catch (err) {
		const packageName = ruleKey.split('/').slice(0, 2).join('/')
		throw new Error(
			`[violations] Cannot resolve the rule '${ruleKey}' from ${projectRoot}: ${(err as Error).message}\n` +
			`       Install the package in the project: npm install ${packageName}\n` +
			`       Or disable the rule in .violations/config.ts rules: '${ruleKey}': { $severity: false }`
		)
	}
	const mod = await import(pathToFileURL(resolved).href) as { default?: Rule; rule?: Rule }
	const rule = mod.default ?? mod.rule
	if (!rule) {
		throw new Error(
			`[violations] '${ruleKey}' (${resolved}) does not export a rule (expected 'export const rule' or 'export default').\n` +
			`       Check the version of the package installed in the project.`
		)
	}
	return rule
}

// A project has app-module(s) if it contains <anything>/app-module-<name>/manifest.json outside generated output.
// Same marker as the app-module/* rules (a module root is a folder named app-module-<name>).
export async function hasAppModule(projectRoot: string, excludeGlobs: string[]): Promise<boolean> {
	const files = await walk(projectRoot, { extensions: [], excludeGlobs })
	return files.some(file => {
		const posix = file.split('\\').join('/')
		return /(^|\/)app-module-[^/]+\/manifest\.json$/.test(posix) && !/\/(dist-module|\.app-core-dev)\//.test(posix)
	})
}

async function loadRule(
	ruleKey: string,
	projectRoot: string,
	cacheDir: string,
	manifestPath: string,
	frameworkVersion: string
): Promise<Rule | null> {
	if (isPackageRuleKey(ruleKey)) {
		return loadPackageRule(ruleKey, projectRoot)
	}

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

	// Package rule -- try @wadeck-app/violations-rules/rules/<id>
	try {
		const mod = await import(`@wadeck-app/violations-rules/rules/${ruleKey}`) as { default?: Rule; rule?: Rule }
		return mod.default ?? mod.rule ?? null
	} catch {
		console.warn(`[violations] Package rule '${ruleKey}' not found -- skipping (will be available in Phase 4)`)
		return null
	}
}

function normalizePath(p: string): string {
	const slash = p.split('\\').join('/')
	return process.platform === 'win32' ? slash.toLowerCase() : slash
}

// Every top-level .ts/.js file in .violations/rules/ is a local rule, active by default.
// Excluded: *.test.*, *.d.ts, files prefixed with '_' (helper modules), subfolders (fixtures/).
// Returns config-style keys: './.violations/rules/<file>'.
async function discoverLocalRules(projectRoot: string): Promise<string[]> {
	const rulesDir = join(projectRoot, '.violations', 'rules')
	if (!existsSync(rulesDir)) {
		return []
	}
	const entries = await readdir(rulesDir, { withFileTypes: true })
	const files = entries
		.filter(e => e.isFile())
		.map(e => e.name)
		.filter(name => /\.(ts|js)$/.test(name))
		.filter(name => !/\.test\.(ts|js)$/.test(name) && !name.endsWith('.d.ts') && !name.startsWith('_'))

	const byStem = new Map<string, string[]>()
	for (const name of files) {
		const stem = name.replace(/\.(ts|js)$/, '')
		byStem.set(stem, [...(byStem.get(stem) ?? []), name])
	}
	for (const [stem, names] of byStem) {
		if (names.length > 1) {
			throw new Error(
				`[violations] Ambiguous local rule '${stem}': both ${names.join(' and ')} exist in .violations/rules/.\n` +
				`       Delete one of them (usually the stale .js).`
			)
		}
	}
	return files.map(name => `./.violations/rules/${name}`)
}

// A project depends on the DSL layer (and so needs the `dsl` tag active) if
// any package.json under it - root or packages/* - lists a @wadeck-app/dsl-*
// package. Dependency-based, not file-extension-based, since DSL contract
// rules (e.g. dsl/no-app-hook) apply by package relationship, not by what
// extensions happen to be present. Checked unconditionally (even when
// projectTags is explicitly configured) so a consumer repo can never silently
// miss DSL rules by forgetting to list 'dsl' in projectTags.
async function readPackageJsonDeps(packageJsonPath: string): Promise<string[]> {
	try {
		const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
			dependencies?: Record<string, string>
			devDependencies?: Record<string, string>
		}
		return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
	} catch {
		return []
	}
}

export async function hasDslDependency(projectRoot: string): Promise<boolean> {
	const rootDeps = await readPackageJsonDeps(join(projectRoot, 'package.json'))
	if (rootDeps.some(name => name.startsWith('@wadeck-app/dsl-'))) {
		return true
	}

	const packagesDir = join(projectRoot, 'packages')
	let entries: string[]
	try {
		entries = (await readdir(packagesDir, { withFileTypes: true }))
			.filter(e => e.isDirectory())
			.map(e => e.name)
	} catch {
		return false
	}

	const depsPerPackage = await Promise.all(
		entries.map(name => readPackageJsonDeps(join(packagesDir, name, 'package.json'))),
	)
	return depsPerPackage.some(deps => deps.some(name => name.startsWith('@wadeck-app/dsl-')))
}

function isDisabled(override: RuleOverride | true): boolean {
	return override !== true && override != null && (override as RuleOverride).$severity === false
}

function stripMetaFields(override: RuleOverride): Record<string, unknown> {
	const { $severity: _s, $scopeAdd: _a, $exclude: _e, ...rest } = override as RuleOverride & Record<string, unknown>
	return rest
}

export async function run(options: RunOptions): Promise<RuleResult[]> {
	const { projectRoot } = options
	const frameworkVersion = await getFrameworkVersion()
	const config = options.overrideConfig ?? await loadConfig(projectRoot, frameworkVersion)
	const cacheDir = join(projectRoot, '.violations', '.cache')
	const manifestPath = join(cacheDir, 'manifest.json')

	await mkdir(cacheDir, { recursive: true })

	const rulesConfig = config.rules ?? {}
	const results: RuleResult[] = []

	// Auto-activate all library rules whose tag matches projectTags.
	// Explicit config.rules entries take priority (override or disable with $severity: false).
	const { allRules } = await import('@wadeck-app/violations-rules')
	const projectTags = new Set(config.projectTags ?? [])
	if (!projectTags.has('dsl') && await hasDslDependency(projectRoot)) {
		projectTags.add('dsl')
		process.stderr.write(
			'[auto] @wadeck-app/dsl-* dependency detected - activating \'dsl\' tag rules automatically.\n' +
			'       Add \'dsl\' to projectTags in .violations/config.ts to make this explicit.\n'
		)
	}
	if (projectTags.size === 0) {
		process.stderr.write(
			'[warn] projectTags is empty - only shared rules will activate automatically.\n' +
			'       Add tags to your .violations/config.ts (e.g. projectTags: [\'ts\', \'react\']).\n' +
			'       Run: violations rules list  to see available tags.\n'
		)
	}
	const mergedRules: Record<string, RuleOverride | true> = {}
	for (const libRule of allRules) {
		const ruleTags = Array.isArray(libRule.tags) ? libRule.tags : [libRule.tags]
		// shared rules are always active regardless of projectTags
		if (libRule.alwaysActive || libRule.tags === 'shared' || ruleTags.some(t => projectTags.has(t))) {
			mergedRules[libRule.id] = true
		}
	}
	// Auto-activate every discovered local rule. A config key pointing to the same file
	// (compared by resolved path) takes priority, so each file is loaded once.
	const discoveredLocal = await discoverLocalRules(projectRoot)
	const configuredLocalPaths = new Set(
		Object.keys(rulesConfig)
			.filter(key => key.startsWith('./') || key.startsWith('../'))
			.map(key => normalizePath(resolve(projectRoot, key)))
	)
	const discoveredKeys = new Set<string>()
	for (const key of discoveredLocal) {
		if (!configuredLocalPaths.has(normalizePath(resolve(projectRoot, key)))) {
			mergedRules[key] = true
			discoveredKeys.add(key)
		}
	}
	for (const [key, val] of Object.entries(rulesConfig)) {
		mergedRules[key] = val as RuleOverride | true
	}

	// A project with app-module(s) always has the app-core SDK, which ships the manifest schema rule: it is
	// activated automatically so the schema is never silently unchecked. An explicit config entry (override or
	// $severity: false) takes priority. A missing SDK is an error (see loadPackageRule), not a silent skip.
	if (!(APP_CORE_SDK_RULE_KEY in rulesConfig) && await hasAppModule(projectRoot, config.globalExclude ?? [])) {
		mergedRules[APP_CORE_SDK_RULE_KEY] = true
		process.stderr.write(
			'[auto] app-module-* detected - activating the manifest schema rule of @wadeck-app/app-core-sdk automatically.\n' +
			`       Disable with rules: '${APP_CORE_SDK_RULE_KEY}': { $severity: false } in .violations/config.ts.\n`
		)
	}

	// Load all local rules once, caching the Rule instance.
	// Lib rules: config key IS the rule id (no load needed for ID collection).
	// Local rules (./...): the key is a file path; we need rule.id (e.g. 'security/no-raw-err')
	// for no-dead-suppress validation. Caching avoids a second compile+import in Promise.all.
	const localRuleCache = new Map<string, Rule>()
	for (const [ruleKey, override] of Object.entries(mergedRules)) {
		if (!isExternalRuleKey(ruleKey)) {
		  continue;
		}
		if (isDisabled(override)) {
		  continue;
		}
		const r = await loadRule(ruleKey, projectRoot, cacheDir, manifestPath, frameworkVersion)
		if (!r && discoveredKeys.has(ruleKey)) {
			throw new Error(
				`[violations] ${ruleKey} failed to load (see warning above) or does not export a rule (expected 'export const rule' or 'export default').\n` +
				`       Every file in .violations/rules/ is loaded as a rule. For a helper module, prefix its name with '_' (e.g. _helpers.ts).\n` +
				`       To disable the rule instead, add to config.ts rules: '${ruleKey}': { $severity: false }`
			)
		}
		if (r) {
		  localRuleCache.set(ruleKey, r);
		}
	}
	const activeRuleIds: string[] = [
		...Object.entries(mergedRules)
			.filter(([, override]) => !isDisabled(override))
			.filter(([ruleKey]) => !isExternalRuleKey(ruleKey))
			.map(([ruleKey]) => ruleKey),
		...[...localRuleCache.values()].map(r => r.id),
	]

	await Promise.all(
		Object.entries(mergedRules).map(async ([ruleKey, override]) => {
			if (isDisabled(override)) {
			  return;
			}

			const isExternal = isExternalRuleKey(ruleKey)
			const rule = isExternal
				? (localRuleCache.get(ruleKey) ?? await loadRule(ruleKey, projectRoot, cacheDir, manifestPath, frameworkVersion))
				: await loadRule(ruleKey, projectRoot, cacheDir, manifestPath, frameworkVersion)
			if (!rule) {
			  return;
			}

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
			const isInScope = picomatch(scopePatterns)
			walkedFiles = walkedFiles.filter(absPath => {
				const rel = absPath.replace(projectRoot.split('\\').join('/') + '/', '').replace(/^\//, '')
				return isInScope(rel)
			})

			// Intersect with options.files if provided. Compared case-insensitively
			// on Windows: walkedFiles carries whatever casing walk()/projectRoot
			// happened to use, and an absolute path handed in via --files (as
			// opposed to one resolved relative to projectRoot by the CLI) can
			// legitimately differ only in case while still being the same file.
			if (options.files && options.files.length > 0) {
				const normalize = (f: string) => {
					const slash = f.split('\\').join('/')
					return process.platform === 'win32' ? slash.toLowerCase() : slash
				}
				const filesSet = new Set(options.files.map(normalize))
				walkedFiles = walkedFiles.filter(f => filesSet.has(normalize(f)))
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
			const ruleConfig: Record<string, unknown> = override !== true && override != null ? stripMetaFields(override as RuleOverride) : {}
			// Inject activeRuleIds for no-dead-suppress
			if (rule.id === 'shared/no-dead-suppress') {
				ruleConfig.activeRuleIds = activeRuleIds
			}

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
