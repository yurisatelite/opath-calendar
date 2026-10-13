export const DAY = 86400;
export const CYCLES = Object.freeze(['Fogo', 'Vida', 'Opala', 'Fênix', 'Terra', 'Ordem', 'Ágata', 'Gárgola', 'Água', 'Maré', 'Ametista', 'Hipocampo', 'Ar', 'Sorte', 'Jaspe', 'Grifo']);
export const WEEKDAYS = Object.freeze(['Lunadi', 'Metudi', 'Plenudi', 'Minidi', 'Tenedris']);
export const ABBREVIATIONS = Object.freeze(['L', 'Me', 'P', 'Mi', 'T']);
export const SEASONS = Object.freeze(['Primavera', 'Verão', 'Outono', 'Inverno']);
export const mod = (n, d) => ((n % d) + d) % d;
const festival = (cycle, day, name, description) => Object.freeze({id: `official-${cycle}-${day}`, cycle, day, name, description});
export const HOLIDAYS = Object.freeze([
  festival(1, 1, 'Dia do Anel de Fogo', 'Virada do Anel e eclipse triplo. Diabos e demônios escapam de Varmah.'),
  festival(1, 2, 'Troca das cortes', 'Troca das cortes para Outono / Primavera.'),
  festival(2, 4, 'Tsun on Ma', 'Lamento pela Primeira Grande Queda, em Salim.'),
  festival(4, 9, 'Troca de Fitas', 'Celebração em Alberich: troca de fitas com mensagens.'),
  festival(4, 13, 'Fundação do Senado', 'Aniversário da fundação do Senado.'),
  festival(5, 8, 'Yutzeral', 'Celebração da nova Árvore da Vida dos Elfos do Outono e cuidado com suas árvores.'),
  festival(6, 14, 'Acolhimento', 'Celebração da chegada dos Urodelos a Alberich.'),
  festival(7, 12, 'Ryu no Madan', 'Celebração da primeira libertação de Sodori das Nagas.'),
  festival(8, 7, "Repouso (Il’ma at Va’Al)", "Lamento pelo desaparecimento de Va’Al no céu e pelo aprisionamento dos elfos em Op, conforme o calendário fornecido."),
  festival(9, 2, 'Troca das cortes', 'Troca das cortes para Inverno / Verão.'),
  festival(10, 4, 'Horami Ihaka', 'Dia dos Kias: preparação, treino e comunhão com os espíritos para o Ihaka.'),
  festival(11, 14, 'Diáspora', 'Lamento pela Segunda Grande Queda, em Tormund.'),
  festival(12, 12, 'Wanan’to', 'Início de uma viagem de três dias em celebração à Vida; encontro dos M’bo com os Anuros em Maruma.'),
  festival(13, 14, 'Porta’berta', 'Celebração da abertura da porta para Walsh.'),
  festival(14, 10, 'Banquetão', 'Feriado de Walsh: os Pequeninos realizam grandes banquetes.'),
  festival(15, 1, '7 Léguas', 'Competição em Alberich: velocidade, conexão psiônica e magia entre raptoleiros.'),
  festival(16, 14, 'Quebra-copos', 'Preparação para o Anel de Fogo: quebra de objetos circulares.')
]);

