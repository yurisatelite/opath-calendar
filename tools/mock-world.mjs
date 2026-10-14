export function mockWorld() {
  const registry=new Map(),values=new Map();let sequence=0;
  class Collection extends Array {static get [Symbol.species](){return Array;}get(id){return this.find(doc=>doc.id===id);}get contents(){return this;}}
  const users=new Collection(...[{id:'gm',name:'Mestra',isGM:true,role:4,active:true},{id:'alice',name:'Alice',isGM:false,role:1,active:true},{id:'bob',name:'Bob',isGM:false,role:1,active:true},{id:'carol',name:'Carol',isGM:false,role:1,active:true}]);
  users.activeGM=users[0];
  const game={user:users[0],users,modules:new Map([['quedaco-calendario',{id:'quedaco-calendario',title:'QUEDAÇO - Calendário',version:'0.3.2',active:true}],['smalltime',{active:true,version:'2.0.5'}]]),journal:new Collection(),
    settings:{register(id,key,data){if(!values.has(key))values.set(key,structuredClone(data.default));},get(id,key){return values.get(key);},async set(id,key,value){values.set(key,structuredClone(value));}},
    time:{worldTime:349*240*86400+14*3600,async advance(seconds){this.worldTime+=seconds;}}};
  class Doc {
    constructor(data,parent=null){this.id=data._id??'doc'+(++sequence);this.name=data.name;this.flags=structuredClone(data.flags??{});this.ownership=structuredClone(data.ownership??{});this.text=structuredClone(data.text??{});this.parent=parent;this.documentName=parent?'JournalEntryPage':'JournalEntry';this.uuid=parent?parent.uuid+'.JournalEntryPage.'+this.id:'JournalEntry.'+this.id;this.pages=new Collection();registry.set(this.uuid,this);for(const p of data.pages??[])this.pages.push(new Doc(p,this));this.sheet={render:()=>({uuid:this.uuid})};}
    getFlag(scope,key){return this.flags[scope]?.[key];}
    testUserPermission(user,level){const permission={NONE:0,LIMITED:1,OBSERVER:2,OWNER:3}[level]??level;const ownership=this.parent?this.parent.ownership:this.ownership;return user.isGM||(ownership[user.id]??ownership.default??0)>=permission;}
    async update(data){for(const [key,value]of Object.entries(data)){const path=key.split('.');let target=this;for(const part of path.slice(0,-1)){target[part]??={};target=target[part];}target[path.at(-1)]=structuredClone(value);}return this;}
    async createEmbeddedDocuments(type,sources){const docs=sources.map(source=>new Doc(source,this));this.pages.push(...docs);return docs;}
  }
  const create=async data=>{const doc=new Doc(data);game.journal.push(doc);return doc;};
  globalThis.game=game;globalThis.CONFIG={queries:{}};globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{NONE:0,OBSERVER:2,OWNER:3}};
  globalThis.JournalEntry={create};globalThis.fromUuid=async uuid=>registry.get(uuid)??null;
  users.activeGM.query=async(name,data)=>{const previous=game.user;game.user=users[0];try{return await CONFIG.queries[name](data);}finally{game.user=previous;}};
  return {game,values,registry,create};
}
