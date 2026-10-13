import {DAY, CYCLES, WEEKDAYS, ABBREVIATIONS, SEASONS, moons, holidaysFor, formatDate, eventsFor, validateEvent, lunarAge} from './calendar.mjs';
import {createClock} from './integration.mjs';

const ID = 'opath-calendar';
const getConfig = () => ({mode: game.settings.get(ID, 'mode'), offsetDays: game.settings.get(ID, 'offsetDays'), seasonOffset: game.settings.get(ID, 'seasonOffset')});
let clock, app;
function refresh() { if (app?.rendered) app.render({force: true}); updateCompanion(); }
function guard(action) { return Promise.resolve().then(action).catch(e => ui.notifications.error(e.message)); }
function journalEvents() {
  return game.journal.filter(j => j.flags[ID]?.event && j.testUserPermission(game.user, 'OBSERVER'))
    .map(j => ({...j.flags[ID].event, id: j.id, title: j.name}));
}

/** A separate Opath date button, leaving SmallTime's own controls and date APIs intact. */
function updateCompanion() {
  const root = document.getElementById('smalltime-app');
  if (!root || !clock) return;
  let button = root.querySelector('[data-opath-calendar]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button'; button.dataset.opathCalendar = '';
    button.className = 'opath-smalltime-date';
    button.addEventListener('click', () => app.render({force: true}));
    root.append(button);
  }
  const date = clock.getCurrentDate();
  button.textContent = `${date.day} · ${date.cycleName} · ${Math.abs(date.year)} ${date.year < 0 ? 'A.F.' : 'D.F.'}${date.mode === 'solar' ? ` (${date.repetition}/2)` : ''}`;
  button.title = `${formatDate(date)} — abrir calendário`;
}

Hooks.once('init', () => {
  const register = (key, data) => game.settings.register(ID, key, {scope: 'world', config: true, onChange: () => {
    if (app) { app.viewYear = null; app.selectedDay = null; }
    refresh();
  }, ...data});
  register('mode', {name: 'Contagem exibida', hint: 'Lunar: 240 dias por Anel. Solar: 480 dias. Trocar a exibição preserva o instante atual.', type: String, choices: {lunar: 'Lunar — 240 dias', solar: 'Solar — 480 dias'}, default: 'lunar'});
  register('offsetDays', {name: 'Marco do calendário (dias)', hint: 'Prefira o botão Calibrar data na janela para associar a data da campanha ao relógio atual.', type: Number, default: 0, config: false});
  register('seasonOffset', {name: 'Primeira estação do período solar', hint: 'As estações continuam entre Anéis lunares e duram 120 dias. Ajuste à região da campanha.', type: Number, choices: Object.fromEntries(SEASONS.map((s, i) => [i, s])), default: 0});
});

