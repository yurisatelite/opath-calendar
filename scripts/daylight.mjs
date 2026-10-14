import {MODULE_ID as ID} from './identity.mjs';
export const DEFAULT_DAYLIGHT=Object.freeze({sunriseStart:5,sunriseEnd:7,sunsetStart:17,sunsetEnd:19,minDarkness:0,maxDarkness:0.85});
export function validateDaylight(input={}) {
  const config={...DEFAULT_DAYLIGHT,...input};
  for(const key of Object.keys(DEFAULT_DAYLIGHT))if(typeof config[key]!=='number'||!Number.isFinite(config[key]))throw new Error('Configuração de iluminação inválida.');
  const {sunriseStart:a,sunriseEnd:b,sunsetStart:c,sunsetEnd:d,minDarkness:min,maxDarkness:max}=config;
  if(!(0<=a&&a<b&&b<=c&&c<d&&d<=24&&0<=min&&min<=max&&max<=1))throw new Error('Use horários crescentes entre 0 e 24 e escuridão entre 0 e 1.');
  return Object.fromEntries(Object.keys(DEFAULT_DAYLIGHT).map(key=>[key,config[key]]));
}
export function darknessAt(seconds,config=DEFAULT_DAYLIGHT) {
  const c=validateDaylight(config),h=((seconds%86400)+86400)%86400/3600;
  let night=1;
  if(h>=c.sunriseEnd&&h<=c.sunsetStart)night=0;
  else if(h>=c.sunriseStart&&h<c.sunriseEnd)night=1-(h-c.sunriseStart)/(c.sunriseEnd-c.sunriseStart);
  else if(h>c.sunsetStart&&h<c.sunsetEnd)night=(h-c.sunsetStart)/(c.sunsetEnd-c.sunsetStart);
  return Math.round((c.minDarkness+night*(c.maxDarkness-c.minDarkness))*1000)/1000;
}
export function createDaylight(game,clock,getScene) {
  const requireGM=()=>{if(!game.user.isGM)throw new Error('Somente a Mestra configura a iluminação.');};
  const engine=()=>{
    const requested=game.settings.get(ID,'clockMode')??'auto';
    if(requested==='off')return 'off';
    // The external module retains sole ownership while active. Never alter its flags.
    return game.modules.get('smalltime')?.active?'smalltime':'native';
  };
  const getConfig=()=>validateDaylight(game.settings.get(ID,'daylight')??{});
  function getStatus(scene=getScene()) {
    const mode=engine(),external=!!game.modules.get('smalltime')?.active;
    return {engine:mode,externalActive:external,linked:mode==='off'?false:mode==='smalltime'?!!scene?.getFlag('smalltime','darkness-link'):!!scene?.getFlag(ID,'daylight'),locked:!!scene?.environment?.darknessLock,sceneName:scene?.name??'Nenhuma cena',config:getConfig()};
  }
  let pending=false,running=false;
  async function sync() {
    pending=true;if(running)return;
    running=true;
    try {
      while(pending){
        pending=false;
        if(!game.user.isGM||(game.users.activeGM&&game.users.activeGM.id!==game.user.id)||engine()!=='native')continue;
        const scene=getScene();
        if(!scene||scene.documentName!=='Scene'||scene.inCompendium||!scene.getFlag(ID,'daylight')||scene.environment?.darknessLock)continue;
        const darkness=darknessAt(game.time.worldTime,getConfig());
        if(Math.abs((scene.environment?.darknessLevel??0)-darkness)<0.001)continue;
        await scene.update({'environment.darknessLevel':darkness});
      }
    }finally{running=false;}
  }
  return {
    getClockStatus:getStatus,
    setClockMode:async mode=>{requireGM();if(!['auto','native','off'].includes(mode))throw new Error('Modo de relógio inválido.');await game.settings.set(ID,'clockMode',mode);await sync();},
    setDaylightConfig:async input=>{requireGM();await game.settings.set(ID,'daylight',validateDaylight(input));await sync();},
    setSceneDaylight:async(scene,enabled)=>{
      requireGM();
      if(!scene||scene.documentName!=='Scene'||scene.inCompendium)throw new Error('Selecione uma cena do mundo.');
      if(engine()!=='native')throw new Error('Desative o SmallTime e ative o relógio nativo para controlar a iluminação pelo Calendário.');
      await scene.setFlag(ID,'daylight',enabled===true);await sync();
    },
    setTimeOfDay:async seconds=>{
      requireGM();if(!Number.isInteger(seconds)||seconds<0||seconds>=86400)throw new Error('Horário inválido.');
      const current=clock.getCurrentDate();
      return clock.setDate({...current,hour:Math.floor(seconds/3600),minute:Math.floor(seconds%3600/60),second:seconds%60});
    },
    sync
  };
}
