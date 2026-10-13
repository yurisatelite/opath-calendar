/** Lightweight Foundry stand-in for template checks; never used in the shipped module. */
export async function fixture() {
  const hooks = new Map(), values = new Map();
  globalThis.Hooks = {once(name, callback) {hooks.set(name, callback);}, on() {}, callAll() {}};
  class Application {render() {this.rendered = true; return this;} _onRender() {}}
  globalThis.foundry = {applications:{api:{ApplicationV2:Application, HandlebarsApplicationMixin:Base => Base}}};
  globalThis.document = {getElementById: () => null};
  const sample = (id, title, secret = false) => ({id, name:title, flags:{'opath-calendar':{event:{absoluteDay:349 * 240, title, description:'Viagem da guilda <script>alert(1)</script>', private:secret, repeat:'once'}}}, testUserPermission:user => user.isGM || !secret});
  globalThis.game = {
    user:{isGM:true}, modules:new Map([['opath-calendar',{}], ['smalltime',{active:true,version:'2.0.5'}]]),
    settings:{register(id,key,data) {values.set(key, data.default);}, get(id,key) {return values.get(key);}, async set(id,key,value) {values.set(key,value);}},
    time:{worldTime:349 * 240 * 86400 + 14 * 3600, async advance(seconds) {this.worldTime += seconds;}},
    journal:[sample('public','Viagem da guilda'), sample('secret','Segredo da Mestra',true)]
  };
  globalThis.canvas = {scene:{getFlag:() => true}};
  await import('../scripts/main.mjs');
  hooks.get('init')();
  hooks.get('ready')();
  const app = game.modules.get('opath-calendar').api.open();
  return {app, game, values};
}
