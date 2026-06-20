const KEYS = {
  player: 'pr_player',
  coins: 'pr_coins',
  bestScore: 'pr_best_score',
  bestTime: 'pr_best_time',
  runs: 'pr_runs',
  tutorial: 'pr_tutorial',
  session: 'pr_session',
  streak: 'pr_streak',
  lastRun: 'pr_last_run',
} as const;

export function getStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export const Storage = {
  getPlayer: () => getStorage<{name: string, avatarId: string} | null>(KEYS.player, null),
  setPlayer: (player: {name: string, avatarId: string} | null) => setStorage(KEYS.player, player),
  getCoins: () => getStorage<number>(KEYS.coins, 0),
  setCoins: (coins: number) => setStorage(KEYS.coins, coins),
  getBestScore: () => getStorage<number>(KEYS.bestScore, 0),
  setBestScore: (score: number) => setStorage(KEYS.bestScore, score),
  getBestTime: () => getStorage<number>(KEYS.bestTime, 0),
  setBestTime: (time: number) => setStorage(KEYS.bestTime, time),
  getRuns: () => getStorage<number>(KEYS.runs, 0),
  setRuns: (runs: number) => setStorage(KEYS.runs, runs),
  getTutorial: () => getStorage<boolean>(KEYS.tutorial, false),
  setTutorial: (seen: boolean) => setStorage(KEYS.tutorial, seen),
  getSession: () => getStorage<'player' | 'guest' | null>(KEYS.session, null),
  setSession: (session: 'player' | 'guest' | null) => setStorage(KEYS.session, session),
  getStreak: () => getStorage<{count: number, lastDate: string}>(KEYS.streak, {count: 0, lastDate: ''}),
  setStreak: (streak: {count: number, lastDate: string}) => setStorage(KEYS.streak, streak),
  getLastRun: () => getStorage<{coins: number, distance: number, time: number} | null>(KEYS.lastRun, null),
  setLastRun: (run: {coins: number, distance: number, time: number} | null) => setStorage(KEYS.lastRun, run),
};