Hooks.once('ready', () => {
  clock = createClock(game, getConfig);
  const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
  class OpathCalendar extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {id: 'opath-calendar-window', classes: ['opath-calendar'], window: {title: 'Calendário de Opath', resizable: true}, position: {width: 1000, height: 780}};
    static PARTS = {body: {template: 'modules/opath-calendar/templates/calendar.hbs'}};
    viewYear = null;
    selectedDay = null;
    editing = null;

    async _prepareContext() {
      const current = clock.getCurrentDate();
      const viewYear = this.viewYear ?? current.year;
      const yearStart = viewYear * current.yearDays;
      const selectedDay = this.selectedDay ?? current.absoluteDay;
      const selected = clock.worldTimeToDate((selectedDay - getConfig().offsetDays) * DAY);
      const entries = journalEvents();
      const cycles = Array.from({length: current.yearDays / 15}, (_, index) => ({
        name: `Ciclo ${index + 1} · ${CYCLES[index % 16]}${index >= 16 ? ' · II' : ''}`,
        days: Array.from({length: 15}, (_, d) => {
          const absoluteDay = yearStart + index * 15 + d;
          const date = clock.worldTimeToDate((absoluteDay - getConfig().offsetDays) * DAY);
          const holidays = holidaysFor(date);
          const notes = eventsFor(entries, absoluteDay, game.user);
          return {day: d + 1, absoluteDay, current: absoluteDay === current.absoluteDay, selected: absoluteDay === selectedDay,
            festival: holidays.length > 0, notes: notes.length, title: [...holidays.map(h => h.name), ...notes.map(n => n.title)].join(' · '), moons: moons(absoluteDay)};
        })
      }));
      const edit = entries.find(e => e.id === this.editing);
      return {
        isGM: game.user.isGM, current, currentLabel: formatDate(current), viewYear, currentTime: `${String(current.hour).padStart(2, '0')}:${String(current.minute).padStart(2, '0')}:${String(current.second).padStart(2, '0')}`,
        mode: current.mode, modeLabel: current.mode === 'lunar' ? 'Lunar · 240 dias' : 'Solar · 480 dias',
        isSolar: current.mode === 'solar', solarSelected: current.mode === 'solar' ? 'selected' : '', lunarSelected: current.mode === 'lunar' ? 'selected' : '',
        cycles, weekdays: WEEKDAYS.map((name, i) => ({name, abbreviation: ABBREVIATIONS[i]})), selected, selectedLabel: formatDate(selected),
        moons: moons(selectedDay), holidays: holidaysFor(selected), events: eventsFor(entries, selectedDay, game.user),
        smalltime: clock.getSmallTimeStatus(), darkLinked: !!canvas?.scene?.getFlag('smalltime', 'darkness-link'),
        cycleOptions: Array.from({length: current.yearDays / 15}, (_, i) => ({value: i + 1, label: `${i + 1} · ${CYCLES[i % 16]}${i >= 16 ? ' · II' : ''}`, selected: selected.cycle === i + 1 ? 'selected' : ''})),
        edit, repeatOnce: !edit || edit.repeat === 'once' ? 'selected' : '', repeatLunar: edit?.repeat === 'lunar' ? 'selected' : '', repeatSolar: edit?.repeat === 'solar' ? 'selected' : ''
      };
    }

    _onRender(context, options) {
      super._onRender(context, options);
      const root = this.element;
      root.querySelectorAll('[data-day]').forEach(b => b.addEventListener('click', () => {this.selectedDay = Number(b.dataset.day); this.editing = null; this.render({force: true});}));
      root.querySelectorAll('[data-action-local]').forEach(b => b.addEventListener('click', () => guard(async () => {
        const action = b.dataset.actionLocal;
        const current = clock.getCurrentDate();
        if (action === 'previous') this.viewYear = (this.viewYear ?? current.year) - 1;
        if (action === 'next') this.viewYear = (this.viewYear ?? current.year) + 1;
        if (action === 'today') {this.viewYear = null; this.selectedDay = null; this.editing = null;}
        if (action === 'cancelEdit') this.editing = null;
        if (action === 'darkness') {
          await clock.setSmallTimeSceneLink(canvas?.scene, !canvas?.scene?.getFlag('smalltime', 'darkness-link'));
          // The next clock update is handled by SmallTime's native updateWorldTime hook.
          ui.notifications.info('Vínculo atualizado. A iluminação acompanhará as próximas alterações do relógio.');
        }
        this.render({force: true});
      })));
      root.querySelectorAll('[data-advance]').forEach(b => b.addEventListener('click', () => guard(() => clock.advanceTime(Number(b.dataset.advance)))));
      root.querySelector('[name="mode"]')?.addEventListener('change', e => guard(() => {
        if (!game.user.isGM) throw new Error('Somente a Mestra pode alterar o calendário.');
        return game.settings.set(ID, 'mode', e.target.value);
      }));
      root.querySelector('[data-date-form]')?.addEventListener('submit', e => {
        e.preventDefault();
        const data = new FormData(e.target);
        const [hour, minute, second = 0] = String(data.get('time')).split(':').map(Number);
        const date = {year: Number(data.get('year')), cycle: Number(data.get('cycle')), day: Number(data.get('day')), hour, minute, second};
        guard(async () => {
          if (e.submitter?.value === 'calibrate') await clock.calibrate(date);
          else await clock.setDate(date);
          this.viewYear = null; this.selectedDay = null; this.render({force: true});
        });
      });
      root.querySelector('[data-event-form]')?.addEventListener('submit', e => {
        e.preventDefault();
        const data = new FormData(e.target);
        guard(async () => {
          if (!game.user.isGM) throw new Error('Somente a Mestra pode cadastrar registros.');
          const event = validateEvent({title: String(data.get('title')), description: String(data.get('description')), absoluteDay: context.selected.absoluteDay, repeat: String(data.get('repeat')), private: data.has('private')});
          const payload = {name: event.title, [`flags.${ID}.event`]: event, ownership: {default: event.private ? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE : CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER}};
          if (this.editing) await game.journal.get(this.editing).update(payload);
          else await JournalEntry.create(payload);
          this.editing = null; this.render({force: true});
        });
      });
      root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {this.editing = b.dataset.edit; this.render({force: true});}));
      root.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => guard(async () => {
        if (!game.user.isGM) throw new Error('Somente a Mestra pode excluir registros.');
        const entry = game.journal.get(b.dataset.delete);
        if (!entry?.flags[ID]?.event) return;
        const yes = await foundry.applications.api.DialogV2.confirm({window: {title: 'Excluir registro'}, content: '<p>Excluir este registro do calendário? Esta ação remove o diário associado.</p>'});
        if (yes) {await entry.delete(); this.editing = null; this.render({force: true});}
      })));
    }
  }
  app = new OpathCalendar();
  const api = {...clock, open: () => app.render({force: true}), getMoonPhases: () => moons(clock.getCurrentDate().absoluteDay), getHolidays: () => holidaysFor(clock.getCurrentDate()), lunarAge};
  game.modules.get(ID).api = api;
  updateCompanion();
  Hooks.callAll('opath-calendar:ready', api);
});

Hooks.on('getSceneControlButtons', controls => {
  if (controls.notes) controls.notes.tools['opath-calendar'] = {name: 'opath-calendar', title: 'Calendário de Opath', icon: 'fas fa-calendar-days', button: true, onChange: () => app?.render({force: true})};
});
Hooks.on('updateWorldTime', () => {
  refresh();
  if (clock) Hooks.callAll('opath-calendar:dateChanged', clock.getCurrentDate());
});
Hooks.on('renderSmallTimeApp', updateCompanion);
Hooks.on('canvasReady', refresh);
Hooks.on('updateScene', refresh);
for (const hook of ['createJournalEntry', 'updateJournalEntry', 'deleteJournalEntry']) Hooks.on(hook, refresh);
