export const NEWSPAPER_ID='quedaco-jornal-da-queda';
import {findFamilyAPI} from './family-api.mjs';
export function newspaperJournals(game) {
  const api=findFamilyAPI(game,NEWSPAPER_ID,'newspaper');
  if(typeof api?.getAccessibleJournals!=='function')return [];
  const journals=api.getAccessibleJournals();
  if(!Array.isArray(journals))return [];
  return journals.filter(j=>typeof j?.uuid==='string'&&typeof j?.label==='string').map(j=>({uuid:j.uuid,label:j.label}));
}
export function openNewspaper(game) {
  const api=findFamilyAPI(game,NEWSPAPER_ID,'newspaper');
  if(typeof api?.open!=='function') throw new Error('A API integrada do Jornal da Queda não está disponível.');
  return api.open();
}
