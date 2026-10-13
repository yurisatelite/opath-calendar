import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Handlebars from 'handlebars';
import {fixture} from '../tools/ui-fixture.mjs';

test('Foundry bootstrap and template render both calendars, GM controls and safe player notes', async () => {
  const f = await fixture();
  const source = await readFile(new URL('../templates/calendar.hbs', import.meta.url), 'utf8');
  const template = Handlebars.compile(source);
  let html = template(await f.app._prepareContext());
  assert.equal((html.match(/data-day=/g) ?? []).length, 240);
  assert.ok(html.includes('Segredo da Mestra'));
  assert.ok(html.includes('data-date-form'));
  assert.ok(html.includes('data-event-form'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>alert'));
  const before = f.game.time.worldTime;
  await f.game.settings.set('opath-calendar','mode','solar');
  html = template(await f.app._prepareContext());
  assert.equal((html.match(/data-day=/g) ?? []).length, 480);
  assert.ok(html.includes('volta 2/2'));
  assert.equal(f.game.time.worldTime, before);
  f.game.user.isGM = false;
  html = template(await f.app._prepareContext());
  assert.ok(!html.includes('Segredo da Mestra'));
  assert.ok(html.includes('Viagem da guilda'));
  assert.ok(!html.includes('data-date-form'));
  assert.ok(!html.includes('data-event-form'));
  assert.ok(!html.includes('data-advance='));
});

test('manifest only ships existing runtime files and requires SmallTime', async () => {
  const manifest = JSON.parse(await readFile(new URL('../module.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.relationships.requires.map(r => r.id), ['smalltime']);
  for (const file of [...manifest.esmodules, ...manifest.styles, 'templates/calendar.hbs']) await readFile(new URL(`../${file}`, import.meta.url));
});
