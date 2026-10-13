import {ID} from './timelines.mjs';
import {normalizeRecord, recordOwnership, recordHTML} from './record-model.mjs';
const QUERY=`${ID}.syncRecord`;
export function createRecords(game) {
  let queue=Promise.resolve();
  const users=() => Array.from(game.users);
  const books=() => game.settings.get(ID,'diaryBooks')??{};
  const bookOwner=journalId => Object.entries(books()).find(([,id])=>id===journalId)?.[0];
  const isSource=page => !!bookOwner(page?.parent?.id) && !!page?.flags?.[ID]?.record;
  const isReadable=doc => doc?.testUserPermission?.(game.user,'OBSERVER');
  function canEdit(page,user=game.user) {return isSource(page)&&(user.isGM||bookOwner(page.parent.id)===user.id);}
  function gmOnline() {return game.user.isGM || !!game.users.activeGM?.active;}
  async function sync(pageUuid) {
    if (!game.user.isGM) throw new Error('A sincronização é executada pela Mestra.');
    const page=await fromUuid(pageUuid);
    if (!isSource(page)) throw new Error('Registro de origem inválido.');
    const author=game.users.get(bookOwner(page.parent.id));
    const input=page.flags[ID].record;
    const record=normalizeRecord({...input,title:page.name},users());
    if (record.historicalKey&&!author.isGM) throw new Error('Somente a Mestra cadastra históricos.');
    if (!game.settings.get(ID,'timelines')?.branches.some(b=>b.id===record.timelineId)) throw new Error('Linha do tempo não encontrada.');
    for (const link of record.links) {
      const doc=await fromUuid(link.uuid);
      if (!doc?.testUserPermission?.(author,'OBSERVER')) throw new Error('Referência sem permissão para o autor.');
    }
    let mirror=Array.from(game.journal).find(j=>j.flags[ID]?.sourceUuid===pageUuid);
    const visible=record.visibility!=='private'&&!record.archived;
    if (!mirror&&!visible) return {ok:true,revision:record.revision};
    if (!mirror) mirror=await JournalEntry.create({name:record.title,ownership:recordOwnership(record,users()),flags:{[ID]:{sourceUuid:pageUuid,record:{...record,authorId:author.id}}},pages:[{name:record.title,type:'text',text:{content:page.text.content,format:1}}]});
    else {
      // Explicit per-user values revoke earlier sharing as well as the default access.
      await mirror.update({name:record.title,ownership:recordOwnership(record,users()),[`flags.${ID}.record`]:{...record,authorId:author.id}});
      const first=mirror.pages.contents[0];
      if (first) await first.update({name:record.title,'text.content':page.text.content});
    }
    return {ok:true,revision:record.revision};
  }
  function schedule(pageUuid) {
    const action=queue.then(()=>sync(pageUuid)); queue=action.catch(()=>{}); return action;
  }
  async function synchronize(page) {
    const gm=game.users.activeGM;
    if(game.user.isGM&&(!gm||gm.id===game.user.id)) return schedule(page.uuid);
    if(!gm?.active && page.flags[ID].record.visibility==='private') return {ok:true};
    if(!gm?.active) throw new Error('Registro salvo. Conecte a Mestra para atualizar o compartilhamento.');
    return gm.query(QUERY,{pageUuid:page.uuid},{timeout:20000});
  }
  return {
    canEdit,isSource,bookOwner,
    registerQuery:() => {CONFIG.queries[QUERY]=({pageUuid}) => schedule(pageUuid);},
    provision:async () => {
      if(!game.user.isGM) return;
      const mapping={...books()};
      for(const user of users().filter(u=>u.role>0)) {
        if(game.journal.get(mapping[user.id])) continue;
        const book=await JournalEntry.create({name:`QUEDAÇO — Diário de ${user.name}`,ownership:{default:0,[user.id]:3},flags:{[ID]:{diaryBook:true}}});
        mapping[user.id]=book.id;
      }
      await game.settings.set(ID,'diaryBooks',mapping);
      const gmBook=game.journal.get(mapping[game.user.id]);
      for(const journal of Array.from(game.journal)) {
        const old=journal.flags[ID]?.event;
        if(!old||journal.flags[ID]?.migratedTo) continue;
        const record=normalizeRecord({...old,title:journal.name,location:'',weather:'',image:'',links:[],sharedWith:[],timelineId:'main',visibility:old.private?'private':'public',revision:globalThis.crypto.randomUUID()},users());
        let page=gmBook.pages.find(p=>p.flags[ID]?.legacyUuid===journal.uuid);
        if(!page)[page]=await gmBook.createEmbeddedDocuments('JournalEntryPage',[{name:record.title,type:'text',text:{content:recordHTML(record),format:1},flags:{[ID]:{record,legacyUuid:journal.uuid}}}]);
        await schedule(page.uuid);
        await journal.update({[`flags.${ID}.migratedTo`]:page.uuid,ownership:Object.fromEntries([['default',0],...users().map(u=>[u.id,u.isGM?3:0])])});
      }
      for(const id of Object.values(mapping)) for(const page of game.journal.get(id)?.pages??[]) if(isSource(page)) await schedule(page.uuid);
    },
    list:() => {
      const result=[], sourceSeen=new Set();
      for(const journal of game.journal) {
        if(!isReadable(journal)) continue;
        if(bookOwner(journal.id)) for(const page of journal.pages) {
          const record=page.flags[ID]?.record;
          if(record&&isReadable(page)) {sourceSeen.add(page.uuid);result.push({...record,title:page.name,uuid:page.uuid,authorId:bookOwner(journal.id),source:true,canEdit:canEdit(page)});}
        }
      }
      for(const journal of game.journal) {
        if(!isReadable(journal)) continue;
        const sourceUuid=journal.flags[ID]?.sourceUuid;
        if(sourceUuid) {if(!sourceSeen.has(sourceUuid)&&journal.flags[ID].record) result.push({...journal.flags[ID].record,title:journal.name,uuid:journal.uuid,source:false,canEdit:false});}
        else if(journal.flags[ID]?.event&&!journal.flags[ID]?.migratedTo) {
          const legacy=journal.flags[ID].event;
          result.push({...legacy,title:journal.name,uuid:journal.uuid,timelineId:'main',visibility:legacy.private?'private':'public',source:false,canEdit:game.user.isGM,legacy:true});
        }
      }
      return result;
    },
    save:async (input, uuid=null) => {
      let existing=uuid?await fromUuid(uuid):null;
      if(existing&&!canEdit(existing)) throw new Error('Você só pode editar seus próprios registros.');
      const old=existing?.flags[ID]?.record;
      if(old?.historicalKey) input={...input,historicalKey:old.historicalKey,absoluteDay:old.absoluteDay};
      const record=normalizeRecord({...input,revision:globalThis.crypto.randomUUID()},users());
      if(record.historicalKey&&!game.user.isGM) throw new Error('Históricos são exclusivos da Mestra.');
      if((record.visibility!=='private'||old&&old.visibility!=='private')&&!gmOnline()) throw new Error('Conecte a Mestra para publicar, despublicar ou editar um registro compartilhado.');
      for(const link of record.links) {const doc=await fromUuid(link.uuid);if(!isReadable(doc)) throw new Error('Você não tem acesso a uma referência anexada.');}
      const book=game.journal.get(books()[game.user.id]);
      if(!book) throw new Error('A Mestra precisa entrar no mundo para preparar seu diário.');
      const source={name:record.title,type:'text',text:{content:recordHTML(record),format:1},flags:{[ID]:{record}}};
      if(existing) await existing.update({name:source.name,'text.content':source.text.content,[`flags.${ID}.record`]:record});
      else [existing]=await book.createEmbeddedDocuments('JournalEntryPage',[source]);
      try {await synchronize(existing);}catch(error){throw new Error(`Texto salvo no diário; publicação pendente: ${error.message}`);}
      return existing.uuid;
    },
    archive:async (uuid, archived) => {
      const page=await fromUuid(uuid);
      if(!canEdit(page)) throw new Error('Você só pode arquivar seus próprios registros.');
      const old=page.flags[ID].record;
      if(old.visibility!=='private'&&!gmOnline()) throw new Error('Conecte a Mestra para retirar o registro compartilhado.');
      await page.update({[`flags.${ID}.record`]:{...old,archived,revision:globalThis.crypto.randomUUID()}});
      await synchronize(page);
    },
    sync:schedule,
    open:async uuid => {
      const doc=await fromUuid(uuid); if(!isReadable(doc)) throw new Error('Anotação indisponível para você.');
      if(doc.documentName==='JournalEntryPage') return doc.parent.sheet.render(true,{pageId:doc.id});
      return doc.sheet.render(true);
    }
  };
}
