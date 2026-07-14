import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import type { RuleResult } from '@wadeck/violations-rules'

async function ensureGitignore(dotViolationsDir: string): Promise<void> {
	const gitignorePath = join(dotViolationsDir, '.gitignore')
	if (!existsSync(gitignorePath)) {
		await writeFile(gitignorePath, '.cache/\n.reports/\n', 'utf8')
	}
}

export async function writeReports(
	dotViolationsDir: string,
	results: RuleResult[]
): Promise<{ reportPath: string; suppressedPath: string }> {
	const reportsDir = join(dotViolationsDir, '.reports')
	await mkdir(reportsDir, { recursive: true })
	await ensureGitignore(dotViolationsDir)

	const generatedAt = new Date().toISOString()
	const totalViolations = results.reduce((s, r) => s + r.counts.violations, 0)
	const totalSuppressed = results.reduce((s, r) => s + r.counts.suppressed, 0)

	// report.json
	const json = {
		generatedAt,
		totalViolations,
		rules: results.map(r => ({
			id: r.ruleId,
			severity: r.severity,
			violations: r.violations,
		})),
	}
	const reportJsonPath = join(reportsDir, 'report.json')
	await writeFile(reportJsonPath, JSON.stringify(json, null, 2), 'utf8')

	// suppressed.json
	const suppressedJson = {
		generatedAt,
		totalSuppressed,
		rules: results
			.filter(r => r.counts.suppressed > 0)
			.map(r => ({ id: r.ruleId, severity: r.severity, suppressed: r.suppressed })),
	}
	const suppressedJsonPath = join(reportsDir, 'suppressed.json')
	await writeFile(suppressedJsonPath, JSON.stringify(suppressedJson, null, 2), 'utf8')

	// report.md
	const mdLines: string[] = []
	mdLines.push('# Violations report')
	mdLines.push('')
	mdLines.push(`Generated: ${generatedAt}`)
	mdLines.push(`Total violations: ${totalViolations}`)
	mdLines.push('')
	for (const r of results) {
		const count = r.counts.violations
		mdLines.push(`## ${r.ruleId} [${r.severity}] (${count} violation${count === 1 ? '' : 's'})`)
		mdLines.push('')
		if (count === 0) {
			mdLines.push('- (clean)')
		} else {
			for (const v of r.violations) {
				mdLines.push(`- ${v.line ? `${v.file}:${v.line}` : v.file}: ${v.message}`)
			}
		}
		mdLines.push('')
	}
	const reportPath = join(reportsDir, 'report.md')
	await writeFile(reportPath, mdLines.join('\n'), 'utf8')

	// suppressed.md
	const supLines: string[] = []
	supLines.push('# Suppressed violations (audit)')
	supLines.push('')
	supLines.push(`Generated: ${generatedAt}`)
	supLines.push(`Total suppressed: ${totalSuppressed}`)
	supLines.push('')
	for (const r of results) {
		if (r.counts.suppressed === 0) continue
		supLines.push(`## ${r.ruleId} (${r.counts.suppressed} suppressed)`)
		supLines.push('')
		for (const v of r.suppressed) {
			const loc = v.line ? `${v.file}:${v.line}` : v.file
			supLines.push(`- ${loc}: ${v.message}`)
		}
		supLines.push('')
	}
	const suppressedPath = join(reportsDir, 'suppressed.md')
	await writeFile(suppressedPath, supLines.join('\n'), 'utf8')

	return { reportPath, suppressedPath }
}
