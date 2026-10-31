import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compileIfNeeded } from './compiler.js'

async function compile(source: string): Promise<{ output: string; srcDir: string }> {
	const dir = await mkdtemp(join(tmpdir(), 'violations-compiler-'))
	try {
		const sourcePath = join(dir, 'rule.ts')
		const outputPath = join(dir, 'cache', 'rule.js')
		await writeFile(sourcePath, source)
		await compileIfNeeded(sourcePath, outputPath, join(dir, 'cache', 'manifest.json'), 'test-version')
		return { output: await readFile(outputPath, 'utf8'), srcDir: dir }
	} finally {
		await rm(dir, { recursive: true, force: true })
	}
}

describe('compileIfNeeded import rewriting', () => {
	it('rewrites a real relative import to an absolute file URL', async () => {
		const { output, srcDir } = await compile(`import { x } from './helper.js'\nexport const y = x\n`)
		assert.ok(output.includes(pathToFileURL(join(srcDir, 'helper.js')).href), output)
	})

	it('rewrites a real relative re-export to an absolute file URL', async () => {
		const { output, srcDir } = await compile(`export { x } from './helper.js'\n`)
		assert.ok(output.includes(pathToFileURL(join(srcDir, 'helper.js')).href), output)
	})

	it('leaves a quoted "from ./x.js" inside a template literal untouched', async () => {
		const { output } = await compile('export const msg = (stem: string) => `add "export * from \'./${stem}.js\';"`\n')
		assert.ok(output.includes("from './${stem}.js'"), output)
		assert.ok(!output.includes('file://'), output)
	})

	it('leaves a quoted "from ./x.js" inside a plain string untouched', async () => {
		const { output } = await compile(`export const msg = "export * from './foo.js'"\n`)
		assert.ok(output.includes("from './foo.js'"), output)
		assert.ok(!output.includes('file://'), output)
	})

	it('leaves import.meta.dirname written inside a string untouched', async () => {
		const { output } = await compile('export const msg = "use import.meta.dirname here"\n')
		assert.ok(output.includes('use import.meta.dirname here'), output)
	})

	it('still rewrites a real import.meta.dirname expression to the source directory', async () => {
		const { output, srcDir } = await compile('export const d = import.meta.dirname\n')
		assert.ok(output.includes(JSON.stringify(srcDir.replace(/\\/g, '/'))), output)
	})
})
