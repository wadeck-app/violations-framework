// violations-updater entry point - bundled separately as violations-updater.cjs
// Must NOT import any violations runtime modules.
import { runUpdater, execNpm } from '@wadeck-app/shared-updater';
import { ConfigDir } from '@wadeck-app/shared-cli/ConfigDir';
import { join } from 'node:path';

declare const __VIOLATIONS_CLI_VERSION__: string;

const PKG_NAME = '@wadeck-app/violations-cli';
const configDir = process.env['VIOLATIONS_CONFIG_DIR'] ?? ConfigDir.get('violations');
const rawVersion = typeof __VIOLATIONS_CLI_VERSION__ !== 'undefined' ? __VIOLATIONS_CLI_VERSION__ : '0.0.0-dev';
// One-time migration: old HHMMSS format (e.g. 2026.08.30-193645-78-sha) has a 6-digit
// time segment that semverLte misreads as newer than the current CalVer build numbers.
// Force it to 0.0.0 so any CalVer version triggers the update.
const currentVersion = /^\d{4}\.\d{2}\.\d{2}-\d{6}/.test(rawVersion) ? '0.0.0' : rawVersion;

// Compute self-check command so shared-updater can verify the install after upgrade.
try {
	const npmRoot = execNpm(['root', '-g'], { timeout: 10_000 }).trim();
	const selfCheckCmd = `${process.execPath} ${join(npmRoot, PKG_NAME, 'dist-bundle', 'violations.cjs')} cli self-check`;
	process.env['UPDATER_SELF_CHECK_CMD'] = selfCheckCmd;
} catch {
	// Skip self-check if npm root is unavailable - update proceeds without verification.
}

runUpdater({
	pkgName: PKG_NAME,
	configDir,
	currentVersion,
	strategy: 'without-daemon',
}).catch(err => {
	process.stderr.write(`[violations-updater] fatal: ${err}\n`);
	process.exit(1);
});
