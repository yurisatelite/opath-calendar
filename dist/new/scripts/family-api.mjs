export function findFamilyAPI(game,id,capability){
  const module=game.modules.get(id),api=module?.api;
  return module?.active&&api?.family==='quedaco'&&api.contractVersion===1&&api.id===id&&api.capabilities?.[capability]===true?api:null;
}
export function createDescriptor(module,methods,getStatus,smallTimeActive){
  return Object.freeze({family:'quedaco',contractVersion:1,id:module.id,title:module.title,version:module.version,
    capabilities:Object.freeze({calendar:true,currentDate:true,currentTime:true,advanceTime:true,daylightControl:smallTimeActive,campaignDiary:true,moonPhases:true,holidays:true,timelines:true}),
    ...methods,getStatus});
}