function integer(value, label) {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} deve ser um inteiro válido.`);
  return value;
}
export function options(config = {}) {
  const mode = config.mode ?? 'lunar';
  if (!['lunar', 'solar'].includes(mode)) throw new Error('Modo de calendário inválido.');
  return {mode, offsetDays: integer(config.offsetDays ?? 0, 'Marco'), seasonOffset: integer(config.seasonOffset ?? 0, 'Estação inicial')};
}

/** Day-only offset preserves SmallTime's clock (worldTime mod 86400) exactly. */
export function worldTimeToDate(worldTime, config = {}) {
  if (!Number.isSafeInteger(worldTime)) throw new Error('Tempo deve ser um número inteiro de segundos.');
  const {mode, offsetDays, seasonOffset} = options(config);
  const absoluteDay = Math.floor(worldTime / DAY) + offsetDays;
  integer(absoluteDay, 'Dia absoluto');
  const yearDays = mode === 'solar' ? 480 : 240;
  const dayOfYear = mod(absoluteDay, yearDays);
  const cycleIndex = Math.floor(dayOfYear / 15);
  const clock = mod(worldTime, DAY);
  const seasonIndex = mod(Math.floor(absoluteDay / 120) + seasonOffset, 4);
  return {
    mode, absoluteDay, year: Math.floor(absoluteDay / yearDays), yearDays,
    cycle: cycleIndex + 1, cycleName: CYCLES[cycleIndex % 16],
    repetition: Math.floor(cycleIndex / 16) + 1, day: dayOfYear % 15 + 1,
    dayOfYear: dayOfYear + 1, weekday: WEEKDAYS[mod(absoluteDay, 5)],
    season: SEASONS[seasonIndex], seasonIndex,
    lunarYear: Math.floor(absoluteDay / 240), solarYear: Math.floor(absoluteDay / 480),
    hour: Math.floor(clock / 3600), minute: Math.floor(clock % 3600 / 60), second: clock % 60
  };
}
export function dateToWorldTime(date, config = {}) {
  const {mode, offsetDays} = options(config);
  const year = integer(date.year, 'Anel');
  const cycle = integer(date.cycle, 'Ciclo');
  const day = integer(date.day, 'Dia');
  const hour = integer(date.hour ?? 0, 'Hora');
  const minute = integer(date.minute ?? 0, 'Minuto');
  const second = integer(date.second ?? 0, 'Segundo');
  if (cycle < 1 || cycle > (mode === 'solar' ? 32 : 16) || day < 1 || day > 15 || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) throw new Error('Data fora dos limites do calendário.');
  return integer((year * (mode === 'solar' ? 480 : 240) + (cycle - 1) * 15 + day - 1 - offsetDays) * DAY + hour * 3600 + minute * 60 + second, 'Tempo');
}

export function moons(absoluteDay) {
  integer(absoluteDay, 'Dia');
  const phases = ['Nova', 'Crescente', 'Cheia', 'Minguante', 'Sem lua'];
  const glyphs = ['○', '◔', '●', '◕', '·'];
  const icons = ['new', 'waxing', 'full', 'waning', 'absent'];
  const lapisPhase = mod(absoluteDay, 5);
  // Red moon icon progression transcribed from the 15 daily symbols in the supplied image.
  const varmahPhases = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4];
  const varmahPhase = varmahPhases[mod(absoluteDay, 15)];
  return [
    {id: 'lapis', name: 'Lápis', period: 5, color: '#429fc6', phase: phases[lapisPhase], glyph: glyphs[lapisPhase], icon: icons[lapisPhase]},
    {id: 'varmah', name: 'Varmah', period: 15, color: '#db6668', phase: phases[varmahPhase], glyph: glyphs[varmahPhase], icon: icons[varmahPhase]}
  ];
}
export function holidaysFor(date) {
  return HOLIDAYS.filter(h => h.cycle === (date.cycle - 1) % 16 + 1 && h.day === date.day);
}
export function formatDate(date) {
  const era = date.year < 0 ? 'A.F.' : 'D.F.';
  const repetition = date.mode === 'solar' ? ` · volta ${date.repetition}/2` : '';
  return `${date.weekday}, ${date.day} de ${date.cycleName}${repetition} · Anel ${Math.abs(date.year)} ${era}`;
}
export function lunarAge(birthDay, currentDay) {
  integer(birthDay, 'Nascimento'); integer(currentDay, 'Dia atual');
  if (birthDay > currentDay) throw new Error('Nascimento está no futuro.');
  return {rings: Math.floor((currentDay - birthDay) / 240), earthYears: (currentDay - birthDay) / 365.2425};
}

export function validateEvent(event) {
  if (typeof event.title !== 'string' || !event.title.trim() || event.title.length > 160) throw new Error('Título obrigatório, até 160 caracteres.');
  integer(event.absoluteDay, 'Data do registro');
  if (!['once', 'lunar', 'solar'].includes(event.repeat)) throw new Error('Recorrência inválida.');
  if (typeof event.description !== 'string' || event.description.length > 10000) throw new Error('Descrição inválida (máximo de 10.000 caracteres).');
  return {...event, title: event.title.trim(), private: event.private === true};
}
export function eventsFor(events, absoluteDay, user) {
  return events.filter(e => {
    if (e.private && !user.isGM) return false;
    const period = e.repeat === 'lunar' ? 240 : e.repeat === 'solar' ? 480 : null;
    return period ? mod(absoluteDay - e.absoluteDay, period) === 0 && absoluteDay >= e.absoluteDay : e.absoluteDay === absoluteDay;
  });
}
