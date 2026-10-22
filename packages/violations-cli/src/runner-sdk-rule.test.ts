import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { run } from './runner.js'

const SDK_KEY = '@wadeck-app/app-core-sdk/violations'
const SDK_RULE_ID = 'app-core-sdk/manifest-valid'

// Stands in for the rule shipped by @wadeck-app/app-core-sdk/violations: flags a manifest containing "BAD".
const FAKE_SDK_RULE = `
export const rule = {
  id: '${SDK_RULE_ID}',
  tags: 'app-module',
  defaultScope: ['**/manifest.json'],
  defaultSeverity: 'error',
  async check(files) {
    const { readFile } = await import('node:fs/promises')
    const violations = []
    for (const file of files) {
      if ((await readFile(file, 'utf8')).includes('BAD')) {
        violations.push({ file, line: 1, message: 'id: Required' })
      }
    }
    return violations
  },
}
`

async function makeProject(options: { appModule: boolean; sdk: boolean; rules?: string }): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), 'violations-sdk-auto-'))
	await mkdir(join(dir, '.violations'), { recursive: true })
	await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'proj', private: true }))
	await writeFile(join(dir, '.violations', 'config.ts'), `export default { projectTags: ['ts'], rules: { ${options.rules ?? ''} } }\n`)
	if (options.appModule) {
		await mkdir(join(dir, 'packages', 'app-module-x'), { recursive: true })
		await writeFile(join(dir, 'packages', 'app-module-x', 'manifest.json'), '{ "BAD": true }\n')
	}
	if (options.sdk) {
		const sdkDir = join(dir, 'node_modules', '@wadeck-app', 'app-core-sdk')
		await mkdir(sdkDir, { recursive: true })
		await writeFile(
			join(sdkDir, 'package.json'),
			JSON.stringify({ name: '@wadeck-app/app-core-sdk', version: '1.0.0', type: 'module', exports: { './violations': { default: './violations.js' } } }),
		)
		await writeFile(join(sdkDir, 'violations.js'), FAKE_SDK_RULE)
	}
	return dir
}

describe('app-core SDK manifest rule auto-activation (app-module-* detected)', () => {
	it('activates the SDK rule automatically and reports its violations', async () => {
		const dir = await makeProject({ appModule: true, sdk: true })
		try {
			const results = await run({ projectRoot: dir })
			const result = results.find(r => r.ruleId === SDK_RULE_ID)
			assert.ok(result, 'the SDK rule should be auto-activated when an app-module-* folder has a manifest.json')
			assert.equal(result.counts.violations, 1)
			assert.equal(result.violations[0].message, 'id: Required')
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})

	it('does not load the SDK rule when the project has no app-module-*, even without the SDK installed', async () => {
		const dir = await makeProject({ appModule: false, sdk: false })
		try {
			const results = await run({ projectRoot: dir })
			assert.equal(results.find(r => r.ruleId === SDK_RULE_ID), undefined)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})

	it('fails loudly with the install command when app-module-* exists but the SDK is not installed', async () => {
		const dir = await makeProject({ appModule: true, sdk: false })
		try {
			await assert.rejects(run({ projectRoot: dir }), /Cannot resolve the rule '@wadeck-app\/app-core-sdk\/violations'[\s\S]*npm install @wadeck-app\/app-core-sdk/)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})

	it('can be turned off with $severity: false, without needing the SDK', async () => {
		const dir = await makeProject({ appModule: true, sdk: false, rules: `'${SDK_KEY}': { $severity: false }` })
		try {
			const results = await run({ projectRoot: dir })
			assert.equal(results.find(r => r.ruleId === SDK_RULE_ID), undefined)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})

	it('can be enabled explicitly by its package specifier, without any app-module-* folder', async () => {
		const dir = await makeProject({ appModule: false, sdk: true, rules: `'${SDK_KEY}': true` })
		try {
			await mkdir(join(dir, 'other'), { recursive: true })
			await writeFile(join(dir, 'other', 'manifest.json'), '{ "BAD": true }\n')
			const results = await run({ projectRoot: dir })
			assert.equal(results.find(r => r.ruleId === SDK_RULE_ID)?.counts.violations, 1)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})

	it('ignores app-module-* folders under dist-module', async () => {
		const dir = await makeProject({ appModule: false, sdk: false })
		try {
			await mkdir(join(dir, 'dist-module', 'app-module-x'), { recursive: true })
			await writeFile(join(dir, 'dist-module', 'app-module-x', 'manifest.json'), '{}\n')
			const results = await run({ projectRoot: dir })
			assert.equal(results.find(r => r.ruleId === SDK_RULE_ID), undefined)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})
})
