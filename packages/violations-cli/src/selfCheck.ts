import { mkdirSync, accessSync, constants } from 'node:fs'
import { createRequire } from 'node:module'
import { ConfigDir } from '@wadeck/shared-cli/ConfigDir'

// Injected by esbuild at bundle time via define; not present in plain tsc output.
declare const __VIOLATIONS_CLI_VERSION__: string

const _require = createRequire(import.meta.url)

export interface CheckResult {
	name: string
	ok: boolean
	reason?: string
}

function checkBundleVersion(): CheckResult {
	try {
		const v: string = __VIOLATIONS_CLI_VERSION__
		if (!v) {
			return { name: 'bundle-version', ok: false, reason: 'version string is empty' }
		}
		return { name: 'bundle-version', ok: true }
	} catch {
		return { name: 'bundle-version', ok: false, reason: 'not bundled (dev build)' }
	}
}

function checkConfigDirWritable(): CheckResult {
	try {
		const dir = process.env['VIOLATIONS_CONFIG_DIR'] ?? ConfigDir.get('violations')
		mkdirSync(dir, { recursive: true })
		accessSync(dir, constants.W_OK)
		return { name: 'config-dir-writable', ok: true }
	} catch (err) {
		return { name: 'config-dir-writable', ok: false, reason: String(err) }
	}
}

function checkTypeScriptApi(): CheckResult {
	try {
		_require.resolve('typescript')
		return { name: 'typescript-api', ok: true }
	} catch (err) {
		return { name: 'typescript-api', ok: false, reason: String(err) }
	}
}

export function runSelfChecks(): CheckResult[] {
	return [checkBundleVersion(), checkConfigDirWritable(), checkTypeScriptApi()]
}

export function printSelfChecks(results: CheckResult[]): void {
	const quiet = process.env['CLI_SELF_CHECK_QUIET'] === '1'
	for (const r of results) {
		if (r.ok) {
			if (!quiet) process.stdout.write(`[ok] ${r.name}\n`)
		} else {
			process.stdout.write(`[fail] ${r.name}: ${r.reason ?? 'unknown'}\n`)
		}
	}
}
