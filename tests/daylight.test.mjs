import test from 'node:test';
import assert from 'node:assert/strict';
import {createDaylight,darknessAt,validateDaylight} from '../scripts/daylight.mjs';
import {createClock} from '../scripts/integration.mjs';
import {avoidObstacles,halfHourMinute} from '../scripts/clock-panel.mjs';
import {mockWorld} from '../tools/mock-world.mjs';

function fixture(){
  const f=mockWorld();f.game.modules.delete('smalltime');
  const changes=[],flags={};
  const scene={documentName:'Scene',name:'Mapa',environment:{darknessLevel:0},getFlag:(scope,key)=>flags[scope+'.'+key],async setFlag(scope,key,value){flags[scope+'.'+key]=value;},async update(data){changes.push(data);this.environment.darknessLevel=data['environment.darknessLevel'];}};
  const clock=createClock(f.game,()=>({mode:'lunar',offsetDays:0,seasonOffset:0}));
  const light=createDaylight(f.game,clock,()=>scene);
  return {...f,scene,changes,flags,clock,light};
}
test('daylight transitions smoothly, handles negative eras and rejects malformed schedules',()=>{
  assert.equal(darknessAt(12*3600),0);assert.equal(darknessAt(0),0.85);
  assert.equal(darknessAt(6*3600),0.425);assert.equal(darknessAt(18*3600),0.425);
  assert.equal(darknessAt(-3600),darknessAt(23*3600));
  for(const input of [{sunriseStart:7},{sunsetEnd:25},{maxDarkness:2},{minDarkness:0.9},{sunsetStart:NaN}])assert.throws(()=>validateDaylight(input));
});
test('native illumination is opt-in, active-GM only, respects scene locks and never writes external flags',async()=>{
  const f=fixture();f.game.time.worldTime=0;
  await f.light.sync();assert.equal(f.changes.length,0);
  await f.light.setSceneDaylight(f.scene,true);assert.deepEqual(f.changes,[{'environment.darknessLevel':0.85}]);
  assert.deepEqual(Object.keys(f.flags),['quedaco-calendario.daylight']);
  f.scene.environment.darknessLock=true;f.game.time.worldTime=43200;await f.light.sync();assert.equal(f.changes.length,1);
  f.scene.environment.darknessLock=false;f.game.user=f.game.users.get('alice');await f.light.sync();assert.equal(f.changes.length,1);
  await assert.rejects(f.light.setSceneDaylight(f.scene,false),/Mestra/);
  await assert.rejects(f.light.setTimeOfDay(100),/Mestra/);
  await assert.rejects(f.light.setClockMode('off'),/Mestra/);
  await assert.rejects(f.light.setDaylightConfig({}),/Mestra/);
  f.game.user=f.game.users.get('gm');f.game.users.activeGM={id:'another-gm'};await f.light.sync();assert.equal(f.changes.length,1);
  f.game.users.activeGM=f.game.user;await f.light.sync();assert.equal(f.changes.length,2);
  await f.light.setSceneDaylight(f.scene,false);f.game.time.worldTime=0;await f.light.sync();assert.equal(f.changes.length,2);
});
test('SmallTime compatibility prevents a second writer, off preserves existing scene darkness',async()=>{
  const f=fixture();f.game.time.worldTime=0;await f.light.setSceneDaylight(f.scene,true);
  f.game.modules.set('smalltime',{active:true});f.game.time.worldTime=43200;
  await f.light.setClockMode('native');assert.equal(f.light.getClockStatus().engine,'smalltime');assert.equal(f.changes.length,1);
  await assert.rejects(f.light.setSceneDaylight(f.scene,true),/SmallTime/);
  f.game.modules.delete('smalltime');await f.light.setClockMode('off');await f.light.sync();assert.equal(f.changes.length,1);
  await f.light.setClockMode('auto');assert.equal(f.changes.length,2);
});
test('clock slider keeps campaign day and selected timeline intact, with strict time bounds',async()=>{
  const f=fixture(),before=f.clock.getCurrentDate().absoluteDay;
  for(const seconds of [0,86340,12*3600]){await f.light.setTimeOfDay(seconds);assert.equal(f.clock.getCurrentDate().absoluteDay,before);}
  for(const invalid of [-1,86400,NaN,3.5])await assert.rejects(f.light.setTimeOfDay(invalid),/inválido/);
  await assert.rejects(f.light.setSceneDaylight({...f.scene,inCompendium:true},true),/mundo/);
});
test('compact panel avoids Nexus, players and other overlays within narrow viewport',()=>{
  const size={width:200,height:110},nexus={left:15,right:115,top:320,bottom:350},players={left:0,right:215,top:530,bottom:650};
  const p=avoidObstacles({x:15,y:340},size,[nexus,players],{width:375,height:650});
  assert.equal(p.clear,true);assert.ok(p.x>=8&&p.x+size.width<=367);assert.ok(p.y>=8&&p.y+size.height<=642);
  for(const r of [nexus,players])assert.ok(p.x>=r.right||p.x+size.width<=r.left||p.y>=r.bottom||p.y+size.height<=r.top);
});
test('compact clock snaps to half-hour slots without crossing midnight',()=>{
  for(const [minute,expected]of [[0,0],[474,480],[721,720],[750,750],[1439,1410]])assert.equal(halfHourMinute(minute),expected);
});
