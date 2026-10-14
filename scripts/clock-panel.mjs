import {MODULE_ID as ID} from './identity.mjs';
import {moons,formatDate} from './calendar.mjs';
import {escapeHTML} from './record-model.mjs';
import {darknessAt} from './daylight.mjs';

export function avoidObstacles(preferred,size,obstacles,viewport) {
  const gap=8,maxX=Math.max(gap,viewport.width-size.width-gap),maxY=Math.max(gap,viewport.height-size.height-gap);
  const clamp=(x,y)=>({x:Math.max(gap,Math.min(maxX,x)),y:Math.max(gap,Math.min(maxY,y))});
  const overlaps=p=>obstacles.some(r=>p.x<r.right+gap&&p.x+size.width>r.left-gap&&p.y<r.bottom+gap&&p.y+size.height>r.top-gap);
  const first=clamp(preferred.x,preferred.y);if(!overlaps(first))return {...first,clear:true};
  const candidates=[...obstacles.flatMap(r=>[clamp(first.x,r.top-size.height-gap),clamp(r.right+gap,first.y),clamp(r.left-size.width-gap,first.y),clamp(first.x,r.bottom+gap)])];
  for(let y=maxY;y>=gap;y-=24)for(let x=gap;x<=maxX;x+=size.width+gap)candidates.push({x,y});
  candidates.sort((a,b)=>Math.hypot(a.x-first.x,a.y-first.y)-Math.hypot(b.x-first.x,b.y-first.y));
  const free=candidates.find(p=>!overlaps(p));
  return {...(free??first),clear:!!free};
}
export function createClockPanel({game,clock,daylight,open,onError}) {
  let panel,observer,resizeObserver,timer,scrubTimer,dragging=false,scrubbing=false,pendingMinute=null,busy=false;
  const attempt=fn=>Promise.resolve().then(fn).catch(onError);
  function position(){
    if(!panel||dragging)return;
    panel.classList.remove('is-crowded');
    const width=Math.min(200,Math.max(0,innerWidth-16));panel.style.width=width+'px';
    const rect=panel.getBoundingClientRect(),saved=game.settings.get(ID,'panelPosition');
    const external=daylight.getClockStatus().engine==='smalltime'?document.getElementById('smalltime-app'):null;
    const anchor=external?.getBoundingClientRect();
    const preferred=saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)?saved:anchor?{x:anchor.left,y:anchor.top-rect.height-6}:{x:16,y:innerHeight-rect.height-180};
    const selectors='#players,#hotbar,#sidebar,#controls,#scene-controls,#notifications,#smalltime-app,[id*="nexus" i],[class*="nexus" i],.application,.window-app,[data-quedaco-overlay]';
    const roots=[...document.body.children].filter(el=>['fixed','absolute'].includes(getComputedStyle(el).position)&&el.getBoundingClientRect().width<innerWidth*0.8&&el.getBoundingClientRect().height<innerHeight*0.8);
    const nexusLabels=[...document.querySelectorAll('button,a')].filter(el=>/FA\s*Nexus/i.test(el.textContent??''));
    const obstacles=[...new Set([...document.querySelectorAll(selectors),...roots,...nexusLabels])].filter(el=>el!==panel&&!panel.contains(el)&&!el.contains(panel)&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden').map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
    let target=avoidObstacles(preferred,rect,obstacles,{width:innerWidth,height:innerHeight});
    // If every slot is occupied, fold to a small draggable calendar launcher.
    panel.classList.toggle('is-crowded',!target.clear);
    if(!target.clear)target=avoidObstacles(preferred,panel.getBoundingClientRect(),obstacles,{width:innerWidth,height:innerHeight});
    for(const [key,value]of [['left',target.x+'px'],['top',target.y+'px']])if(panel.style[key]!==value)panel.style[key]=value;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(position,80);}
  async function flush(){
    if(busy)return;busy=true;
    try{while(pendingMinute!==null){const value=pendingMinute;pendingMinute=null;await daylight.setTimeOfDay(value*60);}}
    catch(error){pendingMinute=null;onError(error);}
    finally{busy=false;}
  }
  function bind(){
    panel.querySelector('[data-clock-open]').addEventListener('click',()=>open('calendar'));
    panel.querySelector('[data-clock-settings]').addEventListener('click',()=>open('clock'));
    panel.querySelector('[data-clock-reset]').addEventListener('click',()=>attempt(async()=>{await game.settings.set(ID,'panelPosition',{});position();}));
    panel.querySelectorAll('[data-clock-advance]').forEach(el=>el.addEventListener('click',()=>attempt(()=>clock.advanceTime(Number(el.dataset.clockAdvance)))));
    const slider=panel.querySelector('[data-clock-slider]');
    slider?.addEventListener('input',()=>{
      scrubbing=true;pendingMinute=Number(slider.value);paintTime(pendingMinute*60);
      // Live clock/map updates are serialized; intermediate pointer positions coalesce.
      if(!scrubTimer)scrubTimer=setTimeout(()=>{scrubTimer=null;attempt(flush);},100);
    });
    slider?.addEventListener('change',()=>{clearTimeout(scrubTimer);scrubTimer=null;scrubbing=false;pendingMinute=Number(slider.value);attempt(async()=>{await flush();update();});});
    slider?.addEventListener('blur',()=>{scrubbing=false;update();});
    const handle=panel.querySelector('[data-clock-grip]');
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.preventDefault();dragging=true;
      const r=panel.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
      handle.setPointerCapture(e.pointerId);
      const move=event=>{panel.style.left=Math.max(8,Math.min(innerWidth-panel.offsetWidth-8,event.clientX-dx))+'px';panel.style.top=Math.max(8,Math.min(innerHeight-panel.offsetHeight-8,event.clientY-dy))+'px';};
      const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);dragging=false;attempt(async()=>{await game.settings.set(ID,'panelPosition',{x:parseFloat(panel.style.left),y:parseFloat(panel.style.top)});position();});};
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
    });
  }
  function paintTime(seconds){
    const status=daylight.getClockStatus(),night=darknessAt(seconds,status.config),hour=Math.floor(seconds/3600),minute=Math.floor(seconds%3600/60);
    const track=panel.querySelector('.quedaco-sky');if(!track)return;
    track.style.setProperty('--sun-position',(seconds/86340*100)+'%');
    track.style.background=night<0.15?'#23bdd8':night<0.65?'linear-gradient(#a8463d,#cc8551)':'linear-gradient(#141c39,#354366)';
    const sun=panel.querySelector('.quedaco-sun');sun.textContent=night<0.5?'☀':'☾';sun.classList.toggle('is-night',night>=0.5);
    panel.querySelector('[data-clock-time]').textContent=String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
  }
  function update(){
    if(!document.body?.append)return;
    if(game.settings.get(ID,'showClockPanel')===false){observer?.disconnect();resizeObserver?.disconnect();panel?.remove();panel=null;return;}
    const date=clock.getCurrentDate(),status=daylight.getClockStatus(),native=status.engine!=='smalltime';
    if(!panel){
      panel=document.createElement('section');panel.id='quedaco-clock-panel';panel.dataset.quedacoOverlay='';panel.setAttribute('aria-label','Relógio QUEDAÇO');document.body.append(panel);
      if(typeof MutationObserver!=='undefined'){
        observer=new MutationObserver(changes=>{if(changes.some(c=>c.target!==panel&&!panel?.contains(c.target)))schedule();});
        observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
      }
      if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(schedule);resizeObserver.observe(document.body);}
      globalThis.addEventListener?.('resize',schedule);
    }
    if(scrubbing||dragging)return;
    const phases=moons(date.absoluteDay),label=date.weekday+' · Dia '+date.day+' de '+date.cycleName+' · '+Math.abs(date.year)+' '+(date.year<0?'A.F.':'D.F.');
    panel.innerHTML='<div class="quedaco-clock-tools"><button type="button" data-clock-grip title="Arrastar painel" aria-label="Arrastar painel">⠿</button><button type="button" data-clock-reset title="Reposicionar automaticamente">↺</button><button type="button" data-clock-settings title="Relógio e iluminação">⚙</button></div><button type="button" class="quedaco-clock-date" data-clock-open title="'+escapeHTML(formatDate(date))+'"><span>'+escapeHTML(label)+'</span><span class="opath-compact-moons">'+phases.map(m=>'<svg class="opath-moon-icon" style="color:'+m.color+'" viewBox="0 0 24 24" role="img" aria-label="'+escapeHTML(m.name+': '+m.phase)+'"><title>'+escapeHTML(m.name+': '+m.phase)+'</title><use href="modules/quedaco-calendario/assets/moons.svg#'+m.icon+'"></use></svg>').join('')+'</span></button>'+(native?'<div class="quedaco-native-clock"><div class="quedaco-sky"><span class="quedaco-sun" aria-hidden="true"></span><input type="range" min="0" max="1439" step="1" value="'+(date.hour*60+date.minute)+'" data-clock-slider aria-label="Hora do dia" '+(!game.user.isGM?'disabled':'')+'></div><div class="quedaco-clock-buttons">'+(game.user.isGM?'<button type="button" data-clock-advance="-3600" title="Menos uma hora">«</button><button type="button" data-clock-advance="-600" title="Menos dez minutos">‹</button>':'')+'<button type="button" data-clock-time title="Abrir relógio e iluminação">'+date.hour+':'+date.minute+'</button>'+(game.user.isGM?'<button type="button" data-clock-advance="600" title="Mais dez minutos">›</button><button type="button" data-clock-advance="3600" title="Mais uma hora">»</button>':'')+'</div></div>':'');
    bind();panel.querySelector('[data-clock-time]')?.addEventListener('click',()=>open('clock'));
    paintTime(date.hour*3600+date.minute*60);position();
  }
  return {update,position,destroy(){observer?.disconnect();resizeObserver?.disconnect();clearTimeout(timer);clearTimeout(scrubTimer);globalThis.removeEventListener?.('resize',schedule);panel?.remove();panel=null;}};
}
