export type PGFLocale = 'ru' | 'en' | 'zh';

export interface SharkSkills {
  attack: number;
  armor: number;
  regen: number;
  speed: number;
  lifesteal: number;
  crit: number;
}

export interface DailyRewardsSave {
  streakDay: number;
  lastClaimDate: string | null;
  claimedDays: number[];
  cycleCount: number;
  lastClaimTimestamp?: number;
}

export interface SharkSaveState {
  coins: number;
  highScore: number;
  currentLevel: number;
  highestLevel?: number;
  evolutionTier?: number;
  evolutionOwned?: number;
  totalFishEaten?: number;
  totalEnemiesDefeated?: number;
  totalBossesDefeated?: number;
  shieldUnlocked: boolean;
  skills: SharkSkills;
  skinsOwned: string[];
  currentSkin: string;
  achievements: Record<string, boolean>;
  soundMuted: boolean;
  breachCount: number;
  dailyRewards?: DailyRewardsSave;
}

export interface SafeSaveEnvelope<T = SharkSaveState> {
  schemaVersion: 2;
  gameId: string;
  gameVersion: string;
  updatedAt: string;
  meta: {
    hasProgress: boolean;
    locale: PGFLocale;
  };
  state: T;
}

export interface RewardedAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error?: unknown) => void;
}

export interface PaymentIntentInput {
  provider: 'stripe' | 'xsolla';
  sku: string;
  amountUsd: number;
  coins: number;
}

export interface PaymentSession extends PaymentIntentInput {
  sessionId: string;
  gameSlug: string;
  currency: 'USD';
  mode: 'preview' | 'live';
  createdAt: string;
}

export interface PGFSDK {
  slug: string;
  storageKey: string;
  schemaVersion: 2;
  save: <T = SharkSaveState>(state: T) => SafeSaveEnvelope<T> | null;
  load: <T = SharkSaveState>(options?: {
    defaultState?: T;
    legacyKeys?: string[];
  }) => T | null;
  loadEnvelope: <T = SharkSaveState>() => SafeSaveEnvelope<T> | null;
  flush: () => void;
  registerAutoSave: (providerFn: () => SharkSaveState) => () => void;
  getLocale: () => PGFLocale;
  setLocale: (lang: PGFLocale | string) => PGFLocale;
  onLocaleChange: (cb: (lang: PGFLocale) => void) => () => void;
  onRemoteSync: (cb: (state: SharkSaveState) => void) => () => void;
  t: (key: string) => string;
  translateDOM: (root?: ParentNode) => void;
  exitToPortal: () => void;
  ad: {
    requestRewarded: (
      callbacks: RewardedAdCallbacks,
      simulatorTrigger?: (cbs: RewardedAdCallbacks) => void
    ) => void;
  };
  payments: {
    createSession: (intent: PaymentIntentInput) => PaymentSession;
  };
}

declare global {
  interface Window {
    PGF?: PGFSDK;
  }
}
