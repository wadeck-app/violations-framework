import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { run } from './runner.js'

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
      const lines = content.split('\\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('VIOLATE')) {
          violations.push({ file, line: i + 1, message: 'found VIOLATE keyword' })
        }
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
    // Disable the alwaysActive meta-rule so only the local test-rule runs
    'violations-meta/no-rule-without-test': { $severity: false },
  }
}
`

describe('auto-activation via projectTags', () => {
	it('auto-activates shared/no-em-dash when projectTags includes shared, without explicit config.rules entry', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'violations-auto-test-'))
		try {
			await mkdir(join(dir, '.violations'), { recursive: true })
			await mkdir(join(dir, 'src'), { recursive: true })
			// File containing an em dash - should be caught by auto-activated shared/no-em-dash
			await writeFile(join(dir, 'src', 'bad.ts'), 'const msg = "Save this token — it will not be shown again."\n')
			// Config declares projectTags but NO explicit config.rules entry for no-em-dash
			await writeFile(join(dir, '.violations', 'config.ts'), `
export default {
  projectTags: ['shared'],
  rules: {}
}
`)
			const results = await run({ projectRoot: dir })
			const emDashResult = results.find(r => r.ruleId === 'shared/no-em-dash')
			assert.ok(emDashResult, 'shared/no-em-dash should be auto-activated via projectTags')
			assert.equal(emDashResult.counts.violations, 1, 'expected 1 em-dash violation')
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})
})

describe('runner integration', () => {
	let tempDir: string

	before(async () => {
		tempDir = await mkdtemp(join(tmpdir(), 'violations-test-'))
		await mkdir(join(tempDir, '.violations', 'rules'), { recursive: true })
		await mkdir(join(tempDir, 'src'), { recursive: true })

		// File with a real violation (VIOLATE on line 2)
		await writeFile(
			join(tempDir, 'src', 'violation.txt'),
			'normal line\nVIOLATE this line\n'
		)

		// File with a suppressed violation (line-above form)
		await writeFile(
			join(tempDir, 'src', 'suppressed.txt'),
			'// violations-suppress: test-rule intentional\nVIOLATE this line\n'
		)

		// Pre-compiled rule (no TS compilation needed)
		await writeFile(join(tempDir, '.violations', 'rules', 'test-rule.js'), TEST_RULE_JS)

		// Config as TS (will be compiled by runner)
		await writeFile(join(tempDir, '.violations', 'config.ts'), CONFIG_TS)
	})

	after(async () => {
		await rm(tempDir, { recursive: true, force: true })
	})

	it('returns 1 violation and 1 suppressed', async () => {
		const results = await run({ projectRoot: tempDir })
		assert.equal(results.length, 1, 'expected exactly 1 rule result')
		const [result] = results
		assert.equal(result.ruleId, 'test-rule')
		assert.equal(result.counts.violations, 1, 'expected 1 active violation')
		assert.equal(result.counts.suppressed, 1, 'expected 1 suppressed violation')
		assert.equal(result.violations[0].message, 'found VIOLATE keyword')
	})
})
