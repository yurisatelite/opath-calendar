import {DAY,worldTimeToDate,formatDate} from './calendar.mjs';
export const VISIBILITIES = ['private','shared','public'];
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeImage(path) {
  path=String(path ?? '').trim();
  if (!path) return '';
  if (path.length>2048 || /[<>"'\x00-\x1f]/.test(path) || /^(?:javascript|data|file|vbscript):/i.test(path) || /^\/\//.test(path)) throw new Error('Imagem inválida. Use uma imagem do Foundry ou URL https.');
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) && !/^https:\/\//i.test(path)) throw new Error('Use uma URL https para imagens externas.');
  return path;
}
export function normalizeRecord(input, users) {
  const text=(value,limit,label) => {if(typeof value!=='string'||value.length>limit) throw new Error(`${label} inválido.`); return value.trim();};
  const title=text(input.title,160,'Título'); if (!title) throw new Error('Informe um título.');
  if (!Number.isSafeInteger(input.absoluteDay)) throw new Error('Dia inválido.');
  if (typeof input.timelineId!=='string'||!input.timelineId||input.timelineId.length>100) throw new Error('Linha do tempo inválida.');
  const visibility=input.historicalKey ? 'private' : input.visibility;
  if(input.historicalKey && (typeof input.historicalKey!=='string'||input.historicalKey.length>100))throw new Error('Referência histórica inválida.');
  if (!VISIBILITIES.includes(visibility)) throw new Error('Visibilidade inválida.');
  if (!['once','lunar','solar'].includes(input.repeat ?? 'once')) throw new Error('Recorrência inválida.');
  const sharedWith=[...new Set(Array.isArray(input.sharedWith)?input.sharedWith:[])];
  if (sharedWith.some(id => !users.some(u => u.id===id && !u.isGM))) throw new Error('Jogador selecionado não existe.');
  const links=Array.isArray(input.links)?input.links:[];
  if (links.length>20 || links.some(l => typeof l.uuid!=='string'|| !/^(JournalEntry|Actor|Item|Compendium)\.[\w.-]+$/.test(l.uuid))) throw new Error('Referência inválida.');
  return {title,description:text(input.description,20000,'Texto'),location:text(input.location ?? '',200,'Localidade'),weather:text(input.weather ?? '',200,'Clima'),
    absoluteDay:input.absoluteDay,timelineId:input.timelineId,repeat:input.repeat??'once',visibility,sharedWith,
    image:safeImage(input.image),links:links.map(l => ({uuid:l.uuid,label:text(l.label??l.uuid,200,'Título da referência')})),
    calendarMode:input.calendarMode==='solar'?'solar':'lunar',precision:input.historicalKey?'year':'day',historicalKey:input.historicalKey??null,archived:input.archived===true,revision:input.revision??null};
}
export function recordOwnership(record, users) {
  return Object.fromEntries([['default',record.visibility==='public'&&!record.archived?2:0],...users.map(u => [u.id,u.isGM?3:(!record.archived&&(record.visibility==='public'||record.visibility==='shared'&&record.sharedWith.includes(u.id))?2:0)])]);
}
export function recordHTML(record) {
  const e=escapeHTML;
  const year=Math.floor(record.absoluteDay/240);
  const date=record.precision==='year'?`Anel ${Math.abs(year)} ${year<0?'A.F.':'D.F.'} — dia e Ciclo não informados`:formatDate(worldTimeToDate(record.absoluteDay*DAY,{mode:record.calendarMode}));
  return `<article><h1>${e(record.title)}</h1><p><strong>Data:</strong> ${e(date)}</p><p><strong>Localidade:</strong> ${e(record.location)} · <strong>Clima:</strong> ${e(record.weather)}</p><p>${e(record.description).replace(/\n/g,'<br>')}</p>${record.image?`<p><img src="${e(record.image)}" alt="Imagem do registro" style="max-width:100%"></p>`:''}${record.links.map(l=>`<p>@UUID[${e(l.uuid)}]{${e(l.label)}}</p>`).join('')}</article>`;
}
export function matchesDay(record, day, timelineId, includeArchived=false) {
  if ((record.timelineId??'main')!==timelineId || record.archived&&!includeArchived || record.precision==='year') return false;
  const period=record.repeat==='lunar'?240:record.repeat==='solar'?480:0;
  return period ? day>=record.absoluteDay && (day-record.absoluteDay)%period===0 : day===record.absoluteDay;
}
