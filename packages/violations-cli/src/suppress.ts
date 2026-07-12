import { readFileSync } from 'node:fs'

export interface ParsedSuppress {
	ruleIds: string[]
	reason?: string
}

const CACHE = new Map<string, string[]>()

function getLines(absPath: string): string[] {
	if (CACHE.has(absPath)) return CACHE.get(absPath)!
	let lines: string[]
	try {
		lines = readFileSync(absPath, 'utf8').split(/\r?\n/)
	} catch {
		lines = []
	}
	CACHE.set(absPath, lines)
	return lines
}

export function parseSuppress(line: string): ParsedSuppress | null {
	if (!line) return null
	const match = line.match(
		/(?:\/\/|\/\*|#|<!--)\s*violations-suppress:\s*([a-z0-9,/\-]+)(?:\s+(.*))?(?:\*\/|-->)?$/i
	)
	if (!match) return null
	const ruleIds = match[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
	const reasonRaw = (match[2] ?? '').replace(/\*\/|-->$/, '').trim()
	return { ruleIds, reason: reasonRaw || undefined }
}

function parseSuppressStart(line: string): string[] | null {
	if (!line) return null
	const match = line.match(
		/(?:\/\/|\/\*|#|<!--)\s*violations-suppress-start:\s*([a-z0-9,/\-]+)(?:\s.*)?(?:\*\/|-->)?$/i
	)
	if (!match) return null
	return match[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

function parseSuppressEnd(line: string): string[] | null {
	if (!line) return null
	const match = line.match(
		/(?:\/\/|\/\*|#|<!--)\s*violations-suppress-end:\s*([a-z0-9,/\-]+)(?:\s.*)?(?:\*\/|-->)?$/i
	)
	if (!match) return null
	return match[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

export function isSuppressed(absPath: string, lineNumber: number, ruleId: string): boolean {
	if (!lineNumber) return false
	const id = ruleId.toLowerCase()
	const lines = getLines(absPath)

	const sameLine = parseSuppress(lines[lineNumber - 1] ?? '')
	if (sameLine && sameLine.ruleIds.includes(id)) return true

	const above = parseSuppress(lines[lineNumber - 2] ?? '')
	if (above && above.ruleIds.includes(id)) return true

	for (let i = lineNumber - 2; i >= 0; i--) {
		const endIds = parseSuppressEnd(lines[i] ?? '')
		if (endIds && endIds.includes(id)) break
		const startIds = parseSuppressStart(lines[i] ?? '')
		if (startIds && startIds.includes(id)) return true
	}

	return false
}

export function getSuppressReason(absPath: string, lineNumber: number): string | undefined {
	if (!lineNumber) return undefined
	const lines = getLines(absPath)

	const sameLine = parseSuppress(lines[lineNumber - 1] ?? '')
	if (sameLine) return sameLine.reason

	const above = parseSuppress(lines[lineNumber - 2] ?? '')
	if (above) return above.reason

	return undefined
}
