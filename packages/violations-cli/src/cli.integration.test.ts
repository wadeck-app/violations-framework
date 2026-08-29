import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = join(__dirname, '..', 'dist', 'cli.js')

function runCli(
	args: string[],
	env?: Record<string, string>,
): Promise<{ code: number; stdout: string; stderr: string }> {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [CLI_PATH, ...args], {
			env: { ...process.env, ...env },
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
		assert.equal(code, 1, `Expected exit 1 in dev mode (updater bundle absent), got ${code}`)
		assert.ok(stderr.includes('[fail]'), `Expected [fail] in stderr, got: ${JSON.stringify(stderr)}`)
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
