import { ConfigDir } from '@wadeck/shared-cli/ConfigDir'
import * as fs from 'node:fs'
import * as path from 'node:path'

export interface UserConfig {
	update: {
		channel: string;
		checkInterval: string;
		disabled: boolean;
	};
}

const DEFAULTS: UserConfig = {
	update: {
		channel: 'edge',
		checkInterval: '30m',
		disabled: false,
	},
}

export function loadUserConfig(configDir?: string): UserConfig {
	const resolvedDir = configDir ?? ConfigDir.get('violations')
	const configFile = path.join(resolvedDir, 'config.yml')

	if (!fs.existsSync(configFile)) return DEFAULTS

	try {
		const raw = fs.readFileSync(configFile, 'utf-8')
		const channelMatch = /^\s*channel:\s*['"]?(\S+?)['"]?\s*$/m.exec(raw)
		const intervalMatch = /^\s*checkInterval:\s*['"]?(\S+?)['"]?\s*$/m.exec(raw)
		const disabledMatch = /^\s*disabled:\s*(true|false)\s*$/m.exec(raw)

		return {
			update: {
				channel: channelMatch?.[1] ?? DEFAULTS.update.channel,
				checkInterval: intervalMatch?.[1] ?? DEFAULTS.update.checkInterval,
				disabled: disabledMatch?.[1] === 'true',
			},
		}
	} catch {
		process.stderr.write(`[violations] Warning: failed to read ${configFile}, using defaults.\n`)
		return DEFAULTS
	}
}
