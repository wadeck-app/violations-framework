import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import ts from 'typescript'
import type { CacheManifest } from '@wadeck/violations-rules'

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
	frameworkVersion: string
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

	await mkdir(dirname(outputPath), { recursive: true })
	await writeFile(outputPath, result.outputText, 'utf8')

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
