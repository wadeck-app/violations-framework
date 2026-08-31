import { mkdirSync, accessSync, constants } from 'node:fs'
import { createRequire } from 'node:module'
import { ConfigDir } from '@wadeck-app/shared-cli/ConfigDir'
import { runSelfCheck } from '@wadeck-app/shared-cli'

// Injected by esbuild at bundle time via define; not present in plain tsc output.
declare const __VIOLATIONS_CLI_VERSION__: string

const _require = createRequire(import.meta.url)

export async function selfCheck(): Promise<void> {
	await runSelfCheck([
		async () => {
			try {
				const v: string = __VIOLATIONS_CLI_VERSION__
				if (!v) return { name: 'bundle-version', ok: false, detail: 'version string is empty' }
				return { name: 'bundle-version', ok: true }
			} catch {
				return { name: 'bundle-version', ok: false, detail: 'not bundled (dev build)' }
			}
		},
		async () => {
			try {
				const dir = process.env['VIOLATIONS_CONFIG_DIR'] ?? ConfigDir.get('violations')
				mkdirSync(dir, { recursive: true })
				accessSync(dir, constants.W_OK)
				return { name: 'config-dir-writable', ok: true }
			} catch (err) {
				return { name: 'config-dir-writable', ok: false, detail: String(err) }
			}
		},
		async () => {
			try {
				_require.resolve('typescript')
				return { name: 'typescript-api', ok: true }
			} catch (err) {
				return { name: 'typescript-api', ok: false, detail: String(err) }
			}
		},
	])
}
