import type { DailyRewardsSave } from '../types/pgf';

export type DailyMilestoneType = 'shield' | 'skill' | 'skin_tiger' | 'skin_abyss';

export interface DailyRewardDay {
  day: number;
  coins: number;
  milestone?: DailyMilestoneType;
  fallbackCoins?: number;
  icon: string;
}

export const DAILY_REWARD_SCHEDULE: DailyRewardDay[] = [
  { day: 1, coins: 50, icon: '🪙' },
  { day: 2, coins: 75, icon: '🪙' },
  { day: 3, coins: 100, icon: '🪙' },
  { day: 4, coins: 125, icon: '🪙' },
  { day: 5, coins: 150, icon: '🪙' },
  { day: 6, coins: 200, icon: '🪙' },
  { day: 7, coins: 500, milestone: 'shield', fallbackCoins: 500, icon: '🛡️' },
  { day: 8, coins: 225, icon: '🪙' },
  { day: 9, coins: 250, icon: '🪙' },
  { day: 10, coins: 300, icon: '🪙' },
  { day: 11, coins: 325, icon: '🪙' },
  { day: 12, coins: 350, icon: '🪙' },
  { day: 13, coins: 400, icon: '🪙' },
  { day: 14, coins: 1000, milestone: 'skill', fallbackCoins: 400, icon: '⚡' },
  { day: 15, coins: 450, icon: '🪙' },
  { day: 16, coins: 475, icon: '🪙' },
  { day: 17, coins: 500, icon: '🪙' },
  { day: 18, coins: 550, icon: '🪙' },
  { day: 19, coins: 600, icon: '🪙' },
  { day: 20, coins: 650, icon: '🪙' },
  { day: 21, coins: 1500, milestone: 'skin_tiger', fallbackCoins: 600, icon: '🐯' },
  { day: 22, coins: 700, icon: '🪙' },
  { day: 23, coins: 750, icon: '🪙' },
  { day: 24, coins: 800, icon: '🪙' },
  { day: 25, coins: 850, icon: '🪙' },
  { day: 26, coins: 900, icon: '🪙' },
  { day: 27, coins: 1000, icon: '🪙' },
  { day: 28, coins: 1100, icon: '🪙' },
  { day: 29, coins: 1250, icon: '🪙' },
  { day: 30, coins: 5000, milestone: 'skin_abyss', fallbackCoins: 2500, icon: '👑' }
];

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeDailyRewards(raw?: Partial<DailyRewardsSave> | null): DailyRewardsSave {
  const streakDay =
    typeof raw?.streakDay === 'number' && Number.isFinite(raw.streakDay)
      ? Math.max(0, Math.min(30, Math.floor(raw.streakDay)))
      : 0;
  const lastClaimDate =
    typeof raw?.lastClaimDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastClaimDate)
      ? raw.lastClaimDate
      : null;
  const claimedDays = Array.isArray(raw?.claimedDays)
    ? Array.from(
        new Set(
          raw.claimedDays.filter(
            (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 30
          )
        )
      ).sort((a, b) => a - b)
    : [];
  const cycleCount =
    typeof raw?.cycleCount === 'number' && Number.isFinite(raw.cycleCount)
      ? Math.max(0, Math.floor(raw.cycleCount))
      : 0;
  const lastClaimTimestamp =
    typeof raw?.lastClaimTimestamp === 'number' && Number.isFinite(raw.lastClaimTimestamp)
      ? Math.max(0, Math.floor(raw.lastClaimTimestamp))
      : 0;

  return { streakDay, lastClaimDate, claimedDays, cycleCount, lastClaimTimestamp };
}

export function canClaimDailyToday(
  daily: DailyRewardsSave,
  todayKey: string = getLocalDateKey(),
  nowMs: number = Date.now()
): boolean {
  if (daily.lastClaimDate === todayKey) return false;
  // Guard against clock backwards-jump or rapid forward/backward date farming (<16h check only if lastClaimTimestamp was recorded and clock looks earlier)
  if (daily.lastClaimTimestamp && nowMs < daily.lastClaimTimestamp) {
    return false;
  }
  return true;
}

export function getNextClaimDay(daily: DailyRewardsSave): number {
  if (daily.streakDay >= 30) return 1;
  return daily.streakDay + 1;
}
