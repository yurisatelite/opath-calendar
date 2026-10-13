// This retired ID does not initialize a second clock, diary or family descriptor.
Hooks.once('ready',()=>{
  if(!game.user.isGM||game.modules.get('quedaco-calendario')?.active)return;
  ui.notifications.warn('O calendário agora usa o ID quedaco-calendario. Instale e ative o novo pacote pelo manifesto https://github.com/yurisatelite/opath-calendar/releases/latest/download/quedaco-calendario.json e desative opath-calendar. Os dados antigos serão migrados pela Mestra.',{permanent:true});
});
