import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import ts from 'typescript'
import type { CacheManifest } from '@wadeck-app/violations-rules'

async function readManifest(manifestPath: string): Promise<CacheManifest> {
	try {
		const raw = await readFile(manifestPath, 'utf8')
		return JSON.parse(raw) as CacheManifest
	} catch {
		return { frameworkVersion: '', files: {} }
	}
}

async function writeManifest(manifestPath: string, manifest: CacheManifest): Promise<void> {
	const tmp = manifestPath + '.' + randomBytes(6).toString('hex') + '.tmp'
	await writeFile(tmp, JSON.stringify(manifest, null, 2), 'utf8')
	await rename(tmp, manifestPath)
}

export async function compileIfNeeded(
	sourcePath: string,
	outputPath: string,
	manifestPath: string,
	frameworkVersion: string,
	/** Optional map from absolute .js path → compiled cache .js path for redirecting rule imports */
	importRedirects?: Map<string, string>
): Promise<void> {
	const manifest = await readManifest(manifestPath)

	// If framework version changed, evict all entries
	if (manifest.frameworkVersion !== frameworkVersion) {
		manifest.files = {}
		manifest.frameworkVersion = frameworkVersion
	}

	const entry = manifest.files[sourcePath]
	let sourceMtime: number
	try {
		const s = await stat(sourcePath)
		sourceMtime = s.mtimeMs
	} catch {
		throw new Error(`Source file not found: ${sourcePath}`)
	}

	const compiledExists = existsSync(outputPath)
	if (entry && entry.mtimeMs === sourceMtime && compiledExists) {
		// Up to date -- skip
		return
	}

	// Compile
	const source = await readFile(sourcePath, 'utf8')
	const result = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.ESNext,
			target: ts.ScriptTarget.ES2022,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			esModuleInterop: true,
		},
		fileName: sourcePath,
	})

	// Rewrite relative imports to absolute file:// URLs so the compiled file
	// resolves correctly from the cache directory (not the source directory).
	// If importRedirects is provided, redirect rule imports to their cache paths.
	// Also rewrite import.meta.dirname to the source directory so fixture paths
	// (e.g. resolve(import.meta.dirname, 'fixtures/...')) resolve correctly.
	const srcDir = dirname(sourcePath)
	const rewritten = result.outputText
		.replace(
			/from\s+['"](\.[^'"]+)['"]/g,
			(_, rel) => {
				const absPath = resolve(srcDir, rel)
				const absUrl = pathToFileURL(absPath).href
				const redirect = importRedirects?.get(absUrl)
				return `from '${redirect ?? absUrl}'`
			}
		)
		.replace(/\bimport\.meta\.dirname\b/g, JSON.stringify(srcDir.replace(/\\/g, '/')))

	await mkdir(dirname(outputPath), { recursive: true })
	await writeFile(outputPath, rewritten, 'utf8')

	// Update manifest
	manifest.files[sourcePath] = { mtimeMs: sourceMtime, compiledPath: outputPath }
	await mkdir(dirname(manifestPath), { recursive: true })
	await writeManifest(manifestPath, manifest)
}

export async function typeCheck(sourcePath: string): Promise<{ errors: string[] }> {
	const source = await readFile(sourcePath, 'utf8')
	const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ES2022, true)
	const defaultCompilerHost = ts.createCompilerHost({})
	const customHost: ts.CompilerHost = {
		...defaultCompilerHost,
		getSourceFile: (fileName, langVersion) => {
			if (fileName === sourcePath) return sourceFile
			return defaultCompilerHost.getSourceFile(fileName, langVersion)
		},
	}

	const program = ts.createProgram([sourcePath], {
		noEmit: true,
		strict: true,
		module: ts.ModuleKind.ESNext,
		target: ts.ScriptTarget.ES2022,
	}, customHost)

	const diagnostics = ts.getPreEmitDiagnostics(program)
	const errors: string[] = []
	for (const diag of diagnostics) {
		if (diag.file && diag.start !== undefined) {
			const { line } = diag.file.getLineAndCharacterOfPosition(diag.start)
			errors.push(`${diag.file.fileName}:${line + 1}: ${ts.flattenDiagnosticMessageText(diag.messageText, '\n')}`)
		} else {
			errors.push(ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
		}
	}
	return { errors }
}
