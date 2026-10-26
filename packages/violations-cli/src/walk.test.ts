import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { walk } from './walk.js'

const FILES = [
	'src/a.ts',
	'src/b.tsx',
	'src/nested/deep/c.ts',
	'src/legacy/old.ts',
	'src/generated/gen.ts',
	'src/.hidden/h.ts',
	'node_modules/pkg/index.ts',
	'dist/out.js',
	'.git/config',
	'README.md',
]

describe('walk', () => {
	let root: string

	before(async () => {
		root = (await mkdtemp(join(tmpdir(), 'violations-walk-test-'))).split('\\').join('/')
		for (const rel of FILES) {
			await mkdir(join(root, rel, '..'), { recursive: true })
			await writeFile(join(root, rel), '')
		}
	})

	after(async () => {
		await rm(root, { recursive: true, force: true })
	})

	async function rels(options: Parameters<typeof walk>[1]): Promise<string[]> {
		const found = await walk(root, options)
		return found.map(f => f.slice(root.length + 1)).sort()
	}

	it('applies default excludes (node_modules, .git, dist, generated)', async () => {
		const found = await rels({ extensions: [] })
		assert.deepEqual(found, [
			'README.md',
			'src/.hidden/h.ts',
			'src/a.ts',
			'src/b.tsx',
			'src/legacy/old.ts',
			'src/nested/deep/c.ts',
		])
	})

	it('filters by extension', async () => {
		const found = await rels({ extensions: ['.tsx'] })
		assert.deepEqual(found, ['src/b.tsx'])
	})

	it('applies a custom exclude on a directory', async () => {
		const found = await rels({ extensions: ['.ts'], excludeGlobs: ['**/legacy/**'] })
		assert.deepEqual(found, ['src/.hidden/h.ts', 'src/a.ts', 'src/nested/deep/c.ts'])
	})

	it('applies a custom exclude on a file glob', async () => {
		const found = await rels({ extensions: [], excludeGlobs: ['**/*.tsx', 'README.md'] })
		assert.deepEqual(found, [
			'src/.hidden/h.ts',
			'src/a.ts',
			'src/legacy/old.ts',
			'src/nested/deep/c.ts',
		])
	})

	it('supports brace expansion in excludes', async () => {
		const found = await rels({ extensions: [], excludeGlobs: ['**/*.{tsx,md}'] })
		assert.deepEqual(found, [
			'src/.hidden/h.ts',
			'src/a.ts',
			'src/legacy/old.ts',
			'src/nested/deep/c.ts',
		])
	})

	it('supports negation patterns in excludes', async () => {
		const found = await rels({ extensions: [], excludeGlobs: ['src/**', '!src/a.ts'] })
		// '!src/a.ts' matches every path except src/a.ts, so everything is excluded here.
		assert.deepEqual(found, [])
	})

	it('returns forward-slash absolute paths', async () => {
		const found = await walk(root, { extensions: ['.md'] })
		assert.deepEqual(found, [`${root}/README.md`])
	})
})
