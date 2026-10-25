import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = join(__dirname, '..', 'dist', 'cli.js')

// Incident 2026-10-24: a test ran `cli update` against the REAL config dir and REAL global npm;
// the install was killed halfway and the global CLI vanished. Every spawned CLI must run in a
// throwaway tree: own config dir, home, npm prefix/cache/config, and an unreachable registry.
const UNREACHABLE_REGISTRY = 'http://127.0.0.1:9'
const ISOLATION_ROOT = mkdtempSync(join(tmpdir(), 'violations-test-iso-'))
after(() => rmSync(ISOLATION_ROOT, { recursive: true, force: true }))

// Env vars that steer the updater / launcher / npm / home lookup must not leak from the parent shell.
const STRIPPED = /^(UPDATER_|LAUNCHER_|CLI_SELF_CHECK|NPM_CONFIG_|XDG_CONFIG_HOME$|HOME$|USERPROFILE$|APPDATA$|LOCALAPPDATA$)/i

function isolatedEnv(): NodeJS.ProcessEnv {
	const home = join(ISOLATION_ROOT, 'home')
	const configDir = join(home, '.config', 'violations')
	const npmPrefix = join(ISOLATION_ROOT, 'npm-prefix')
	const npmCache = join(ISOLATION_ROOT, 'npm-cache')
	for (const d of [configDir, npmPrefix, npmCache, join(home, 'AppData', 'Roaming'), join(home, 'AppData', 'Local')]) {
		mkdirSync(d, { recursive: true })
	}
	// Own npm config files for user AND global level so the real auth tokens / scope registries are never read.
	const npmConfig = `registry=${UNREACHABLE_REGISTRY}\n@wadeck-app:registry=${UNREACHABLE_REGISTRY}\nfetch-retries=0\nfetch-timeout=3000\naudit=false\nfund=false\nupdate-notifier=false\n`
	const userConfig = join(ISOLATION_ROOT, 'npm-user.ini')
	const globalConfig = join(ISOLATION_ROOT, 'npm-global.ini')
	writeFileSync(userConfig, npmConfig)
	writeFileSync(globalConfig, npmConfig)
	const env: NodeJS.ProcessEnv = {}
	for (const [k, v] of Object.entries(process.env)) if (!STRIPPED.test(k)) env[k] = v
	return Object.assign(env, {
		VIOLATIONS_CONFIG_DIR: configDir,
		XDG_CONFIG_HOME: join(home, '.config'),
		HOME: home,
		USERPROFILE: home,
		APPDATA: join(home, 'AppData', 'Roaming'),
		LOCALAPPDATA: join(home, 'AppData', 'Local'),
		NPM_CONFIG_PREFIX: npmPrefix,
		NPM_CONFIG_CACHE: npmCache,
		NPM_CONFIG_USERCONFIG: userConfig,
		NPM_CONFIG_GLOBALCONFIG: globalConfig,
		NPM_CONFIG_REGISTRY: UNREACHABLE_REGISTRY,
		// A scoped registry from a project/user .npmrc outranks NPM_CONFIG_REGISTRY; only this env variable beats it.
		'npm_config_@wadeck-app:registry': UNREACHABLE_REGISTRY,
	})
}

function runCli(
	args: string[],
	env?: Record<string, string>,
): Promise<{ code: number; stdout: string; stderr: string }> {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [CLI_PATH, ...args], {
			env: { ...isolatedEnv(), ...env },
		})
		let stdout = ''
		let stderr = ''
		child.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
		child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
		child.on('close', (code) => {
			resolve({ code: code ?? 0, stdout, stderr })
		})
	})
}

describe('violations CLI integration', () => {

	it('rules info prints the details of a known rule id', async () => {
		const { code, stdout } = await runCli(['rules', 'info', 'queue-sdk/no-off-outside-tests'])
		assert.equal(code, 0, stdout)
		assert.match(stdout, /id:\s+queue-sdk\/no-off-outside-tests/)
		assert.match(stdout, /defaultSeverity:\s+error/)
	})

	it('rules info on an unknown id exits 1 and points to rules list', async () => {
		const { code, stdout } = await runCli(['rules', 'info', 'nope/unknown'])
		assert.equal(code, 1)
		assert.match(stdout, /Rule not found: nope\/unknown/)
		assert.match(stdout, /violations rules list/)
	})

	it('cli self-check writes only to stderr (no stdout output)', async () => {
		const { code, stdout, stderr } = await runCli(['cli', 'self-check'])
		assert.equal(stdout, '', `Expected empty stdout, got: ${JSON.stringify(stdout)}`)
		assert.ok(stderr.length > 0, 'Expected self-check output on stderr')
		// exit 0 (pass) or 1 (fail) are both acceptable; no crash
		assert.ok(code === 0 || code === 1, `Unexpected exit code: ${code}`)
	})

	it('cli self-check stderr lines start with [ok] or [fail]', async () => {
		const { stderr } = await runCli(['cli', 'self-check'])
		const checkLines = stderr.split('\n').filter(l => l.trim() && !l.startsWith('violations'))
		assert.ok(
			checkLines.every(l => l.startsWith('[ok]') || l.startsWith('[fail]')),
			`All check lines must start with [ok] or [fail], got:\n${stderr}`,
		)
	})

	it('cli self-check does not duplicate lines across stdout and stderr', async () => {
		const { stdout, stderr } = await runCli(['cli', 'self-check'])
		const stderrLines = stderr.split('\n').filter(l => l.trim())
		const stdoutLines = stdout.split('\n').filter(l => l.trim())
		// No line should appear on stdout if it's already on stderr
		for (const line of stderrLines) {
			assert.ok(
				!stdoutLines.includes(line),
				`Line appears on both stdout and stderr (duplicate): ${JSON.stringify(line)}`,
			)
		}
	})

	it('cli update in dev mode prints [fail] on stderr and exits 1', async () => {
		const { code, stderr } = await runCli(['cli', 'update'])
		assert.equal(code, 1, `Expected exit 1 in dev mode, got ${code}`)
		assert.ok(stderr.includes('[fail]'), `Expected [fail] in stderr, got: ${JSON.stringify(stderr)}`)
		// Must be the dev-build guard, not the "updater bundle absent" accident
		assert.ok(stderr.includes('dev build'), `Expected the dev-build refusal, got: ${JSON.stringify(stderr)}`)
	})

	it('unknown top-level command exits 1', async () => {
		const { code, stderr } = await runCli(['completely-unknown-xyz'])
		assert.equal(code, 1, `Expected exit 1 for unknown command, got ${code}`)
		assert.ok(stderr.includes('[fail]'), `Expected [fail] in stderr, got: ${JSON.stringify(stderr)}`)
	})

	it('unknown cli subcommand exits 1', async () => {
		const { code, stderr } = await runCli(['cli', 'unknown-subcommand'])
		assert.equal(code, 1, `Expected exit 1 for unknown cli subcommand, got ${code}`)
		assert.ok(stderr.includes('[fail]'), `Expected [fail] in stderr, got: ${JSON.stringify(stderr)}`)
	})
})
