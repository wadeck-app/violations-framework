/**
 * Bundles the violations CLI and its updater into standalone CommonJS files.
 * Outputs: dist-bundle/violations.cjs, dist-bundle/violations-updater.cjs
 * Usage:   npx tsx scripts/bundle.ts
 */
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function getCalVer(): string {
	const now = new Date();
	const pad2 = (n: number) => String(n).padStart(2, '0');
	const date = `${now.getFullYear()}.${pad2(now.getMonth() + 1)}.${pad2(now.getDate())}`;
	const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
	let count = '0';
	let hash = 'DEV';
	try { count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim(); } catch { /* not a git repo */ }
	try { hash = execSync('git rev-parse --short=8 HEAD', { encoding: 'utf8' }).trim(); } catch { /* not a git repo */ }
	return `${date}-${time}-${count}-${hash}`;
}
const version = getCalVer();

await build({
	entryPoints: [path.join(root, 'dist/cli.js')],
	bundle: true,
	platform: 'node',
	target: 'node24',
	format: 'cjs',
	outfile: path.join(root, 'dist-bundle/violations.cjs'),
	// typescript: uses __dirname for lib/*.d.ts resolution -- must stay external
	// @wadeck-app/violations-rules: runtime plugin loaded from project -- must stay external
	external: ['typescript', '@wadeck-app/violations-rules'],
	supported: { 'top-level-await': false },
	define: {
		'import.meta.url': '__importMetaUrl',
		__VIOLATIONS_CLI_VERSION__: JSON.stringify(version),
	},
	banner: {
		js: `const __importMetaUrl = require('url').pathToFileURL(__filename).href;`,
	},
	logLevel: 'warning',
});

console.log('Bundle written to dist-bundle/violations.cjs');

await build({
	entryPoints: [path.join(root, 'dist/updater/UpdaterMain.js')],
	bundle: true,
	platform: 'node',
	target: 'node24',
	format: 'cjs',
	outfile: path.join(root, 'dist-bundle/violations-updater.cjs'),
	external: [],
	supported: { 'top-level-await': false },
	define: {
		'import.meta.url': '__importMetaUrl',
		__VIOLATIONS_CLI_VERSION__: JSON.stringify(version),
	},
	banner: {
		js: `const __importMetaUrl = require('url').pathToFileURL(__filename).href;`,
	},
	logLevel: 'warning',
});

console.log('Bundle written to dist-bundle/violations-updater.cjs');
