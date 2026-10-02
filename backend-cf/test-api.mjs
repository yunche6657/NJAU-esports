import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare } from 'miniflare';
import worker from './worker.js';

// A disposable in-memory D1; no production database or real applications are touched.
const mf = new Miniflare({ workers: [{ config: {
  name: 'api-regression', compatibilityDate: '2026-09-01',
  manifest: { mainModule: 'entry.js', modules: { 'entry.js': { type: 'esm', contents: 'export default {fetch(){return new Response("test")}}' } } },
  env: { DB: { type: 'd1' } }
} }] });
let checks = 0;
try {
  await mf.ready;
  const db = await mf.getD1Database('DB');
  await db.exec((await readFile(new URL('./schema.sql', import.meta.url), 'utf8')).replace(/--[^\n]*/g, '').replace(/\s+/g, ' '));
  const env = { DB: db, ADMIN_KEY: 'isolated-test-key' };
  const call = (path, init) => worker.fetch(new Request('http://local.test' + path, init), env);
  const post = body => call('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const config = await (await call('/api/config')).json();
  assert.deepEqual(config.stats.map(s => s.value), [128, 8, 10, 6]); checks++;
  assert.equal(config.games.find(g => g.id === 'overwatch').group.number, '884633499'); checks++;
  for (const g of config.games) { await readFile(new URL('../frontend' + g.qr, import.meta.url)); checks++; }
  assert.equal((await call('/api/apply/list')).status, 401); checks++;
  assert.equal((await call('/api/apply/list', { headers: { Authorization: 'Bearer wrong' } })).status, 401); checks++;
  for (const invalid of [{}, [], null, { name: 'A', contact: 'B', games: ['invalid'] }, { name: 'A', contact: 'B', games: [] }, { name: 'A', contact: 'B', games: ['cs2'], major: 'X'.repeat(101) }, { name: 'A', contact: 'B', games: ['cs2'], intro: 'X'.repeat(2001) }]) {
    assert.equal((await post(invalid)).status, 400); checks++;
  }
  assert.equal((await post({ intro: '汉'.repeat(22000) })).status, 413); checks++;
  const valid = await post({ name: '=1+1', contact: '@SUM(1,2)', games: ['overwatch', 'cs2', 'cs2'] });
  assert.equal(valid.status, 200); assert.equal((await valid.json()).ok, true); checks++;
  const stats = await (await call('/api/apply/stats')).json();
  assert.equal(stats.total, 1); assert.equal(stats.by_game.cs2, 1); assert.equal(stats.by_game.overwatch, 1); checks++;
  const auth = { headers: { Authorization: 'Bearer isolated-test-key' } };
  const list = await (await call('/api/apply/list', auth)).json();
  assert.equal(list.total, 1); assert.deepEqual(list.applications[0].games, ['overwatch', 'cs2']); checks++;
  const csv = await (await call('/api/apply/list?format=csv', auth)).text();
  assert.ok(csv.includes("'=1+1")); assert.ok(csv.includes("'@SUM(1,2)")); checks++;
  assert.equal((await call('/api/unknown')).status, 404); checks++;
  console.log(`PASS: ${checks} API checks; disposable D1, validation, authorization, CSV and current configuration.`);
} finally { await mf.dispose(); }
