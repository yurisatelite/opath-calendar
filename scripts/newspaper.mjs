export const NEWSPAPER_ID='quedaco-jornal-da-queda';
export function newspaperJournals(game) {
  if(!game.modules.get(NEWSPAPER_ID)?.active) return [];
  return Array.from(game.journal).filter(j=>j.flags[NEWSPAPER_ID]?.editionId && j.testUserPermission(game.user,'OBSERVER'))
    .map(j=>({uuid:j.uuid,label:j.name,editionId:j.flags[NEWSPAPER_ID].editionId}));
}
export function openNewspaper(game) {
  const api=game.modules.get(NEWSPAPER_ID)?.api;
  if(!api?.open) throw new Error('Ative QUEDAÇO - Jornal da Queda para consultar as edições.');
  return api.open();
}
