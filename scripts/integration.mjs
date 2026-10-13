import {DAY, worldTimeToDate, dateToWorldTime} from './calendar.mjs';
import {MODULE_ID} from './identity.mjs';

export function createClock(game, getConfig, writeOffset = offset => game.settings.set(MODULE_ID, 'offsetDays', offset)) {
  function requireGM() { if (!game.user.isGM) throw new Error('Somente a Mestra pode alterar o tempo.'); }
  return {
    getCurrentDate: () => worldTimeToDate(Math.floor(game.time.worldTime), getConfig()),
    worldTimeToDate: time => worldTimeToDate(time, getConfig()),
    dateToWorldTime: date => dateToWorldTime(date, getConfig()),
    advanceTime: async seconds => {
      requireGM();
      if (!Number.isSafeInteger(seconds) || !Number.isSafeInteger(Math.floor(game.time.worldTime) + seconds)) throw new Error('Avanço de tempo inválido.');
      return game.time.advance(seconds);
    },
    setDate: async date => {
      requireGM();
      const target = dateToWorldTime(date, getConfig());
      return game.time.advance(target - Math.floor(game.time.worldTime));
    },
    /** Calibrates the date at today's midnight without moving the clock or map light. */
    calibrate: async date => {
      requireGM();
      const target = dateToWorldTime({...date, hour: 0, minute: 0, second: 0}, {...getConfig(), offsetDays: 0});
      return writeOffset(target / DAY - Math.floor(game.time.worldTime / DAY));
    },
    getSmallTimeStatus: () => ({active: !!game.modules.get('smalltime')?.active, version: game.modules.get('smalltime')?.version ?? null}),
    setSmallTimeSceneLink: async (scene, enabled) => {
      requireGM();
      if (!game.modules.get('smalltime')?.active) throw new Error('Ative o SmallTime para vincular a iluminação.');
      if (!scene) throw new Error('Abra uma cena para vincular a iluminação.');
      return scene.setFlag('smalltime', 'darkness-link', enabled === true);
    }
  };
}
