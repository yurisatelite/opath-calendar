import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimelines,activeBranch} from '../scripts/timelines.mjs';
import {worldTimeToDate} from '../scripts/calendar.mjs';
import {mockWorld} from '../tools/mock-world.mjs';
test('time travel preserves main date/time through repeated journeys and calendar recalibration',async()=>{
  const f=mockWorld();f.values.set('offsetDays',0);f.values.set('timelines',{activeId:'main',branches:[]});
  const config=()=>({mode:'lunar',offsetDays:activeBranch(f.values.get('timelines'),0).offsetDays});
  const timelines=createTimelines(f.game,config);await timelines.initialize();const origin=f.game.time.worldTime;
  const id=await timelines.create('Missão antiga',{year:-730,cycle:2,day:4,hour:6});await timelines.switchTo(id);
  assert.equal(worldTimeToDate(f.game.time.worldTime,config()).year,-730);
  await f.game.time.advance(10*86400);const past=f.game.time.worldTime;
  await timelines.switchTo('main');assert.equal(f.game.time.worldTime,origin);
  await f.game.time.advance(2*86400);const main=f.game.time.worldTime;
  await timelines.switchTo(id);assert.equal(f.game.time.worldTime,past);
  await timelines.calibrateOffset(42);await timelines.switchTo('main');assert.equal(config().offsetDays,0);assert.equal(f.game.time.worldTime,main);
  await timelines.switchTo(id);assert.equal(config().offsetDays,42);assert.equal(f.game.time.worldTime,past);
});
test('failed time switch restores the original branch and player calls cannot change campaign dates',async()=>{
  const f=mockWorld();f.values.set('offsetDays',0);f.values.set('timelines',{activeId:'main',branches:[]});
  const timelines=createTimelines(f.game,()=>({mode:'lunar',offsetDays:0}));await timelines.initialize();const id=await timelines.create('Passado',{year:-226,cycle:1,day:1});
  const origin=f.game.time.worldTime;f.game.time.advance=async()=>{throw Error('offline');};
  await assert.rejects(timelines.switchTo(id));assert.equal(timelines.getActive().id,'main');assert.equal(f.game.time.worldTime,origin);
  f.game.user=f.game.users.get('alice');await assert.rejects(timelines.switchTo(id));await assert.rejects(timelines.create('Outra',{year:0,cycle:1,day:1}));await assert.rejects(timelines.calibrateOffset(1));
});
