import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') {
  throw new Error('Build output must be the project dist directory.');
}

const entries = [
  'index.html', 'styles.css', 'src',
  'Background', 'Items', 'Main Characters', 'Menu', 'Other', 'Terrain', 'Traps'
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(entries.map(entry => cp(path.join(root, entry), path.join(output, entry), { recursive: true })));
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Static workshop built in dist/.');
