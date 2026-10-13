import {mockWorld} from './mock-world.mjs';
/** Lightweight Foundry stand-in for template checks; never used in the shipped module. */
export async function fixture() {
  const hooks = new Map(),listeners=new Map(), f=mockWorld();
  globalThis.Hooks = {once(name, callback) {hooks.set(name, callback);}, on(name,callback) {listeners.set(name,callback);}, callAll() {}};
  class Application {render() {this.rendered = true; return this;} _onRender() {}}
  globalThis.foundry = {applications:{api:{ApplicationV2:Application, HandlebarsApplicationMixin:Base => Base,DialogV2:{}}}};
  globalThis.document = {getElementById: () => null};
  await f.create({name:'Viagem da guilda',ownership:{default:2},flags:{'quedaco-calendario':{event:{absoluteDay:349*240,description:'Viagem da guilda <script>alert(1)</script>',private:false,repeat:'once'}}}});
  await f.create({name:'Segredo da Mestra',ownership:{default:0},flags:{'quedaco-calendario':{event:{absoluteDay:349*240,description:'Notas privadas',private:true,repeat:'once'}}}});
  globalThis.ui={notifications:{info(){},error(){},warn(){}}};
  globalThis.canvas = {scene:{getFlag:() => true}};
  await import('../scripts/main.mjs');
  hooks.get('init')();
  await hooks.get('ready')();
  const app = game.modules.get('quedaco-calendario').api.open();
  return {app, game:f.game, values:f.values,listeners};
}
