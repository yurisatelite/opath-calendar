import test from 'node:test';
import assert from 'node:assert/strict';
import {createDescriptor,findFamilyAPI} from '../scripts/family-api.mjs';
import {normalizeRecord} from '../scripts/record-model.mjs';
import {migrateLegacy} from '../scripts/migration.mjs';
import {readFile} from 'node:fs/promises';

test('descritor segue o protocolo v1 e é congelado',()=>{
  const d=createDescriptor({id:'quedaco-calendario',title:'QUEDAÇO - Calendário',version:'0.3.0'},{open(){},getCurrentDate(){}},()=>({ready:true}),true);
  assert.equal(d.family,'quedaco');assert.equal(d.contractVersion,1);assert.equal(d.id,'quedaco-calendario');
  assert.ok(Object.isFrozen(d));
  for(const [cap,on] of Object.entries(d.capabilities)){assert.equal(typeof on,'boolean');}
  assert.equal(d.capabilities.daylightControl,true);
  assert.equal(typeof d.open,'function');assert.equal(typeof d.getStatus,'function');
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
