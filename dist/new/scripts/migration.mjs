import {MODULE_ID,LEGACY_ID,SETTINGS} from './identity.mjs';
function storedSetting(game,namespace,key){
  const storage=game.settings.storage?.get('world');
  const setting=storage?.getSetting?.(namespace+'.'+key)??Array.from(storage??[]).find(s=>s.key===namespace+'.'+key);
  if(!setting)return {exists:false};
  let value=setting.value;
  if(typeof value==='string'){try{value=JSON.parse(value);}catch{/* The value may already be a plain String setting. */}}
  return {exists:true,value};
}
/** Copies only our former namespace. Existing new data and legacy originals are retained. */
export async function migrateLegacy(game){
  if(!game.user.isGM)throw new Error('Somente a Mestra pode migrar o calendário.');
  if(game.settings.get(MODULE_ID,'legacyMigrated'))return {complete:true};
  for(const key of Object.keys(SETTINGS)){
    const legacy=storedSetting(game,LEGACY_ID,key),current=storedSetting(game,MODULE_ID,key);
    if(legacy.exists&&!current.exists)await game.settings.set(MODULE_ID,key,structuredClone(legacy.value));
  }
  for(const journal of game.journal){
    const flags=journal.flags?.[LEGACY_ID];
    // Ignore all other modules' documents, even when they are referenced by our records.
    if(!flags||!['diaryBook','event','record','sourceUuid','migratedTo'].some(key=>Object.hasOwn(flags,key)))continue;
    if(!journal.flags[MODULE_ID])await journal.update({['flags.'+MODULE_ID]:structuredClone(flags)});
    for(const page of journal.pages??[]){
      const record=page.flags?.[LEGACY_ID];
      if(record&&!page.flags[MODULE_ID])await page.update({['flags.'+MODULE_ID]:structuredClone(record)});
    }
  }
  await game.settings.set(MODULE_ID,'legacyMigrated',true);
  return {complete:true};
}
