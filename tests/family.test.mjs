import test from 'node:test';
import assert from 'node:assert/strict';
import {createDescriptor,findFamilyAPI,CAPABILITY_METHODS} from '../scripts/family-api.mjs';
import {normalizeRecord} from '../scripts/record-model.mjs';
import {migrateLegacy} from '../scripts/migration.mjs';
import {readFile} from 'node:fs/promises';

test('descritor segue o protocolo v1 e é congelado',()=>{
  const methods=Object.fromEntries(Object.values(CAPABILITY_METHODS).map(method=>[method,()=>{}]));
  const d=createDescriptor({id:'quedaco-calendario',title:'QUEDAÇO - Calendário',version:'0.3.2'},methods,()=>({ready:true}),true);
  assert.equal(d.family,'quedaco');assert.equal(d.contractVersion,1);assert.equal(d.id,'quedaco-calendario');
  assert.ok(Object.isFrozen(d));
  for(const [cap,on] of Object.entries(d.capabilities)){assert.equal(typeof on,'boolean');if(on)assert.equal(typeof d[CAPABILITY_METHODS[cap]],'function');}
  assert.equal(d.capabilities.daylightControl,true);
  assert.equal(typeof d.open,'function');assert.equal(typeof d.getStatus,'function');
});

test('capabilities ausentes não são anunciadas e SmallTime ausente desativa daylightControl',()=>{
  const d=createDescriptor({id:'quedaco-calendario'},{open(){},setSmallTimeSceneLink(){}},()=>({ready:true}),false);
  assert.equal(d.capabilities.calendar,true);assert.equal(d.capabilities.currentTime,false);assert.equal(d.capabilities.daylightControl,false);
});

test('migração mantém diário, páginas, datas e permissões, sem alterar documentos do Jornal',async()=>{
  const {mockWorld}=await import('../tools/mock-world.mjs');const f=mockWorld();
  const stored=new Map();
  f.game.settings.storage=new Map([['world',{getSetting:key=>stored.get(key)}]]);
  const timelines={activeId:'past',branches:[{id:'main',name:'Principal',worldTime:83192000,offsetDays:20},{id:'past',name:'Passado',worldTime:-9000000,offsetDays:20}]};
  stored.set('opath-calendar.timelines',{value:JSON.stringify(timelines)});
  const book=await f.create({name:'Diário antigo',ownership:{default:0,alice:3},flags:{'opath-calendar':{diaryBook:true}},pages:[{name:'Nota antiga',type:'text',text:{content:'Conteúdo privado'},flags:{'opath-calendar':{record:{absoluteDay:-100,timelineId:'past',visibility:'private'}}}}]});
  stored.set('opath-calendar.diaryBooks',{value:{alice:book.id}});
  const newspaper=await f.create({name:'Jornal de outro módulo',flags:{'quedaco-jornal-da-queda':{editionId:'edition'}},pages:[{name:'Página',text:{content:'Texto original'}}]});
  const snapshot=JSON.stringify({flags:newspaper.flags,text:newspaper.pages[0].text,ownership:book.ownership,time:f.game.time.worldTime});
  await migrateLegacy(f.game);
  assert.deepEqual(f.values.get('timelines'),timelines);assert.equal(f.values.get('diaryBooks').alice,book.id);
  assert.equal(book.pages[0].flags['quedaco-calendario'].record.absoluteDay,-100);
  assert.equal(book.pages[0].flags['opath-calendar'].record.visibility,'private');
  assert.equal(JSON.stringify({flags:newspaper.flags,text:newspaper.pages[0].text,ownership:book.ownership,time:f.game.time.worldTime}),snapshot);
  await book.pages[0].update({'flags.quedaco-calendario.record.absoluteDay':10});
  await migrateLegacy(f.game);assert.equal(book.pages[0].flags['quedaco-calendario'].record.absoluteDay,10);
  f.game.user=f.game.users.get('alice');await assert.rejects(migrateLegacy(f.game),/Mestra/);
});
test('findFamilyAPI exige módulo ativo, contrato e capability',()=>{
  const api={family:'quedaco',contractVersion:1,id:'quedaco-x',capabilities:{newspaper:true}};
  const game=a=>({modules:{get:()=>a}});
  assert.equal(findFamilyAPI(game({active:true,api}),'quedaco-x','newspaper'),api);
  assert.equal(findFamilyAPI(game({active:false,api}),'quedaco-x','newspaper'),null);
  assert.equal(findFamilyAPI(game({active:true,api}),'quedaco-x','outra'),null);
  assert.equal(findFamilyAPI(game(undefined),'quedaco-x','newspaper'),null);
});
test('registro aceita local de outro módulo (place) com limites',()=>{
  const base={title:'t',description:'',absoluteDay:1,timelineId:'main',visibility:'public',sharedWith:[],links:[]};
  const rec=normalizeRecord({...base,place:{ref:'cena:2:3',name:'Ponte',regionId:'mirmir',source:'quedaco-explorador'}},[]);
  assert.equal(rec.place.ref,'cena:2:3');
  assert.equal(normalizeRecord(base,[]).place,null);
  assert.throws(()=>normalizeRecord({...base,place:{ref:'x'.repeat(101)}},[]));
});
test('migração só copia o namespace antigo e não sobrescreve dados novos',async()=>{
  const written={};
  const stored=new Map([['opath-calendar.mode',{key:'opath-calendar.mode',value:'"solar"'}],['opath-calendar.offsetDays',{key:'opath-calendar.offsetDays',value:5}],['quedaco-calendario.offsetDays',{key:'quedaco-calendario.offsetDays',value:9}]]);
  const game={user:{isGM:true},journal:[],settings:{storage:new Map([['world',{getSetting:k=>stored.get(k)}]]),get:()=>false,set:async(ns,k,v)=>{written[k]=v;}}};
  await migrateLegacy(game);
  assert.equal(written.mode,'solar');assert.equal(written.offsetDays,undefined);assert.equal(written.legacyMigrated,true);
});
test('publica quedaco:register e usa o id novo',async()=>{
  const main=await readFile(new URL('../scripts/main.mjs',import.meta.url),'utf8');
  assert.match(main,/Hooks\.callAll\('quedaco:register',descriptor\)/);
  assert.match(main,/modules\/quedaco-calendario\/templates/);
  assert.doesNotMatch(main,/modules\/opath-calendar\//);
});
