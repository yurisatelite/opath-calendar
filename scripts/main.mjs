import {DAY,CYCLES,WEEKDAYS,ABBREVIATIONS,SEASONS,moons,holidaysFor,formatDate,lunarAge} from './calendar.mjs';
import {createClock} from './integration.mjs';
import {ID,activeBranch,createTimelines} from './timelines.mjs';
import {createRecords} from './records.mjs';
import {matchesDay,escapeHTML,safeImage} from './record-model.mjs';
import {HISTORY} from './history.mjs';
import {newspaperJournals,openNewspaper,NEWSPAPER_ID} from './newspaper.mjs';
import {createDescriptor,findFamilyAPI} from './family-api.mjs';
import {migrateLegacy} from './migration.mjs';
import {createDaylight,DEFAULT_DAYLIGHT} from './daylight.mjs';
import {createClockPanel} from './clock-panel.mjs';

let clock,app,timelines,records,lastNotice,daylight,clockPanel;
const getConfig=()=>({mode:game.settings.get(ID,'mode'),offsetDays:activeBranch(game.settings.get(ID,'timelines'),game.settings.get(ID,'offsetDays')).offsetDays,seasonOffset:game.settings.get(ID,'seasonOffset')});
const activeId=()=>timelines?.getActive().id??'main';
function guard(action){return Promise.resolve().then(action).catch(error=>ui.notifications.error(error.message));}
function refresh(){if(app?.rendered) app.render({force:true});updateCompanion();}
function notifyHoliday(){
  if(!clock||!game.user.isGM||timelines.isSwitching())return;
  const date=clock.getCurrentDate(),key=activeId()+':'+date.absoluteDay;
  if(key===lastNotice)return;lastNotice=key;
  const days=holidaysFor(date);if(days.length)ui.notifications.info('Feriado hoje: '+days.map(d=>d.name).join(' · '),{permanent:true});
}
function updateCompanion(){clockPanel?.update();}
Hooks.once('init',()=>{
  const register=(key,data)=>game.settings.register(ID,key,{scope:'world',config:false,...data,onChange:()=>{
    if(app&&['mode','timelines'].includes(key)){app.viewYear=null;app.selectedDay=null;}
    refresh();
    if(['clockMode','daylight'].includes(key)&&daylight)guard(()=>daylight.sync());
  }});
  register('mode',{name:'Contagem exibida',hint:'Trocar lunar/solar preserva o instante.',type:String,config:true,choices:{lunar:'Lunar — 240 dias',solar:'Solar — 480 dias'},default:'lunar'});
  register('offsetDays',{name:'Marco legado',type:Number,default:0});
  register('seasonOffset',{name:'Primeira estação do período solar',hint:'As estações duram 120 dias e continuam entre Anéis lunares.',type:Number,config:true,choices:Object.fromEntries(SEASONS.map((s,i)=>[i,s])),default:0});
  register('timelines',{type:Object,default:{activeId:'main',branches:[]}});
  register('diaryBooks',{type:Object,default:{}});
  register('legacyMigrated',{type:Boolean,default:false});
  register('clockMode',{type:String,choices:{auto:'Automático',native:'Nativo',off:'Desativado'},default:'auto'});
  register('daylight',{type:Object,default:DEFAULT_DAYLIGHT});
  register('showClockPanel',{name:'Mostrar painel compacto',type:Boolean,scope:'client',config:true,default:true});
  register('panelPosition',{type:Object,scope:'client',default:{}});
});
Hooks.once('ready',async()=>{
  timelines=createTimelines(game,getConfig);
  clock=createClock(game,getConfig,timelines.calibrateOffset);
  daylight=createDaylight(game,clock,()=>game.scenes?.active??globalThis.canvas?.scene);
  records=createRecords(game);records.registerQuery();
  const {ApplicationV2,HandlebarsApplicationMixin,DialogV2}=foundry.applications.api;
  class Calendar extends HandlebarsApplicationMixin(ApplicationV2){
    static DEFAULT_OPTIONS={id:'opath-calendar-window',classes:['opath-calendar'],window:{title:'QUEDAÇO - Calendário',resizable:true},position:{width:Math.min(1100,(globalThis.innerWidth??1160)-32),height:Math.min(820,(globalThis.innerHeight??850)-40)}};
    static PARTS={body:{template:'modules/quedaco-calendario/templates/calendar.hbs'}};
    viewYear=null;selectedDay=null;tab='calendar';draft=null;reader=[];trash=false;filtersOpen=false;
    filters={location:'',weather:'',author:''};
    captureDraft(){
      const form=this.element?.querySelector?.('[data-record-form]');
      if(!form||!this.draft)return;
      const data=new FormData(form);
      Object.assign(this.draft,{title:String(data.get('title')??''),description:String(data.get('description')??''),location:String(data.get('location')??''),weather:String(data.get('weather')??''),image:String(data.get('image')??''),visibility:String(data.get('visibility')??'private'),repeat:String(data.get('repeat')??'once'),sharedWith:data.getAll('sharedWith')});
    }
    async _prepareContext(){
      if(this.skipCapture)this.skipCapture=false;else this.captureDraft();
      const current=clock.getCurrentDate(),viewYear=this.viewYear??current.year,selectedDay=this.selectedDay??current.absoluteDay;
      const selected=clock.worldTimeToDate((selectedDay-getConfig().offsetDays)*DAY);
      const entries=records.list();
      const filtered=entries.filter(e=>(!this.filters.location||(e.location??'').toLowerCase().includes(this.filters.location.toLowerCase()))&&(!this.filters.weather||(e.weather??'').toLowerCase().includes(this.filters.weather.toLowerCase()))&&(!this.filters.author||e.authorId===this.filters.author));
      const atDay=filtered.filter(e=>matchesDay(e,selectedDay,activeId()));
      const cycles=Array.from({length:current.yearDays/15},(_,index)=>({
        name:'Ciclo '+(index+1)+' · '+CYCLES[index%16]+(index>=16?' · II':''),
        days:Array.from({length:15},(_,d)=>{
          const absoluteDay=viewYear*current.yearDays+index*15+d;
          const date=clock.worldTimeToDate((absoluteDay-getConfig().offsetDays)*DAY),holidays=holidaysFor(date);
          const notes=filtered.filter(e=>matchesDay(e,absoluteDay,activeId()));
          return {day:d+1,absoluteDay,current:absoluteDay===current.absoluteDay,selected:absoluteDay===selectedDay,festival:holidays.length>0,notes:notes.length,publicNotes:notes.some(e=>e.visibility==='public'),title:[...holidays.map(h=>h.name),...notes.map(n=>n.title)].join(' · '),moons:moons(absoluteDay)};
        })
      }));
      const draft=this.draft;
      const players=Array.from(game.users).filter(u=>!u.isGM&&u.role>0);
      return {
        isGM:game.user.isGM,current,currentLabel:formatDate(current),currentTime:[current.hour,current.minute,current.second].map(n=>String(n).padStart(2,'0')).join(':'),
        viewYear,modeLabel:current.mode==='lunar'?'Lunar · 240 dias':'Solar · 480 dias',lunarSelected:current.mode==='lunar'?'selected':'',solarSelected:current.mode==='solar'?'selected':'',
        cycles,weekdays:WEEKDAYS.map((name,i)=>({name,abbreviation:ABBREVIATIONS[i]})),selected,selectedLabel:formatDate(selected),moons:moons(selectedDay),holidays:holidaysFor(selected),
        events:atDay.map(e=>({...e,authorName:game.users.get(e.authorId)?.name??'Mestra',visibilityLabel:e.visibility==='public'?'Público':e.visibility==='shared'?'Compartilhado':'Privado'})),
        history:game.user.isGM?entries.filter(e=>e.historicalKey&&!e.archived&&e.timelineId===activeId()&&Math.floor(e.absoluteDay/240)===selected.lunarYear):[],
        smalltime:clock.getSmallTimeStatus(),lighting:daylight.getClockStatus(),nativeClock:daylight.getClockStatus().engine==='native',clockOff:daylight.getClockStatus().engine==='off',darkLinked:daylight.getClockStatus().linked,branchName:timelines.getActive().name,
        branches:(timelines.getState()?.branches??[]).map(b=>({...b,selected:b.id===activeId()?'selected':''})),
        cycleOptions:Array.from({length:current.yearDays/15},(_,i)=>({value:i+1,label:(i+1)+' · '+CYCLES[i%16]+(i>=16?' · II':''),selected:selected.cycle===i+1?'selected':''})),
        calendarTab:this.tab==='calendar',journalTab:this.tab==='journal',readerTab:this.tab==='reader',clockTab:this.tab==='clock',filtersOpen:this.filtersOpen,hasFilters:Object.values(this.filters).some(Boolean),trash:this.trash,reader:this.reader,
        draft,canEditDraft:!!draft,ownRecords:entries.filter(e=>e.canEdit&&!!e.archived===this.trash&&e.timelineId===activeId()).map(e=>({...e,dateLabel:formatDate(clock.worldTimeToDate((e.absoluteDay-getConfig().offsetDays)*DAY))})),
        draftDate:draft?formatDate(clock.worldTimeToDate((draft.absoluteDay-getConfig().offsetDays)*DAY)):'',
        privateSelected:draft?.visibility==='private'?'selected':'',sharedSelected:draft?.visibility==='shared'?'selected':'',publicSelected:draft?.visibility==='public'?'selected':'',
        repeatOnce:draft?.repeat==='once'?'selected':'',repeatLunar:draft?.repeat==='lunar'?'selected':'',repeatSolar:draft?.repeat==='solar'?'selected':'',
        players:players.map(u=>({id:u.id,name:u.name,checked:draft?.sharedWith?.includes(u.id)})),
        authors:Array.from(game.users).map(u=>({id:u.id,name:u.name,selected:this.filters.author===u.id?'selected':''})),filters:this.filters,
        locations:[...new Set(entries.map(e=>e.location).filter(Boolean))].sort(),weathers:['Ensolarado','Nublado','Chuva','Tempestade','Neve','Neblina',...new Set(entries.map(e=>e.weather).filter(Boolean))],
        newspapers:newspaperJournals(game),newspaperActive:typeof findFamilyAPI(game,NEWSPAPER_ID,'newspaper')?.open==='function'
      };
    }
    newDraft(){
      this.captureDraft();
      this.draft={uuid:null,title:'',description:'',location:'',weather:'',image:'',links:[],visibility:'private',sharedWith:[],repeat:'once',absoluteDay:this.selectedDay??clock.getCurrentDate().absoluteDay,timelineId:activeId(),calendarMode:getConfig().mode};
      this.skipCapture=true;this.tab='journal';this.render({force:true});
    }
    async edit(uuid){
      const record=records.list().find(r=>r.uuid===uuid&&r.canEdit&&!r.legacy);
      if(!record)throw new Error('Você só pode editar seus próprios registros.');
      this.draft=structuredClone(record);this.skipCapture=true;this.tab='journal';this.render({force:true});
    }
    async openAll(context){
      this.captureDraft();this.reader=[];
      for(const record of [...context.events,...context.history]){
        const doc=await fromUuid(record.uuid);
        if(!doc?.testUserPermission(game.user,'OBSERVER'))continue;
        const content=doc.documentName==='JournalEntryPage'?doc.text.content:doc.pages?.contents?.[0]?.text?.content;
        const parser=new DOMParser().parseFromString(content??'','text/html');
        for(const br of parser.querySelectorAll('br'))br.replaceWith('\n');
        this.reader.push({...record,description:parser.body.textContent||record.description});
      }
      for(const holiday of context.holidays)this.reader.push({title:holiday.name,description:holiday.description});
      this.tab='reader';this.render({force:true});
    }
    async addLink(uuid){
      this.captureDraft();
      if(!this.draft)return;
      const doc=await fromUuid(uuid);
      if(!doc?.testUserPermission(game.user,'OBSERVER'))throw new Error('Referência sem acesso.');
      if(!['JournalEntry','JournalEntryPage','Item'].includes(doc.documentName))throw new Error('Anexe um Journal, página ou Item.');
      if(!this.draft.links.some(l=>l.uuid===uuid))this.draft.links.push({uuid,label:doc.name});
      this.render({force:true});
    }
    _onRender(context,options){
      super._onRender(context,options);const root=this.element;
      const bind=(selector,fn)=>root.querySelectorAll(selector).forEach(el=>el.addEventListener('click',()=>guard(()=>fn(el))));
      root.querySelector('[data-filter-details]')?.addEventListener('toggle',e=>{this.filtersOpen=e.target.open;});
      bind('[data-day]',el=>{this.captureDraft();this.selectedDay=Number(el.dataset.day);this.render({force:true});});
      bind('[data-advance]',el=>clock.advanceTime(Number(el.dataset.advance)));
      bind('[data-open]',el=>records.open(el.dataset.open));
      bind('[data-edit]',el=>this.edit(el.dataset.edit));
      bind('[data-holiday]',async el=>{
        const holiday=context.holidays[Number(el.dataset.holiday)];
        if(holiday)await DialogV2.wait({window:{title:holiday.name},content:'<p>'+escapeHTML(holiday.description)+'</p>',buttons:[{action:'close',label:'Voltar',default:true}]});
      });
      bind('[data-remove-link]',el=>{this.captureDraft();this.draft.links=this.draft.links.filter(l=>l.uuid!==el.dataset.removeLink);this.render({force:true});});
      bind('[data-archive]',async el=>{
        const uuid=el.dataset.archive;
        if(!await DialogV2.confirm({window:{title:'1 de 2 — Retirar anotação'},content:'<p>Retirar esta anotação do calendário e do compartilhamento?</p>'}))return;
        if(!await DialogV2.confirm({window:{title:'2 de 2 — Confirmar lixeira'},content:'<p>Enviar para a lixeira? O texto será preservado e poderá ser restaurado pelo autor ou pela Mestra.</p>'}))return;
        await records.archive(uuid,true);if(this.draft?.uuid===uuid)this.draft=null;refresh();
      });
      bind('[data-restore]',async el=>{await records.archive(el.dataset.restore,false);refresh();});
      bind('[data-action-local]',async el=>{
        const action=el.dataset.actionLocal,current=clock.getCurrentDate();this.captureDraft();
        if(action==='previous')this.viewYear=(this.viewYear??current.year)-1;
        if(action==='next')this.viewYear=(this.viewYear??current.year)+1;
        if(action==='today'){this.viewYear=null;this.selectedDay=null;}
        if(action==='calendar')this.tab='calendar';
        if(action==='journal')this.tab='journal';
        if(action==='clock')this.tab='clock';
        if(action==='clear-filters')this.filters={location:'',weather:'',author:''};
        if(action==='new')return this.newDraft();
        if(action==='trash'){this.trash=!this.trash;this.tab='journal';}
        if(action==='all')return this.openAll(context);
        if(action==='current'){await clock.setDate({...context.selected,hour:current.hour,minute:current.minute,second:current.second});this.viewYear=null;this.selectedDay=null;notifyHoliday();}
        if(action==='darkness'){const enabled=!daylight.getClockStatus().linked;if(daylight.getClockStatus().engine==='off')await daylight.setClockMode('auto');await daylight.setSceneDaylight(game.scenes?.active??canvas?.scene,enabled);}
        if(action==='newspaper')return openNewspaper(game);
        if(action==='image'){
          const picker=new foundry.applications.apps.FilePicker.implementation({type:'image',current:this.draft?.image,callback:path=>{this.captureDraft();this.draft.image=safeImage(path);this.skipCapture=true;this.render({force:true});}});
          picker.browse();return;
        }
        if(action==='history'){
          if(!game.user.isGM)throw new Error('Somente a Mestra importa históricos.');
          const known=new Set(records.list().filter(r=>r.timelineId===activeId()).map(r=>r.historicalKey));
          for(const h of HISTORY)if(!known.has(h.key))await records.save({title:h.title,description:h.description,location:'Opath',weather:'Não informado',image:'',links:[],sharedWith:[],visibility:'private',repeat:'once',absoluteDay:h.year*240,timelineId:activeId(),historicalKey:h.key});
          ui.notifications.info('Históricos do livro importados só para a Mestra. Dias desconhecidos permanecem sem data exata.');
        }
        this.render({force:true});
      });
      root.querySelector('[name="mode"]')?.addEventListener('change',e=>guard(()=>{
        if(!game.user.isGM)throw new Error('Somente a Mestra altera o calendário.');
        return game.settings.set(ID,'mode',e.target.value);
      }));
      root.querySelector('[name="branch"]')?.addEventListener('change',e=>guard(async()=>{await timelines.switchTo(e.target.value);this.selectedDay=null;this.viewYear=null;notifyHoliday();refresh();}));
      root.querySelector('[data-time-form]')?.addEventListener('submit',e=>{e.preventDefault();const [hour,minute]=String(new FormData(e.target).get('time')).split(':').map(Number);guard(()=>daylight.setTimeOfDay(hour*3600+minute*60));});
      root.querySelector('[data-light-form]')?.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.target);guard(async()=>{await daylight.setDaylightConfig(Object.fromEntries(Object.keys(DEFAULT_DAYLIGHT).map(key=>[key,Number(data.get(key))])));ui.notifications.info('Iluminação configurada.');refresh();});});
      for(const name of ['location','weather','author'])root.querySelector('[data-filter="'+name+'"]')?.addEventListener('change',e=>{this.filters[name]=e.target.value;this.render({force:true});});
      root.querySelector('[data-year-form]')?.addEventListener('submit',e=>{e.preventDefault();const value=Number(new FormData(e.target).get('viewYear'));if(Number.isSafeInteger(value)){this.viewYear=value;this.render({force:true});}});
      root.querySelector('[data-date-form]')?.addEventListener('submit',e=>{
        e.preventDefault();const data=new FormData(e.target),[hour,minute,second=0]=String(data.get('time')).split(':').map(Number);
        const date={year:Number(data.get('year')),cycle:Number(data.get('cycle')),day:Number(data.get('day')),hour,minute,second};
        guard(async()=>{
          if(e.submitter?.value==='branch'){const id=await timelines.create(String(data.get('branchName')),date);await timelines.switchTo(id);}
          else if(e.submitter?.value==='calibrate')await clock.calibrate(date);
          else await clock.setDate(date);
          this.viewYear=null;this.selectedDay=null;notifyHoliday();refresh();
        });
      });
      const editor=root.querySelector('[data-record-form]');
      editor?.addEventListener('submit',e=>{e.preventDefault();this.captureDraft();guard(async()=>{
        const uuid=await records.save(this.draft,this.draft.uuid);
        this.draft=null;this.tab='calendar';this.selectedDay=context.selected.absoluteDay;ui.notifications.info('Registro salvo no Journal.');refresh();return uuid;
      });});
      editor?.addEventListener('dragover',e=>e.preventDefault());
      editor?.addEventListener('drop',e=>{
        e.preventDefault();guard(async()=>{
          const data=JSON.parse(e.dataTransfer.getData('text/plain'));
          if(data.uuid)await this.addLink(data.uuid);else throw new Error('Arraste um Journal, página ou Item.');
        });
      });
      root.querySelector('[data-newspaper-select]')?.addEventListener('change',e=>{if(e.target.value)guard(()=>this.addLink(e.target.value));});
      root.querySelector('[data-uuid-form]')?.addEventListener('submit',e=>{e.preventDefault();guard(()=>this.addLink(String(new FormData(e.target).get('uuid'))));});
    }
  }
  app=new Calendar();
  clockPanel=createClockPanel({game,clock,daylight,open:tab=>{app.tab=tab;app.render({force:true});},onError:error=>ui.notifications.error(error.message)});
  const {sync,...daylightMethods}=daylight;
  const methods={...clock,...daylightMethods,open:()=>app.render({force:true}),getMoonPhases:()=>moons(clock.getCurrentDate().absoluteDay),getHolidays:()=>holidaysFor(clock.getCurrentDate()),lunarAge,
    getTimelines:()=>{
      const state=structuredClone(timelines.getState());
      return game.user.isGM?state:{activeId:activeId(),branches:[{id:activeId(),name:timelines.getActive().name}]};
    },switchTimeline:timelines.switchTo,getDayRecords:day=>records.list().filter(r=>matchesDay(r,day??clock.getCurrentDate().absoluteDay,activeId())).map(r=>({uuid:r.uuid,title:r.title,absoluteDay:r.absoluteDay,timelineId:r.timelineId,location:r.location,weather:r.weather,visibility:r.visibility})),
    linkJournalToDay:async(uuid,details={})=>{
      const doc=await fromUuid(uuid);if(!doc?.testUserPermission(game.user,'OBSERVER'))throw new Error('Journal sem acesso.');
      return records.save({title:doc.name,description:'Edição / referência do dia',location:'',weather:'',image:'',visibility:'private',sharedWith:[],repeat:'once',absoluteDay:clock.getCurrentDate().absoluteDay,timelineId:activeId(),...details,links:[{uuid,label:doc.name}]});
    },
    saveLocationRecord:input=>records.save({location:'',weather:'',image:'',links:[],visibility:'public',sharedWith:[],repeat:'once',...input}),
    listPlaceNotes:ref=>records.list().filter(r=>!r.archived&&r.place?.ref===String(ref)&&r.timelineId===activeId()).map(r=>({uuid:r.uuid,title:r.title,authorId:r.authorId??null,absoluteDay:r.absoluteDay,dateLabel:formatDate(clock.worldTimeToDate((r.absoluteDay-getConfig().offsetDays)*DAY)),timelineId:r.timelineId,visibility:r.visibility,place:r.place})),
    openRecord:uuid=>records.open(uuid)};
  const module=game.modules.get(ID);
  let ready=true;
  const descriptor=createDescriptor(module,methods,()=>({ready,clock:daylight.getClockStatus(),integrations:{smalltime:!!game.modules.get('smalltime')?.active,quedaco:!!findFamilyAPI(game,'quedaco'),newspaper:typeof findFamilyAPI(game,NEWSPAPER_ID,'newspaper')?.open==='function',explorer:!!findFamilyAPI(game,'quedaco-explorador')},diaryPrepared:!!game.journal.get(game.settings.get(ID,'diaryBooks')?.[game.user.id])}));
  module.api=descriptor;
  if(game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id)){
    try{await migrateLegacy(game);await timelines.initialize();await records.provision();}catch(error){ready=false;ui.notifications.error('Calendário: '+error.message);}
  }
  lastNotice=activeId()+':'+clock.getCurrentDate().absoluteDay;
  updateCompanion();guard(()=>daylight.sync());Hooks.callAll(ID+':ready',descriptor);Hooks.callAll('quedaco:register',descriptor);
});
Hooks.on('getSceneControlButtons',controls=>{if(controls.notes)controls.notes.tools[ID]={name:ID,title:'QUEDAÇO - Calendário',icon:'fas fa-calendar-days',button:true,onChange:()=>app?.render({force:true})};});
Hooks.on('updateWorldTime',()=>{refresh();notifyHoliday();if(daylight)guard(()=>daylight.sync());if(clock)Hooks.callAll(ID+':dateChanged',clock.getCurrentDate());});
Hooks.on('renderSmallTimeApp',updateCompanion);
Hooks.on('quedaco:register',refresh);
Hooks.on('canvasReady',()=>{refresh();if(daylight)guard(()=>daylight.sync());});
Hooks.on('updateScene',()=>{refresh();if(daylight)guard(()=>daylight.sync());});
for(const hook of ['createJournalEntry','updateJournalEntry','deleteJournalEntry','createJournalEntryPage','updateJournalEntryPage','deleteJournalEntryPage'])Hooks.on(hook,refresh);
Hooks.on('updateJournalEntryPage',page=>{
  if(records?.isSource(page)&&game.user.isGM&&game.users.activeGM?.id===game.user.id)guard(()=>records.sync(page.uuid));
});
Hooks.on('preDeleteJournalEntryPage',page=>{
  if(records?.isSource(page)){ui.notifications.warn('Use a lixeira do QUEDAÇO - Calendário. A exclusão direta foi bloqueada para preservar o registro.');return false;}
});
Hooks.on('preDeleteJournalEntry',journal=>{
  if(records?.bookOwner(journal.id)){ui.notifications.warn('Diário protegido. Use a lixeira do calendário para retirar anotações.');return false;}
});
Hooks.on('createUser',()=>{if(game.user.isGM&&game.users.activeGM?.id===game.user.id)guard(()=>records.provision());});
