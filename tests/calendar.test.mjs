import test from 'node:test';
import assert from 'node:assert/strict';
import {DAY, CYCLES, HOLIDAYS, worldTimeToDate, dateToWorldTime, moons, holidaysFor, eventsFor, validateEvent, lunarAge, formatDate} from '../scripts/calendar.mjs';
import {createClock} from '../scripts/integration.mjs';

test('round trips across both modes, eras, leap-free boundaries and date calibration', () => {
  for (const mode of ['lunar', 'solar']) for (const offsetDays of [-241, 0, 349 * 240]) {
    for (const time of [-480 * DAY - 1, -DAY, -1, 0, 86399, DAY, 15 * DAY, 120 * DAY, 240 * DAY - 1, 240 * DAY, 480 * DAY, 349 * 240 * DAY + 12345]) {
      const date = worldTimeToDate(time, {mode, offsetDays});
      assert.equal(dateToWorldTime(date, {mode, offsetDays}), time);
      assert.equal(date.hour * 3600 + date.minute * 60 + date.second, ((time % DAY) + DAY) % DAY);
    }
  }
});
test('cycle, weekday and year transitions have no skipped or duplicated dates', () => {
  const before = worldTimeToDate(240 * DAY - 1);
  const after = worldTimeToDate(240 * DAY);
  assert.deepEqual([before.year, before.cycle, before.day, before.weekday], [0, 16, 15, 'Tenedris']);
  assert.deepEqual([after.year, after.cycle, after.day, after.weekday], [1, 1, 1, 'Lunadi']);
  assert.equal(worldTimeToDate(15 * DAY).cycleName, 'Vida');
  assert.equal(worldTimeToDate(-1).year, -1);
  assert.match(formatDate(worldTimeToDate(-1)), /Anel 1 A.F./);
});
test('480-day solar year is two lunar rings, and seasons continue through lunar rollover', () => {
  for (let day = 0; day < 960; day++) {
    const lunar = worldTimeToDate(day * DAY);
    const solar = worldTimeToDate(day * DAY, {mode: 'solar'});
    assert.equal(lunar.cycleName, solar.cycleName);
    assert.equal(lunar.day, solar.day);
    assert.equal(lunar.season, solar.season);
    assert.equal(solar.repetition, Math.floor((day % 480) / 240) + 1);
  }
  assert.deepEqual([0, 120, 240, 360, 480].map(d => worldTimeToDate(d * DAY).season), ['Primavera', 'Verão', 'Outono', 'Inverno', 'Primavera']);
  assert.equal(worldTimeToDate(240 * DAY, {mode: 'solar'}).year, 0);
  assert.equal(worldTimeToDate(480 * DAY, {mode: 'solar'}).year, 1);
});
test('official cycle names and all holiday positions match the supplied image', () => {
  assert.equal(CYCLES.length, 16);
  assert.deepEqual(HOLIDAYS.map(h => [h.cycle, h.day]), [[1,1],[1,2],[2,4],[4,9],[4,13],[5,8],[6,14],[7,12],[8,7],[9,2],[10,4],[11,14],[12,12],[13,14],[14,10],[15,1],[16,14]]);
  for (const h of HOLIDAYS) {
    for (const day of [(h.cycle - 1) * 15 + h.day - 1, 240 + (h.cycle - 1) * 15 + h.day - 1]) {
      assert.ok(holidaysFor(worldTimeToDate(day * DAY, {mode: 'solar'})).some(found => found.id === h.id));
    }
  }
});
test('moon patterns repeat across year boundaries and negative eras', () => {
  assert.equal(moons(4)[0].phase, 'Sem lua');
  assert.equal(moons(2)[0].phase, 'Cheia');
  assert.equal(moons(14)[1].phase, 'Sem lua');
  for (let day = -480; day < 480; day++) assert.deepEqual(moons(day), moons(day + 240));
});
test('age is always measured in lunar rings, with accurate Earth-day comparison', () => {
  assert.equal(lunarAge(0, 18 * 240).rings, 18);
  assert.ok(Math.abs(lunarAge(0, 18 * 240).earthYears - 11.8277) < .001);
  assert.equal(lunarAge(100, 100 + 27 * 240).rings, 27);
  assert.throws(() => lunarAge(1, 0));
});
test('records respect recurrence start, solar/lunar periods and player privacy', () => {
  const events = [
    {id:'one', absoluteDay:0, repeat:'once'}, {id:'lunar', absoluteDay:0, repeat:'lunar'},
    {id:'solar', absoluteDay:0, repeat:'solar'}, {id:'secret', absoluteDay:0, repeat:'lunar', private:true}
  ];
  assert.deepEqual(eventsFor(events, 240, {isGM:false}).map(e => e.id), ['lunar']);
  assert.deepEqual(eventsFor(events, 480, {isGM:true}).map(e => e.id), ['lunar', 'solar', 'secret']);
  assert.equal(eventsFor(events, -240, {isGM:true}).length, 0);
  assert.throws(() => validateEvent({title:'', absoluteDay:0, repeat:'once', description:''}));
});
test('invalid and overflow dates cannot reach the world clock', () => {
  for (const patch of [{cycle:17}, {cycle:0}, {day:16}, {hour:24}, {minute:60}, {second:-1}, {year:Infinity}, {day:1.5}]) {
    assert.throws(() => dateToWorldTime({year:0, cycle:1, day:1, ...patch}));
  }
  assert.throws(() => worldTimeToDate(NaN));
  assert.throws(() => worldTimeToDate(0, {mode:'bad'}));
});

