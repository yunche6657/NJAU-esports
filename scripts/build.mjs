import { readdir, readFile, writeFile, mkdir, cp, unlink, lstat, stat } from 'node:fs/promises';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'frontend');
const output = resolve(root, 'dist');
const marker = resolve(root, '.dist-owned');
const excluded = /(?:^|\/)(?:model|reference|naraka\.bak|work|tools)(?:\/|$)|\.bak(?:-|\.|\/|$)|2025-valorant-second-poster-original\.png$/;
const rootAssets = new Set(['logo-nav.jpg', 'logo-bird-glow.png', 'logo-bird.jpg', 'xuanniao-11s.webm', 'xuanniao_head_refined.ply', 'cursor-glow.svg']);
const entryFiles = new Set(['index.html', 'activities.html', '404.html', '_headers']);

// Replace only this script's own output; never delete source or arbitrary directories.
if (output !== resolve(root, 'dist') || !output.startsWith(root + sep)) throw new Error('Unsafe output path');
const existing = await lstat(output).catch(error => { if (error.code !== 'ENOENT') throw error; });
if (existing) {
  const owner = await readFile(marker, 'utf8').catch(() => '');
  if (existing.isSymbolicLink() || !existing.isDirectory() || owner !== output) throw new Error('dist is not an owned build directory');
}
await mkdir(output, { recursive: true });
await writeFile(marker, output);
let total = 0;
const manifest = [];
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    const rel = relative(source, path).split(sep).join('/');
    if (excluded.test(rel) || item.isSymbolicLink()) continue;
    if (item.isDirectory()) {
      if (directory === source && !['assets', 'css', 'js'].includes(item.name)) continue;
      await walk(path);
    } else {
      if (directory === source && !entryFiles.has(item.name)) continue;
      if (rel.startsWith('js/') && !rel.endsWith('.js')) continue;
      if (rel.startsWith('css/') && !rel.endsWith('.css')) continue;
      if (/^assets\/[^/]+$/.test(rel) && !rootAssets.has(item.name)) continue;
      const bytes = (await stat(path)).size;
      if (bytes > 25 * 1024 * 1024) throw new Error(`Asset exceeds 25 MiB: ${rel}`);
      const target = resolve(output, rel);
      await mkdir(dirname(target), { recursive: true });
      await cp(path, target);
      manifest.push({ path: rel, bytes }); total += bytes;
    }
  }
}
await walk(source);
// Keep directories stable for Windows dev-server file watchers; remove only stale files.
const published = new Set(manifest.map(item => item.path));
async function prune(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (!path.startsWith(output + sep) || item.isSymbolicLink()) throw new Error('Unsafe build entry');
    if (item.isDirectory()) await prune(path);
    else if (!published.has(relative(output, path).split(sep).join('/'))) await unlink(path);
  }
}
await prune(output);
await mkdir(resolve(root, 'outputs'), { recursive: true });
await writeFile(resolve(root, 'outputs/build-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Built ${manifest.length} files, ${(total / 1048576).toFixed(1)} MiB in ${output}`);
