import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
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
			assert.ok(stdout.includes('cache cleared'), `Expected "cache cleared" in output, got: ${stdout}`)
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

	it('violations --version exits 0 and prints CalVer', async () => {
		const { code, stdout } = await runCli(['--version'])
		assert.equal(code, 0, `Expected exit 0, got ${code}`)
		assert.match(stdout.trim(), /^\d{4}\.\d{2}\.\d{2}/, `Expected CalVer in output, got: ${stdout}`)
	})

	it('violations -V exits 0 and prints CalVer', async () => {
		const { code, stdout } = await runCli(['-V'])
		assert.equal(code, 0, `Expected exit 0, got ${code}`)
		assert.match(stdout.trim(), /^\d{4}\.\d{2}\.\d{2}/, `Expected CalVer in output, got: ${stdout}`)
	})
})

// Regression suite for the `--files` bug: relative paths and space-separated
// lists used to silently produce "[ok] 0 violations" instead of checking the
// intended file(s) or erroring. See cli.ts cmdCheck for the fix.
describe('violations check --files', () => {
	let dir: string

	const TEST_RULE_JS = `
const rule = {
  id: 'test-rule',
  tags: 'test',
  defaultScope: ['**/*.txt'],
  defaultSeverity: 'error',
  async check(files, _config) {
    const { readFile } = await import('node:fs/promises')
    const violations = []
    for (const file of files) {
      const content = await readFile(file, 'utf8')
      if (content.includes('VIOLATE')) {
        violations.push({ file, line: 1, message: 'found VIOLATE keyword' })
      }
    }
    return violations
  }
}
export default rule
`
	const CONFIG_TS = `
export default {
  projectTags: ['test'],
  rules: {
    './.violations/rules/test-rule.js': true,
    'violations-meta/no-rule-without-test': { $severity: false },
  }
}
`

	before(async () => {
		dir = await mkdtemp(join(tmpdir(), 'violations-cli-files-test-'))
		await mkdir(join(dir, '.violations', 'rules'), { recursive: true })
		await mkdir(join(dir, 'src'), { recursive: true })
		await writeFile(join(dir, 'src', 'bad.txt'), 'VIOLATE this\n')
		await writeFile(join(dir, 'src', 'clean.txt'), 'all good\n')
		await writeFile(join(dir, '.violations', 'rules', 'test-rule.js'), TEST_RULE_JS)
		await writeFile(join(dir, '.violations', 'config.ts'), CONFIG_TS)
	})

	after(async () => {
		await rm(dir, { recursive: true, force: true })
	})

	it('a RELATIVE path is resolved against the project root and actually checked', async () => {
		const { code, stdout } = await runCli(['check', '--files', 'src/bad.txt'], dir)
		assert.equal(code, 1, `expected 1 violation (exit 1), got exit ${code}. stdout: ${stdout}`)
		assert.match(stdout, /1 violation/)
	})

	it('a relative path to a CLEAN file correctly reports 0 violations (not a resolution failure)', async () => {
		const { code, stdout } = await runCli(['check', '--files', 'src/clean.txt'], dir)
		assert.equal(code, 0)
		assert.match(stdout, /1 file.*checked/)
	})

	it('comma-separated absolute paths both get checked', async () => {
		const a = join(dir, 'src', 'bad.txt').split('\\').join('/')
		const b = join(dir, 'src', 'clean.txt').split('\\').join('/')
		const { stdout } = await runCli(['check', '--files', `${a},${b}`], dir)
		assert.match(stdout, /2 files.*checked/)
		assert.match(stdout, /1 violation/)
	})

	it('space-separated file list: BOTH files are checked, not just the first', async () => {
		const { stdout } = await runCli(['check', '--files', 'src/bad.txt', 'src/clean.txt'], dir)
		assert.match(stdout, /2 files.*checked/)
		assert.match(stdout, /1 violation/)
	})

	it('space-separated file list in reverse order still checks BOTH files', async () => {
		const { stdout } = await runCli(['check', '--files', 'src/clean.txt', 'src/bad.txt'], dir)
		assert.match(stdout, /2 files.*checked/)
		assert.match(stdout, /1 violation/)
	})

	it('repeated --files flags accumulate instead of the last one winning', async () => {
		const { stdout } = await runCli(['check', '--files', 'src/bad.txt', '--files', 'src/clean.txt'], dir)
		assert.match(stdout, /2 files.*checked/)
		assert.match(stdout, /1 violation/)
	})

	it('a --files entry that does not exist errors out (exit 1) instead of silently checking 0 files', async () => {
		const { code, stderr } = await runCli(['check', '--files', 'src/does-not-exist.txt'], dir)
		assert.equal(code, 1, 'must not silently succeed')
		assert.match(stderr, /does not resolve to an existing file|do not resolve to existing files/)
	})

	it('one existing + one missing entry errors out (all-or-nothing, no partial silent run)', async () => {
		const { code, stderr } = await runCli(['check', '--files', 'src/bad.txt', 'src/missing.txt'], dir)
		assert.equal(code, 1)
		assert.match(stderr, /missing\.txt/)
	})

	it('[ok] output includes the checked file count so a 0-file run is visible at a glance', async () => {
		const { stdout } = await runCli(['check', '--files', 'src/clean.txt'], dir)
		assert.match(stdout, /\[ok\] 0 violations \(1 file checked\)/)
	})
})
