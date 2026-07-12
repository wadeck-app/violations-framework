import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import micromatch from 'micromatch'

const DEFAULT_EXCLUDE_GLOBS = [
	'**/node_modules/**',
	'**/.git/**',
	'**/dist/**',
	'**/build/**',
	'**/coverage/**',
	'**/.turbo/**',
	'**/.cache/**',
	'**/generated/**',
]

export async function walk(
	dir: string,
	options: { extensions: string[]; excludeGlobs?: string[] }
): Promise<string[]> {
	const allExcludes = [...DEFAULT_EXCLUDE_GLOBS, ...(options.excludeGlobs ?? [])]
	const results: string[] = []

	async function visit(current: string): Promise<void> {
		let entries
		try {
			entries = await readdir(current, { withFileTypes: true })
		} catch {
			return
		}
		for (const entry of entries) {
			const full = join(current, entry.name)
			const rel = relative(dir, full).split('\\').join('/')
			if (micromatch.isMatch(rel, allExcludes)) continue
			if (entry.isDirectory()) {
				await visit(full)
			} else if (entry.isFile()) {
				if (options.extensions.length > 0 && !options.extensions.some(ext => entry.name.endsWith(ext))) continue
				results.push(full.split('\\').join('/'))
			}
		}
	}

	await visit(dir)
	return results
}