function fixture() {
  let config = {mode:'lunar', offsetDays:0};
  const writes = [], advances = [];
  const game = {
    user: {isGM:true}, modules: new Map([['smalltime', {active:true, version:'2.0.5'}]]),
    settings: {set: async (id, key, value) => {writes.push([id,key,value]); config[key] = value;}},
    time: {worldTime:DAY * 17 + 3600 * 23 + 59 * 60 + 30, advance: async seconds => {advances.push(seconds); game.time.worldTime += seconds;}}
  };
  return {game, writes, advances, clock:createClock(game, () => config), config};
}
test('calendar advances the exact Foundry clock used by SmallTime, including midnight', async () => {
  const f = fixture();
  await f.clock.advanceTime(60);
  assert.deepEqual(f.advances, [60]);
  assert.equal(f.clock.getCurrentDate().hour, 0);
  assert.equal(f.clock.getCurrentDate().day, 4);
  // Simulates a native SmallTime change: no second clock or hidden offset needed.
  await f.game.time.advance(3600);
  assert.equal(f.clock.getCurrentDate().hour, 1);
});
test('calibrating campaign date preserves clock and writes only an integer-day epoch', async () => {
  const f = fixture(), before = f.game.time.worldTime;
  await f.clock.calibrate({year:349, cycle:1, day:1});
  assert.equal(f.game.time.worldTime, before);
  assert.equal(f.advances.length, 0);
  assert.equal(f.clock.getCurrentDate().year, 349);
  assert.equal(f.clock.getCurrentDate().cycle, 1);
  assert.equal(f.clock.getCurrentDate().day, 1);
  assert.equal(f.clock.getCurrentDate().hour, 23);
  f.config.mode = 'solar';
  assert.equal(f.game.time.worldTime, before);
  assert.equal(f.clock.getCurrentDate().lunarYear, 349);
});
test('only GMs can set dates or link SmallTime illumination, and no scene-light writer is introduced', async () => {
  const f = fixture(), flags = [];
  const scene = {documentName:'Scene',setFlag: async (...args) => flags.push(args)};
  await f.clock.setSmallTimeSceneLink(scene, true);
  assert.deepEqual(flags, [['smalltime','darkness-link',true]]);
  await assert.rejects(f.clock.setSmallTimeSceneLink({...scene,documentName:'JournalEntry'},true));
  await assert.rejects(f.clock.setSmallTimeSceneLink({...scene,inCompendium:true},true));
  f.game.user.isGM = false;
  await assert.rejects(f.clock.advanceTime(1));
  await assert.rejects(f.clock.setDate({year:1, cycle:1, day:1}));
  await assert.rejects(f.clock.calibrate({year:1, cycle:1, day:1}));
  await assert.rejects(f.clock.setSmallTimeSceneLink(scene, false));
  assert.equal(f.advances.length, 0);
  f.game.user.isGM = true;
  f.game.modules.get('smalltime').active = false;
  await assert.rejects(f.clock.setSmallTimeSceneLink(scene, false));
});
