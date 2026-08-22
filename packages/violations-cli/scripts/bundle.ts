/**
 * Bundles the violations CLI and its updater into standalone CommonJS files.
 * Outputs: dist-bundle/violations.cjs, dist-bundle/violations-updater.cjs
 * Usage:   npx tsx scripts/bundle.ts
 */
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8')) as { version: string };

await build({
	entryPoints: [path.join(root, 'dist/cli.js')],
	bundle: true,
	platform: 'node',
	target: 'node24',
	format: 'cjs',
	outfile: path.join(root, 'dist-bundle/violations.cjs'),
	// typescript: uses __dirname for lib/*.d.ts resolution -- must stay external
	// @wadeck/violations-rules: runtime plugin loaded from project -- must stay external
	external: ['typescript', '@wadeck/violations-rules'],
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
