import {DAY, dateToWorldTime} from './calendar.mjs';
export const ID = 'opath-calendar';
export const activeBranch = (state, fallbackOffset = 0) => state?.branches?.find(b => b.id === state.activeId) ?? {id:'main', name:'Campanha principal', offsetDays:fallbackOffset};
export function planSwitch(state, worldTime, offsetDays, targetId) {
  const target = state.branches.find(b => b.id === targetId);
  if (!target) throw new Error('Linha do tempo não encontrada.');
  if (state.activeId === targetId) return {state, targetTime:worldTime};
  const branches = state.branches.map(b => b.id === state.activeId ? {...b, worldTime, offsetDays} : {...b});
  return {state:{...state, activeId:targetId, branches}, targetTime:target.worldTime};
}
export function createTimelines(game, getConfig) {
  let busy = false;
  const getState = () => game.settings.get(ID,'timelines');
  function requireGM() {if (!game.user.isGM) throw new Error('Somente a Mestra pode alterar linhas do tempo.');}
  async function exclusive(action) {requireGM(); if (busy) throw new Error('Aguarde a troca de linha do tempo.'); busy=true; try{return await action();}finally{busy=false;}}
  return {
    getState,
    isSwitching:() => busy,
    getActive:() => activeBranch(getState(), game.settings.get(ID,'offsetDays')),
    initialize:async () => {
      if (!getState()?.branches?.length) {
        requireGM();
        await game.settings.set(ID,'timelines',{activeId:'main',branches:[{id:'main',name:'Campanha principal',worldTime:Math.floor(game.time.worldTime),offsetDays:game.settings.get(ID,'offsetDays')}]});
      }
    },
    create:async (name,date) => exclusive(async () => {
      name=String(name).trim(); if (!name || name.length>100) throw new Error('Informe um nome de até 100 caracteres.');
      const state=getState(); if (!state?.branches) throw new Error('A Mestra deve inicializar o calendário.');
      const id=globalThis.crypto.randomUUID();
      const branch={id,name,offsetDays:getConfig().offsetDays,worldTime:dateToWorldTime(date,getConfig())};
      await game.settings.set(ID,'timelines',{...state,branches:[...state.branches,branch]});
      return id;
    }),
    switchTo:async targetId => exclusive(async () => {
      const before=getState(), originTime=Math.floor(game.time.worldTime);
      const plan=planSwitch(before,originTime,getConfig().offsetDays,targetId);
      if (targetId===before.activeId) return;
      await game.settings.set(ID,'timelines',plan.state);
      try {await game.time.advance(plan.targetTime-originTime);}
      catch (error) {
        await game.settings.set(ID,'timelines',before);
        if (Math.floor(game.time.worldTime)!==originTime) await game.time.advance(originTime-Math.floor(game.time.worldTime));
        throw error;
      }
    }),
    calibrateOffset:async offsetDays => exclusive(async () => {
      if (!Number.isSafeInteger(offsetDays)) throw new Error('Marco inválido.');
      const state=getState();
      await game.settings.set(ID,'timelines',{...state,branches:state.branches.map(b => b.id===state.activeId ? {...b,offsetDays} : b)});
    })
  };
}
