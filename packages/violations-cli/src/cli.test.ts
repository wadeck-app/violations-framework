import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = join(__dirname, '..', 'dist', 'cli.js')

function runCli(args: string[], cwd?: string): Promise<{ code: number; stdout: string; stderr: string }> {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [CLI_PATH, ...args], {
			cwd: cwd ?? process.cwd(),
			env: process.env,
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

describe('violations CLI', () => {
	it('violations cache clear exits 0 (no cache dir)', async () => {
		const tempDir = await mkdtemp(join(tmpdir(), 'violations-cli-test-'))
		try {
			const { code, stdout } = await runCli(['cache', 'clear'], tempDir)
			assert.equal(code, 0, `Expected exit 0, got ${code}`)
			assert.ok(stdout.includes('Cache cleared'), `Expected "Cache cleared" in output, got: ${stdout}`)
		} finally {
			await rm(tempDir, { recursive: true, force: true })
		}
	})

	it('violations --help exits 0 and prints usage', async () => {
		const { code, stdout } = await runCli(['--help'])
		assert.equal(code, 0, `Expected exit 0, got ${code}`)
		assert.ok(stdout.includes('violations'), `Expected "violations" in help output`)
	})

	it('violations (no args) exits 0 and prints usage', async () => {
		const { code, stdout } = await runCli([])
		assert.equal(code, 0, `Expected exit 0, got ${code}`)
		assert.ok(stdout.includes('violations'), `Expected "violations" in usage output`)
	})

	it('violations unknown-command exits 1', async () => {
		const { code } = await runCli(['unknown-command-xyz'])
		assert.equal(code, 1, `Expected exit 1 for unknown command, got ${code}`)
	})
})
