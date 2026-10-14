export function findFamilyAPI(game,id,capability){
  const module=game.modules.get(id),api=module?.api;
  return module?.active&&api?.family==='quedaco'&&api.contractVersion===1&&api.id===id&&(!capability||api.capabilities?.[capability]===true)?api:null;
}
export const CAPABILITY_METHODS=Object.freeze({calendar:'open',currentDate:'getCurrentDate',currentTime:'getCurrentTime',advanceTime:'advanceTime',daylightControl:'setSceneDaylight',campaignDiary:'getDayRecords',moonPhases:'getMoonPhases',holidays:'getHolidays',timelines:'getTimelines',placeNotes:'listPlaceNotes'});
export function createDescriptor(module,methods,getStatus){
  const capabilities=Object.freeze(Object.fromEntries(Object.entries(CAPABILITY_METHODS).map(([cap,method])=>[cap,typeof methods[method]==='function'])));
  return Object.freeze({...methods,family:'quedaco',contractVersion:1,id:module.id,title:module.title,version:module.version,capabilities,getStatus});
}
