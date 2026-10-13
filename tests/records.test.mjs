import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecords} from '../scripts/records.mjs';
import {normalizeRecord,recordHTML,recordOwnership,matchesDay} from '../scripts/record-model.mjs';
import {mockWorld} from '../tools/mock-world.mjs';
import {newspaperJournals} from '../scripts/newspaper.mjs';
const note=(extra={})=>({title:'A praça',description:'Choveu ao chegar.',location:'Alberich',weather:'Chuva',image:'',links:[],visibility:'private',sharedWith:[],repeat:'once',absoluteDay:240,timelineId:'main',...extra});
async function setup(){const f=mockWorld();f.values.set('diaryBooks',{});f.values.set('timelines',{activeId:'main',branches:[{id:'main'}]});const service=createRecords(f.game);service.registerQuery();await service.provision();return {...f,service};}
test('private journals allow player records without a global Journal-create permission',async()=>{
  const f=await setup();f.game.user=f.game.users.get('alice');
  const uuid=await f.service.save(note());
  const page=await fromUuid(uuid);
  assert.equal(page.parent.ownership.alice,3);assert.equal(page.parent.ownership.default,0);
  assert.equal(f.service.list().filter(r=>r.uuid===uuid).length,1);
  f.game.user=f.game.users.get('bob');assert.equal(f.service.list().length,0);
  await assert.rejects(f.service.save(note(),uuid),/próprios/);
});
test('publication, selective sharing and revocation use read-only copies, retaining originals',async()=>{
  const f=await setup();f.game.user=f.game.users.get('alice');
  const uuid=await f.service.save(note({visibility:'public'}));
  const source=await fromUuid(uuid),mirror=f.game.journal.find(j=>j.flags['quedaco-calendario']?.sourceUuid===uuid);
  assert.equal(mirror.ownership.bob,2);assert.equal(mirror.ownership.carol,2);
  assert.equal(f.service.list().filter(r=>r.title==='A praça').length,1);
  await f.service.save(note({visibility:'shared',sharedWith:['bob']}),uuid);
  assert.equal(mirror.ownership.bob,2);assert.equal(mirror.ownership.carol,0);
  f.game.user=f.game.users.get('bob');assert.equal(f.service.list().length,1);assert.equal(f.service.list()[0].canEdit,false);
  await assert.rejects(f.service.archive(uuid,true));
  f.game.user=f.game.users.get('alice');await f.service.save(note({visibility:'private'}),uuid);
  assert.equal(mirror.ownership.bob,0);assert.equal(mirror.ownership.default,0);assert.ok(source.text.content.includes('Choveu'));
  f.game.user=f.game.users.get('bob');assert.equal(f.service.list().length,0);
});
test('archive is recoverable, removes publications, and restores the author record',async()=>{
  const f=await setup();f.game.user=f.game.users.get('alice');const uuid=await f.service.save(note({visibility:'public'}));
  await f.service.archive(uuid,true);let record=f.service.list()[0];assert.equal(record.archived,true);assert.equal(matchesDay(record,240,'main'),false);
  f.game.user=f.game.users.get('bob');assert.equal(f.service.list().length,0);
  f.game.user=f.game.users.get('alice');await f.service.archive(uuid,false);assert.equal(f.service.list()[0].archived,false);
  f.game.user=f.game.users.get('bob');assert.equal(f.service.list().length,1);
});
test('an absent GM never gives a false successful unpublish, but private drafts still save',async()=>{
  const f=await setup();f.game.user=f.game.users.get('alice');const uuid=await f.service.save(note({visibility:'public'}));
  f.game.users.activeGM.active=false;
  await assert.rejects(f.service.save(note({visibility:'private'}),uuid),/Conecte/);
  assert.equal((await fromUuid(uuid)).flags['quedaco-calendario'].record.visibility,'public');
  const privateUuid=await f.service.save(note({title:'Rascunho offline'}));assert.ok(privateUuid);
});
test('history is GM-only, imprecise dates do not fabricate day icons, timeline filters isolate logs',async()=>{
  const f=await setup();const uuid=await f.service.save(note({historicalKey:'book-120',absoluteDay:120*240,visibility:'public'}));
  const record=f.service.list()[0];assert.equal(record.visibility,'private');assert.equal(record.precision,'year');assert.equal(matchesDay(record,120*240,'main'),false);
  f.game.user=f.game.users.get('alice');assert.equal(f.service.list().length,0);await assert.rejects(f.service.save(note({historicalKey:'fake'})),/Mestra/);
  assert.equal(matchesDay(note(),240,'past'),false);assert.equal(matchesDay(note(),240,'main'),true);
});
test('unsafe attachments, unknown users and unauthorized documents cannot be published',async()=>{
  const f=await setup();f.game.user=f.game.users.get('alice');
  for(const image of ['javascript:alert(1)','data:text/html,test','file:///private.png','https://x/" onerror="bad'])await assert.rejects(f.service.save(note({image})));
  await assert.rejects(f.service.save(note({sharedWith:['unknown']})));
  const hidden=await f.create({name:'Segredo',ownership:{default:0}});
  await assert.rejects(f.service.save(note({links:[{uuid:hidden.uuid,label:'Segredo'}]})),/acesso/);
  assert.ok(!recordHTML(normalizeRecord(note({description:'<img onerror=bad>',image:'images/map.png'}),f.game.users)).includes('<img onerror'));
});
test('newspaper references come only from the Jornal public API and are sanitized',async()=>{
  const f=await setup();
  assert.deepEqual(newspaperJournals(f.game),[]);
  const api={family:'quedaco',contractVersion:1,id:'quedaco-jornal-da-queda',capabilities:{newspaper:true},getAccessibleJournals:()=>[{uuid:'JournalEntry.a',label:'Edição comprada',secret:'x'},{uuid:7,label:'ruim'},null].filter(Boolean)};
  f.game.modules.set('quedaco-jornal-da-queda',{active:true,api});
  assert.deepEqual(newspaperJournals(f.game),[{uuid:'JournalEntry.a',label:'Edição comprada'}]);
  f.game.modules.set('quedaco-jornal-da-queda',{active:false,api});
  assert.deepEqual(newspaperJournals(f.game),[]);
});
test('0.1 records migrate once, preserving original Journals and private ownership',async()=>{
  const f=await setup();const legacy=await f.create({name:'Registro antigo',ownership:{default:0},flags:{'quedaco-calendario':{event:{absoluteDay:10,description:'Texto antigo preservado',private:true,repeat:'once'}}}});
  await f.service.provision();const target=legacy.flags['quedaco-calendario'].migratedTo;
  assert.ok(target);assert.ok((await fromUuid(target)).text.content.includes('Texto antigo preservado'));assert.ok(f.game.journal.get(legacy.id));
  const count=f.service.list().length;await f.service.provision();assert.equal(f.service.list().length,count);
  f.game.user=f.game.users.get('bob');assert.equal(f.service.list().length,0);
});
test('native Journal content includes the exact date, and history does not invent a day',()=>{
  const users=[{id:'gm',isGM:true}];
  assert.match(recordHTML(normalizeRecord(note(),users)),/Lunadi, 1 de Fogo.*Anel 1 D.F./);
  assert.match(recordHTML(normalizeRecord(note({historicalKey:'book',absoluteDay:-226*240}),users)),/Anel 226 A.F. — dia e Ciclo não informados/);
});
