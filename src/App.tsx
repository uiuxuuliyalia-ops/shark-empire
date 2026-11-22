import React, { useEffect, useRef, useState } from 'react';
import {
  initSharkGame,
  SharkGameInstance,
  GameStatePayload
} from './game/sharkGame';
import { DAILY_REWARD_SCHEDULE, canClaimDailyToday } from './game/dailyRewards';
import {
  MobileTouchControls,
  detectTouchControlsAvailable
} from './components/MobileTouchControls';
import {
  BIOMES,
  EVOLUTION_FORMS,
  MAX_SKILL_LEVEL,
  SKILL_PRICES_10,
  getStageDisplayName
} from './game/worldData';
import { TRANSLATIONS, USD_COIN_PACKS, UsdCoinPack } from './i18n/translations';
import type { PGFLocale, RewardedAdCallbacks } from './types/pgf';
import {
  ShoppingBag,
  Heart,
  X,
  Play,
  Volume2,
  VolumeX,
  Shield,
  Pause,
  RotateCcw,
  Tv,
  CreditCard,
  LogOut,
  Check,
  Calendar,
  Map,
  Sparkles,
  Lock,
  Crown
} from 'lucide-react';

type ScreenState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY' | 'GAME_OVER';
type ShopTab = 'skills' | 'evolution' | 'skins' | 'ach' | 'bank';

const LOCALE_OPTIONS: { code: PGFLocale; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' }
];

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<SharkGameInstance | null>(null);
  const screenRef = useRef<ScreenState>('TITLE_MENU');

  const [locale, setLocale] = useState<PGFLocale>(() => window.PGF?.getLocale() || 'ru');
  const t = TRANSLATIONS[locale] || TRANSLATIONS.ru;

  const [screenState, setScreenState] = useState<ScreenState>('TITLE_MENU');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isStagesOpen, setIsStagesOpen] = useState(false);
  const [isTouchControls, setIsTouchControls] = useState<boolean>(() =>
    detectTouchControlsAvailable()
  );
  const [activeShopTab, setActiveShopTab] = useState<ShopTab>('skills');
  const hasAutoOpenedDailyRef = useRef(false);

  const [gameState, setGameState] = useState<GameStatePayload>({
    hp: 100,
    hpMax: 100,
    energy: 100,
    energyMax: 100,
    coins: 100,
    runCoins: 0,
    score: 0,
    highScore: 0,
    level: 1,
    highestLevel: 1,
    eraIndex: 0,
    levelName: getStageDisplayName(1, window.PGF?.getLocale() || 'ru'),
    evolutionTier: 1,
    evolutionOwned: 1,
    evolutionName: EVOLUTION_FORMS[0].names[window.PGF?.getLocale() || 'ru'],
    mightFactor: EVOLUTION_FORMS[0].mightFactor,
    sharkScale: EVOLUTION_FORMS[0].scale,
    totalFishEaten: 0,
    totalEnemiesDefeated: 0,
    totalBossesDefeated: 0,
    fishEaten: 0,
    fishTarget: 15,
    enemyKilled: 0,
    enemyTarget: 0,
    hasBoss: false,
    bossKind: 'none',
    bossHp: 0,
    bossMaxHp: 0,
    combo: 0,
    isFrenzy: false,
    isShieldActive: false,
    hasShieldUnlocked: false,
    isSoundMuted: false,
    magnetTimer: 0,
    starTimer: 0,
    clockTimer: 0,
    netCaught: false,
    skinsOwned: ['classic'],
    dailyRewards: {
      streakDay: 0,
      lastClaimDate: null,
      claimedDays: [],
      cycleCount: 0
    },
    canClaimDaily: false,
    nextDailyDay: 1,
    runSummary: null,
    toast: null,
    banner: null
  });

  const [skills, setSkills] = useState<Record<string, number>>({
    attack: 0,
    armor: 0,
    regen: 0,
    speed: 0,
    lifesteal: 0,
    crit: 0
  });
  const [currentSkin, setCurrentSkin] = useState('classic');
  const [achievements, setAchievements] = useState<Record<string, boolean>>({});
  const [localToast, setLocalToast] = useState<string | null>(null);

  // Rewarded Ad 5-second simulator modal state
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [adPending, setAdPending] = useState(false);
  const [adContext, setAdContext] = useState<'run' | 'daily'>('run');
  const adCallbacksRef = useRef<{
    adFinished?: () => void;
    adError?: (err?: unknown) => void;
  } | null>(null);
  const wasMutedBeforeAdRef = useRef(false);

  // USD Payment Preview modal state
  const [selectedUsdPack, setSelectedUsdPack] = useState<UsdCoinPack | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'xsolla'>('stripe');

  useEffect(() => {
    screenRef.current = screenState;
  }, [screenState]);

  // Auto-dismiss transient toast messages
  useEffect(() => {
    if (!gameState.toast) return;
    setLocalToast(gameState.toast);
    const id = window.setTimeout(() => {
      setLocalToast(null);
    }, 2800);
    return () => window.clearTimeout(id);
  }, [gameState.toast]);

  // Initialize Phaser game & sync with PGF SDK
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const instance = initSharkGame(containerRef.current, (payload) => {
      setGameState(payload);
      if (payload.runSummary && screenRef.current === 'PLAYING') {
        setScreenState(payload.runSummary.type === 'victory' ? 'ROUND_SUMMARY' : 'GAME_OVER');
      }
    });

    if (instance) {
      gameRef.current = instance;
      instance.setLocale(window.PGF?.getLocale() || 'ru');
      setSkills(instance.getSkills());
      setCurrentSkin(instance.getCurrentSkin());
      setAchievements(instance.getAchievements());
      const initialDaily = instance.getDailyRewards();
      if (!hasAutoOpenedDailyRef.current && canClaimDailyToday(initialDaily)) {
        hasAutoOpenedDailyRef.current = true;
        setIsDailyOpen(true);
      }
    }

    const unsubscribeLocale = window.PGF
      ? window.PGF.onLocaleChange((nextLang) => {
          setLocale(nextLang);
          gameRef.current?.setLocale(nextLang);
        })
      : () => {};

    const onResize = () => {
      setIsTouchControls(detectTouchControlsAvailable());
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      unsubscribeLocale();
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, []);

  // Re-run PGF [data-pgf] DOM translation on screen/locale updates
  useEffect(() => {
    window.PGF?.translateDOM();
  }, [locale, screenState, isShopOpen, isDailyOpen, isStagesOpen]);

  // Escape shortcut for Pause / Closing modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (adModalOpen) return;
      if (selectedUsdPack) {
        setSelectedUsdPack(null);
        return;
      }
      if (isStagesOpen) {
        handleCloseStages();
        return;
      }
      if (isDailyOpen) {
        handleCloseDaily();
        return;
      }
      if (isShopOpen) {
        handleCloseShop();
        return;
      }
      if (screenRef.current === 'PLAYING') {
        handlePauseGame();
      } else if (screenRef.current === 'PAUSED') {
        handleResumeGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [adModalOpen, selectedUsdPack, isShopOpen, isDailyOpen, isStagesOpen]);

  // 5-second Rewarded Ad countdown loop
  useEffect(() => {
    if (!adModalOpen) return;
    if (adCountdown <= 0) {
      const cbs = adCallbacksRef.current;
      adCallbacksRef.current = null;
      setAdModalOpen(false);
      setAdPending(false);
      if (cbs?.adFinished) cbs.adFinished();
      return;
    }
    const timer = window.setTimeout(() => {
      setAdCountdown((c) => c - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [adModalOpen, adCountdown]);

  const handleLocaleSwitch = (nextLang: PGFLocale) => {
    if (window.PGF) {
      window.PGF.setLocale(nextLang);
    } else {
      setLocale(nextLang);
      gameRef.current?.setLocale(nextLang);
    }
  };

  const handleStartGame = () => {
    setScreenState('PLAYING');
    gameRef.current?.resume();
  };

  const handlePauseGame = () => {
    gameRef.current?.pause();
    setScreenState('PAUSED');
  };

  const handleResumeGame = () => {
    setScreenState('PLAYING');
    gameRef.current?.resume();
  };

  const handleOpenShop = (tab: ShopTab = 'skills') => {
    if (screenState === 'PLAYING') {
      gameRef.current?.pause();
    }
    if (gameRef.current) {
      setSkills(gameRef.current.getSkills());
      setCurrentSkin(gameRef.current.getCurrentSkin());
      setAchievements(gameRef.current.getAchievements());
    }
    setActiveShopTab(tab);
    setIsShopOpen(true);
  };

  const handleCloseShop = () => {
    setIsShopOpen(false);
    setSelectedUsdPack(null);
    if (screenState === 'PLAYING') {
      gameRef.current?.resume();
    }
  };

  const handleOpenDaily = () => {
    if (screenState === 'PLAYING') {
      gameRef.current?.pause();
    }
    setIsDailyOpen(true);
  };

  const handleCloseDaily = () => {
    setIsDailyOpen(false);
    if (screenState === 'PLAYING') {
      gameRef.current?.resume();
    }
  };

  const handleOpenStages = () => {
    if (screenState === 'PLAYING') {
      gameRef.current?.pause();
    }
    setIsStagesOpen(true);
  };

  const handleCloseStages = () => {
    setIsStagesOpen(false);
    if (screenState === 'PLAYING') {
      gameRef.current?.resume();
    }
  };

  const handleSelectStageFromMap = (stage: number) => {
    if (stage > gameState.highestLevel) return;
    gameRef.current?.selectStage(stage);
    setIsStagesOpen(false);
    setScreenState('PLAYING');
  };

  const handleToggleSound = () => {
    gameRef.current?.toggleSound();
  };

  const handleUpgradeSkill = (skillKey: string) => {
    if (!gameRef.current) return;
    if (gameRef.current.buySkill(skillKey)) {
      setSkills(gameRef.current.getSkills());
    }
  };

  const handleEvolveTier = (tier: number) => {
    gameRef.current?.buyEvolution(tier);
  };

  const handleSelectSkin = (skinId: string) => {
    if (!gameRef.current) return;
    if (gameRef.current.buySkin(skinId)) {
      setCurrentSkin(gameRef.current.getCurrentSkin());
    }
  };

  const handleRestartReef = () => {
    setScreenState('PLAYING');
    gameRef.current?.retryCurrentLevel();
  };

  const handleNextReef = () => {
    setScreenState('PLAYING');
    gameRef.current?.proceedNextLevel();
  };

  const handleExitToMenu = () => {
    gameRef.current?.pause();
    window.PGF?.flush();
    window.PGF?.exitToPortal();
    setScreenState('TITLE_MENU');
  };

  const triggerRewardedAd = (context: 'run' | 'daily', onRewardGranted: () => void) => {
    if (adPending) return;
    setAdPending(true);
    setAdContext(context);

    const callbacks: RewardedAdCallbacks = {
      adStarted: () => {
        wasMutedBeforeAdRef.current = gameState.isSoundMuted;
        gameRef.current?.pause();
        gameRef.current?.setMuted(true);
      },
      adFinished: () => {
        gameRef.current?.setMuted(wasMutedBeforeAdRef.current);
        onRewardGranted();
        setAdPending(false);
      },
      adError: () => {
        gameRef.current?.setMuted(wasMutedBeforeAdRef.current);
        setAdPending(false);
        setLocalToast(t.adCancelledToast);
      }
    };

    const simulatorTrigger = (cbs: RewardedAdCallbacks) => {
      if (cbs.adStarted) cbs.adStarted();
      adCallbacksRef.current = cbs;
      setAdCountdown(5);
      setAdModalOpen(true);
    };

    if (window.PGF?.ad) {
      window.PGF.ad.requestRewarded(callbacks, simulatorTrigger);
    } else {
      simulatorTrigger(callbacks);
    }
  };

  const handleWatchAdDouble = () => {
    if (!gameState.runSummary || gameState.runSummary.adDoubled || gameState.runSummary.runCoins <= 0 || adPending) {
      return;
    }
    triggerRewardedAd('run', () => {
      gameRef.current?.grantRunAdDouble();
    });
  };

  const handleClaimDaily = (multiplier: 1 | 2) => {
    if (!gameRef.current || !gameState.canClaimDaily || adPending) return;

    const applyClaim = (mult: 1 | 2) => {
      const result = gameRef.current?.claimDailyReward(mult);
      if (result && gameRef.current) {
        setSkills(gameRef.current.getSkills());
        setCurrentSkin(gameRef.current.getCurrentSkin());
        setAchievements(gameRef.current.getAchievements());
      }
    };

    if (multiplier === 1) {
      applyClaim(1);
    } else {
      triggerRewardedAd('daily', () => applyClaim(2));
    }
  };

  const handleCancelSimulatedAd = () => {
    const cbs = adCallbacksRef.current;
    adCallbacksRef.current = null;
    setAdModalOpen(false);
    setAdPending(false);
    if (cbs?.adError) cbs.adError();
  };

  const handleCompleteTestPurchase = () => {
    if (!selectedUsdPack || !gameRef.current) return;
    window.PGF?.payments.createSession({
      provider: paymentProvider,
      sku: selectedUsdPack.sku,
      amountUsd: selectedUsdPack.amountUsd,
      coins: selectedUsdPack.coins
    });
    gameRef.current.addCoins(selectedUsdPack.coins, 'iap');
    setSelectedUsdPack(null);
  };

  const handleStickChange = React.useCallback(
    (dx: number, dy: number, active: boolean, sprint: boolean) => {
      gameRef.current?.setTouchInput(dx, dy, active, sprint);
    },
    []
  );

  const skillMetaList = [
    { id: 'attack', icon: '🦈', prices: SKILL_PRICES_10.attack },
    { id: 'armor', icon: '🛡️', prices: SKILL_PRICES_10.armor },
    { id: 'regen', icon: '💚', prices: SKILL_PRICES_10.regen },
    { id: 'speed', icon: '⚡', prices: SKILL_PRICES_10.speed },
    { id: 'lifesteal', icon: '🩸', prices: SKILL_PRICES_10.lifesteal },
    { id: 'crit', icon: '💥', prices: SKILL_PRICES_10.crit }
  ];

  const skinMetaList = [
    { id: 'classic', price: 0, color: '#38bdf8' },
    { id: 'tiger', price: 600, color: '#fbbf24' },
    { id: 'neon', price: 1200, color: '#22d3ee' },
    { id: 'ruby', price: 2500, color: '#f43f5e' },
    { id: 'abyss', price: 5000, color: '#c084fc' }
  ];

  const achievementMetaList = [
    { id: 'first', icon: '🩸' },
    { id: 'lvl1', icon: '1️⃣' },
    { id: 'lvl5', icon: '5️⃣' },
    { id: 'lvl10', icon: '🏆' },
    { id: 'jelly', icon: '🎐' },
    { id: 'combo10', icon: '🔥' },
    { id: 'rich', icon: '💰' },
    { id: 'jumper', icon: '🐬' }
  ];

  const renderLocaleSwitcher = () => (
    <div
      className="inline-flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-700/70"
      role="group"
      aria-label={t.languageLabel}
    >
      {LOCALE_OPTIONS.map((opt) => {
        const active = locale === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => handleLocaleSwitch(opt.code)}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active
                ? 'bg-sky-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className="relative w-[100dvw] h-[100dvh] overflow-hidden bg-slate-950 text-slate-100 select-none flex items-center justify-center"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {/* Phaser Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 flex items-center justify-center bg-slate-950"
      />

      {/* Active Gameplay HUD */}
      {screenState !== 'TITLE_MENU' && (
        <div
          className="absolute inset-0 pointer-events-none z-20 flex flex-col"
          style={{
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left))'
          }}
        >
          {/* Top Header Stack (stays pinned at top regardless of bottom hints) */}
          <div className="flex flex-col w-full shrink-0">
          {/* Top Bar: Meters · Level Info · Coins & Actions */}
          <div className="flex items-start justify-between gap-2 sm:gap-4 w-full">
            {/* HP & Energy Panel */}
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-3 [@media(max-height:460px)]:px-2.5 [@media(max-height:460px)]:py-1.5 rounded-2xl border border-slate-700/70 pointer-events-auto min-w-[136px] sm:min-w-[208px]">
              <div className="space-y-1.5 sm:space-y-2 [@media(max-height:460px)]:space-y-1">
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold">
                  <span className="text-rose-400 flex items-center gap-1 whitespace-nowrap">
                    <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 fill-rose-500" /> {t.hpLabel}
                  </span>
                  <span className="text-slate-300 tabular-nums">
                    {Math.round(gameState.hp)}/{gameState.hpMax}
                  </span>
                </div>
                <div className="h-1.5 sm:h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-150"
                    style={{
                      width: `${Math.max(0, Math.min(100, (gameState.hp / gameState.hpMax) * 100))}%`
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-slate-400">
                  <span>{t.energyLabel}</span>
                  <span className="tabular-nums">
                    {Math.round(gameState.energy)}/{gameState.energyMax}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-sky-400 rounded-full transition-all duration-150"
                    style={{
                      width: `${Math.max(0, Math.min(100, (gameState.energy / gameState.energyMax) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Clean Unboxed Level & Score Telemetry (Desktop & Tablet Landscape) */}
            <div className="hidden md:flex flex-col items-center bg-slate-900/90 backdrop-blur-md px-5 py-2.5 [@media(max-height:460px)]:py-1.5 rounded-2xl border border-slate-700/70">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300 whitespace-nowrap">
                <span data-pgf="level">{t.level}</span>
                <span className="tabular-nums">{gameState.level}/100</span>
                <span aria-hidden="true">·</span>
                <span>{gameState.levelName}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300">{gameState.evolutionName}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 tabular-nums whitespace-nowrap">
                <span>
                  {t.fishLabel}: {Math.min(gameState.fishEaten, gameState.fishTarget)}/{gameState.fishTarget}
                </span>
                {gameState.enemyTarget > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t.enemiesLabel}: {Math.min(gameState.enemyKilled, gameState.enemyTarget)}/{gameState.enemyTarget}
                    </span>
                  </>
                )}
                {gameState.hasBoss && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-300 font-semibold">
                      {gameState.bossKind === 'eraBoss' ? t.eraBossTag : t.miniBossTag}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>
                  <span data-pgf="score">{t.score}</span>: {gameState.score}
                </span>
              </div>
            </div>

            {/* Coins + Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
              <button
                type="button"
                onClick={() => handleOpenShop('bank')}
                className="min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 flex items-center gap-1.5 sm:gap-2 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title={t.tabBank}
              >
                <span className="text-sm">🪙</span>
                <span className="font-bold text-amber-300 tabular-nums text-xs sm:text-sm">
                  {gameState.coins}
                </span>
                <span className="text-xs font-bold text-emerald-400">+</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 flex items-center justify-center text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={t.sound}
                aria-label={t.sound}
              >
                {gameState.isSoundMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenShop('skills')}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center hover:bg-amber-300 transition-colors cursor-pointer shrink-0"
                title={t.shop}
                aria-label={t.shop}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={handlePauseGame}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 flex items-center justify-center text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={t.pause}
                aria-label={t.pause}
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Compact Mobile Objective Telemetry (iPhone Portrait & Small Screens) */}
          <div className="md:hidden self-center flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-xl border border-slate-700/60 text-[11px] font-semibold text-slate-200 tabular-nums whitespace-nowrap mt-1.5 [@media(max-height:460px)]:mt-0.5">
            <span className="text-sky-300 font-bold">
              {gameState.level}/100
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              {t.fishLabel}: {Math.min(gameState.fishEaten, gameState.fishTarget)}/{gameState.fishTarget}
            </span>
            {gameState.enemyTarget > 0 && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span>
                  {t.enemiesLabel}: {Math.min(gameState.enemyKilled, gameState.enemyTarget)}/{gameState.enemyTarget}
                </span>
              </>
            )}
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>{gameState.score}</span>
          </div>

          {/* Shield & Active Buffs Row */}
          <div className="flex flex-wrap items-center gap-3 self-start mt-2">
            {gameState.hasShieldUnlocked ? (
              <button
                type="button"
                onClick={() => gameRef.current?.toggleShield()}
                className={`pointer-events-auto min-h-[40px] px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  gameState.isShieldActive
                    ? 'bg-sky-400 text-slate-950 border-sky-200'
                    : 'bg-slate-900/90 text-sky-300 border-slate-700/70 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{gameState.isShieldActive ? t.shieldActive : t.shieldReady}</span>
              </button>
            ) : (
              <span className="text-xs font-medium text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                {t.shieldLockedHint}
              </span>
            )}

            {(gameState.magnetTimer > 0 || gameState.starTimer > 0 || gameState.clockTimer > 0) && (
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-200 bg-slate-900/85 px-3 py-1.5 rounded-xl border border-slate-700/70 tabular-nums">
                {gameState.magnetTimer > 0 && (
                  <span>🧲 {Math.ceil(gameState.magnetTimer / 1000)}s</span>
                )}
                {gameState.starTimer > 0 && (
                  <span className="text-amber-300">⭐ {Math.ceil(gameState.starTimer / 1000)}s</span>
                )}
                {gameState.clockTimer > 0 && (
                  <span className="text-sky-300">⏳ {Math.ceil(gameState.clockTimer / 1000)}s</span>
                )}
              </div>
            )}
          </div>

          {/* Active Boss / Mini-Boss HP Bar */}
          {gameState.hasBoss && gameState.bossMaxHp > 0 && screenState === 'PLAYING' && (
            <div className="self-center mt-2 w-full max-w-xs sm:max-w-sm bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-rose-500/50 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="flex items-center gap-1.5 text-rose-300 whitespace-nowrap">
                  <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{gameState.bossKind === 'eraBoss' ? t.eraBossTag : t.miniBossTag}</span>
                </span>
                <span className="text-slate-200 tabular-nums">
                  {Math.max(0, Math.round(gameState.bossHp))}/{Math.round(gameState.bossMaxHp)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-150"
                  style={{
                    width: `${Math.max(0, Math.min(100, (gameState.bossHp / gameState.bossMaxHp) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}
          </div>

          {/* Center Floating Notifications & Banners */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 pointer-events-none">
            {gameState.isFrenzy && (
              <div className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs tracking-wider shadow-lg whitespace-nowrap">
                {t.frenzyBanner}
              </div>
            )}

            {gameState.combo >= 4 && (
              <div
                className="text-2xl sm:text-3xl font-extrabold text-amber-300 tabular-nums drop-shadow-md"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                X{gameState.combo} {t.comboLabel}
              </div>
            )}

            {localToast && (
              <div className="px-4 py-2 rounded-xl bg-slate-900/95 border border-sky-400/50 text-sky-200 text-xs font-semibold shadow-xl">
                {localToast}
              </div>
            )}

            {gameState.banner && screenState === 'PLAYING' && (
              <div className="text-center text-white pointer-events-none">
                <div
                  className="text-3xl sm:text-5xl font-extrabold tracking-wide text-amber-200 drop-shadow-lg"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {gameState.banner.title}
                </div>
                {gameState.banner.sub && (
                  <div className="text-sm sm:text-base font-medium text-sky-200 mt-1.5">
                    {gameState.banner.sub}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Multi-Touch Controls (Wizard War 3D style: auto on touch devices & <= 1024px) */}
          <MobileTouchControls
            visible={
              isTouchControls &&
              screenState === 'PLAYING' &&
              !isShopOpen &&
              !isDailyOpen &&
              !isStagesOpen &&
              !adModalOpen
            }
            isShieldActive={gameState.isShieldActive}
            hasShieldUnlocked={gameState.hasShieldUnlocked}
            netCaught={gameState.netCaught}
            energy={gameState.energy}
            dashLabel={t.dashBtn}
            shieldLabel={t.shieldBtn}
            shieldLockedLabel={t.shieldLockedShort}
            breakNetLabel={t.breakNetBtn}
            turboLabel={t.turboLabel}
            onStickChange={handleStickChange}
            onDash={() => gameRef.current?.performDash()}
            onToggleShield={() => gameRef.current?.toggleShield()}
          />

          {/* Desktop Controls Hint (shown on non-touch desktop viewports) */}
          {!isTouchControls && (
            <div className="hidden lg:flex self-start items-center text-xs text-slate-300 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 gap-3 pointer-events-auto">
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-sky-300 font-mono font-semibold">
                  WASD
                </kbd>{' '}
                {t.hintSwim}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-sky-300 font-mono font-semibold">
                  Space
                </kbd>{' '}
                {t.hintDash}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-sky-300 font-mono font-semibold">
                  E
                </kbd>{' '}
                {t.hintShield}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-sky-300 font-mono font-semibold">
                  Esc
                </kbd>{' '}
                {t.pause}
              </span>
            </div>
          )}
        </div>
      )}

      {/* TITLE MENU */}
      {screenState === 'TITLE_MENU' && (
        <div
          className="absolute inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div
            className="absolute"
            style={{
              top: 'max(1rem, env(safe-area-inset-top))',
              right: 'max(1rem, env(safe-area-inset-right))'
            }}
          >
            {renderLocaleSwitcher()}
          </div>

          <div className="max-w-md w-full bg-slate-900/95 border border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-2xl text-center max-h-[92dvh] overflow-y-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-sky-400/15 border border-sky-400/40 flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-5">
              🦈
            </div>

            <h1
              className="text-2xl sm:text-4xl font-extrabold tracking-wide text-white"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              SHARK EMPIRE
            </h1>
            <p className="text-xs text-sky-300 font-medium mt-1.5">
              {t.subtitle}
            </p>
            <p className="text-[11px] font-semibold text-amber-300/85 tracking-wide mt-1">
              by Play Game Free Studio
            </p>
            <div className="mt-2.5 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 flex-wrap tabular-nums">
              <span className="text-sky-300">{gameState.evolutionName}</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-amber-300">{t.mightLabel} x{gameState.mightFactor.toFixed(1)}</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>{gameState.highestLevel}/100</span>
            </div>

            {/* Unboxed metadata row with middots */}
            <div className="my-5 py-3.5 border-y border-slate-800 flex items-center justify-around text-sm">
              <div>
                <div className="text-xs text-slate-400" data-pgf="coins">
                  {t.coins}
                </div>
                <div className="text-lg font-bold text-amber-300 tabular-nums mt-0.5">
                  🪙 {gameState.coins}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-xs text-slate-400" data-pgf="record">
                  {t.record}
                </div>
                <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {gameState.highScore}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-xs text-slate-400">{t.locationsLabel}</div>
                <div className="text-lg font-bold text-sky-300 mt-0.5 whitespace-nowrap">
                  {t.reefsValue}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartGame}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-sky-400 text-slate-950 font-extrabold text-sm hover:bg-sky-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-3 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span data-pgf="play">{t.play}</span>
              <span className="text-xs font-bold opacity-80 tabular-nums">({gameState.level}/100)</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenShop('skills')}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                <span data-pgf="shop">{t.shop}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenShop('evolution')}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 border border-sky-500/40 text-sky-200 hover:bg-slate-700 hover:text-white transition-colors text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
                <span>{t.tabEvolution}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenStages}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Map className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.stagesBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {gameState.isSoundMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-300 shrink-0" />
                )}
                <span>{gameState.isSoundMuted ? t.soundOff : t.soundOn}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenDaily}
              className={`w-full mt-2.5 min-h-[44px] py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 transition-colors cursor-pointer whitespace-nowrap ${
                gameState.canClaimDaily
                  ? 'bg-amber-400/15 border-amber-400/60 text-amber-200 hover:bg-amber-400/25'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t.dailyBtn}</span>
              </span>
              <span className="text-[11px] font-semibold tabular-nums flex items-center gap-1.5 shrink-0">
                <span className={gameState.canClaimDaily ? 'text-amber-300' : 'text-emerald-400'}>
                  {gameState.canClaimDaily ? t.dailyReadyBadge : t.dailyDoneBadge}
                </span>
                <span className="text-slate-500" aria-hidden="true">·</span>
                <span className="text-slate-300">{gameState.dailyRewards.streakDay}/30</span>
              </span>
            </button>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 tabular-nums">
              {t.chronicleSummary(
                gameState.totalFishEaten,
                gameState.totalEnemiesDefeated,
                gameState.totalBossesDefeated
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY WITH CORNER RU | EN | ZH SWITCHER */}
      {screenState === 'PAUSED' && !isShopOpen && !isDailyOpen && !isStagesOpen && !adModalOpen && (
        <div
          className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div
            className="absolute"
            style={{
              top: 'max(1rem, env(safe-area-inset-top))',
              right: 'max(1rem, env(safe-area-inset-right))'
            }}
          >
            {renderLocaleSwitcher()}
          </div>

          <div className="max-w-sm w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-center max-h-[92dvh] overflow-y-auto">
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Cinzel', serif" }}
              data-pgf="pause"
            >
              {t.pauseTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t.pauseSubtitle}</p>

            <div className="my-5 py-3 border-y border-slate-800 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-300 tabular-nums">
              <span>
                {t.level} {gameState.level}/100
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-300">{gameState.evolutionName}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t.score}: {gameState.score}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-300 font-semibold">🪙 {gameState.coins}</span>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleResumeGame}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-sky-400 text-slate-950 font-bold text-sm hover:bg-sky-300 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span data-pgf="continue">{t.continue}</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenShop('skills')}
                  className="min-h-[44px] py-3 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 transition-colors text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                  <span data-pgf="shop">{t.shop}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenStages}
                  className="min-h-[44px] py-3 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 transition-colors text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Map className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.stagesBtn}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenDaily}
                className={`w-full min-h-[44px] py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  gameState.canClaimDaily
                    ? 'bg-amber-400/15 border-amber-400/60 text-amber-200 hover:bg-amber-400/25'
                    : 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t.dailyBtn}</span>
                </span>
                <span className="text-xs font-semibold tabular-nums flex items-center gap-1.5">
                  <span className={gameState.canClaimDaily ? 'text-amber-300' : 'text-emerald-400'}>
                    {gameState.canClaimDaily ? t.dailyReadyBadge : t.dailyDoneBadge}
                  </span>
                  <span className="text-slate-500" aria-hidden="true">·</span>
                  <span className="text-slate-300">{gameState.dailyRewards.streakDay}/30</span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleRestartReef}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 text-sky-300" />
                <span data-pgf="restart">{t.restart}</span>
              </button>

              <button
                type="button"
                onClick={handleExitToMenu}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span data-pgf="exit">{t.exit}</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-medium text-slate-400">
              by Play Game Free Studio
            </div>
          </div>
        </div>
      )}

      {/* END-OF-LEVEL / GAME OVER SUMMARY + 2X REWARDED AD CTA */}
      {(screenState === 'ROUND_SUMMARY' || screenState === 'GAME_OVER') && gameState.runSummary && !isShopOpen && !isStagesOpen && !adModalOpen && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-center max-h-[92dvh] overflow-y-auto">
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-white"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {gameState.runSummary.type === 'victory'
                ? t.summaryVictoryTitle
                : t.summaryGameOverTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {gameState.runSummary.type === 'victory'
                ? t.summaryVictorySub
                : t.summaryGameOverSub}
            </p>

            {/* Run Summary Metrics */}
            <div className="my-6 py-4 border-y border-slate-800 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-slate-400">{t.score}</div>
                <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {gameState.runSummary.score}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">{t.runCoinsLabel}</div>
                <div className="text-lg font-bold text-amber-300 tabular-nums mt-0.5">
                  +{gameState.runSummary.runCoins} 🪙
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">{t.totalCoinsLabel}</div>
                <div className="text-lg font-bold text-sky-300 tabular-nums mt-0.5">
                  {gameState.coins} 🪙
                </div>
              </div>
            </div>

            {/* CrazyGames-style 2x Coins Rewarded Ad Button */}
            {gameState.runSummary.runCoins > 0 && (
              <button
                type="button"
                disabled={gameState.runSummary.adDoubled || adPending}
                onClick={handleWatchAdDouble}
                className={`w-full min-h-[48px] py-3 px-5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 mb-3 transition-colors whitespace-nowrap ${
                  gameState.runSummary.adDoubled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer'
                }`}
              >
                {gameState.runSummary.adDoubled ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t.doubledDoneBtn}</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-4 h-4" />
                    <span>
                      {t.doubleCoinsBtn} (+{gameState.runSummary.runCoins} 🪙)
                    </span>
                  </>
                )}
              </button>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={
                  gameState.runSummary.type === 'victory'
                    ? handleNextReef
                    : handleRestartReef
                }
                className="flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-sky-400 text-slate-950 font-bold text-sm hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                {gameState.runSummary.type === 'victory'
                  ? t.nextReefBtn
                  : t.retryReefBtn}
              </button>

              <button
                type="button"
                onClick={handleExitToMenu}
                className="min-h-[44px] py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                {t.backMenuBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-SECOND SIMULATED REWARDED AD MODAL */}
      {adModalOpen && (
        <div className="absolute inset-0 z-[70] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl text-center max-h-[92dvh] overflow-y-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-4">
              <Tv className="w-7 h-7" />
            </div>

            <h3
              className="text-xl font-bold text-white"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {t.adModalTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">{t.adModalDesc}</p>

            <div className="my-6 bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-400">
                {adContext === 'daily' ? t.dailyClaim2xBtn : t.adRewardLabel}
              </div>
              <div className="text-3xl font-extrabold text-amber-300 tabular-nums mt-2">
                {t.adSecondsLeft(adCountdown)}
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelSimulatedAd}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.adSkipBtn}
            </button>
          </div>
        </div>
      )}

      {/* 30-DAY DAILY REWARDS CALENDAR MODAL */}
      {isDailyOpen && !adModalOpen && (() => {
        const isFreshCycleReady =
          gameState.dailyRewards.streakDay >= 30 && gameState.canClaimDaily;
        const todayEntry =
          DAILY_REWARD_SCHEDULE[gameState.nextDailyDay - 1] || DAILY_REWARD_SCHEDULE[0];

        return (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl relative max-h-[92dvh] flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
                    <h2
                      className="text-lg sm:text-xl font-bold text-white truncate"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {t.dailyTitle}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{t.dailySubtitle}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-2 tabular-nums">
                    <span className="font-semibold text-sky-300">
                      {t.dailyCycleLabel(gameState.dailyRewards.cycleCount)}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span>
                      {gameState.dailyRewards.streakDay}/30 {t.dailyClaimedLabel}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-amber-300 font-bold">🪙 {gameState.coins}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDaily}
                  className="w-11 h-11 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 30-Day Grid */}
              <div className="flex-1 overflow-y-auto pr-1 my-4">
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {DAILY_REWARD_SCHEDULE.map((entry) => {
                    const isClaimed =
                      !isFreshCycleReady &&
                      gameState.dailyRewards.claimedDays.includes(entry.day);
                    const isTodayReady =
                      gameState.canClaimDaily && entry.day === gameState.nextDailyDay;
                    const isMilestone = Boolean(entry.milestone);

                    return (
                      <div
                        key={entry.day}
                        className={`rounded-2xl border p-2.5 flex flex-col justify-between min-h-[92px] transition-colors ${
                          isTodayReady
                            ? 'bg-sky-500/15 border-sky-400 text-white'
                            : isClaimed
                              ? 'bg-slate-950/60 border-emerald-500/35 text-slate-400'
                              : isMilestone
                                ? 'bg-slate-950/95 border-amber-400/50 text-slate-100'
                                : 'bg-slate-950/75 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[11px] font-bold tabular-nums whitespace-nowrap ${
                              isTodayReady
                                ? 'text-sky-300'
                                : isMilestone
                                  ? 'text-amber-300'
                                  : 'text-slate-400'
                            }`}
                          >
                            {t.dailyDayLabel(entry.day)}
                          </span>
                          {isClaimed && (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {!isClaimed && isTodayReady && (
                            <span className="text-[10px] font-bold text-sky-300 whitespace-nowrap">
                              {t.dailyReadyLabel}
                            </span>
                          )}
                        </div>

                        <div className="my-1.5 text-center">
                          <div className="text-xl leading-none">{entry.icon}</div>
                          <div className="text-xs font-extrabold text-amber-300 tabular-nums mt-1.5 whitespace-nowrap">
                            +{entry.coins.toLocaleString()} 🪙
                          </div>
                        </div>

                        {entry.milestone ? (
                          <div
                            className="text-[10px] text-amber-200/90 text-center leading-tight truncate"
                            title={t.dailyMilestones[entry.milestone]}
                          >
                            {t.dailyMilestones[entry.milestone]}
                          </div>
                        ) : (
                          <div className="h-[13px]" aria-hidden="true" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Claim Action Footer */}
              <div className="pt-4 border-t border-slate-800">
                {gameState.canClaimDaily ? (
                  <div className="space-y-2.5">
                    {todayEntry.milestone && (
                      <div className="text-xs font-semibold text-amber-200 text-center">
                        {t.dailyDayLabel(todayEntry.day)}: +{todayEntry.coins.toLocaleString()} 🪙 ·{' '}
                        {t.dailyMilestones[todayEntry.milestone]}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <button
                        type="button"
                        disabled={adPending}
                        onClick={() => handleClaimDaily(1)}
                        className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-sky-400 text-slate-950 hover:bg-sky-300 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap tabular-nums flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {t.dailyClaimBtn} (+{todayEntry.coins.toLocaleString()} 🪙)
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={adPending}
                        onClick={() => handleClaimDaily(2)}
                        className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap tabular-nums flex items-center justify-center gap-2"
                      >
                        <Tv className="w-4 h-4" />
                        <span>
                          {t.dailyClaim2xBtn} (+{(todayEntry.coins * 2).toLocaleString()} 🪙)
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[44px] flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{t.dailyComeBackTomorrow}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* SHOP MODAL (SKILLS / SKINS / ACHIEVEMENTS / USD BANK) */}
      {isShopOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {t.shopTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.balanceLabel}:{' '}
                  <span className="text-amber-300 font-bold tabular-nums">
                    🪙 {gameState.coins}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseShop}
                className="w-11 h-11 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5 Segmented Shop Tabs */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 my-4">
              {([
                { id: 'skills', label: t.tabSkills },
                { id: 'evolution', label: t.tabEvolution },
                { id: 'skins', label: t.tabSkins },
                { id: 'ach', label: t.tabAch },
                { id: 'bank', label: t.tabBank }
              ] as { id: ShopTab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveShopTab(tab.id)}
                  className={`min-h-[40px] py-2 px-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap truncate ${
                    activeShopTab === tab.id
                      ? 'bg-sky-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {activeShopTab === 'skills' && (
                <>
                  {/* Shield Unlock Row */}
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-sky-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-2xl shrink-0">🛡️</div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{t.shieldItemName}</span>
                          {gameState.hasShieldUnlocked && (
                            <span className="text-emerald-400 text-xs font-semibold">
                              · {t.unlockedBadge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {t.shieldItemDesc}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={gameState.hasShieldUnlocked || gameState.coins < 300}
                      onClick={() => handleUpgradeSkill('shield')}
                      className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                        gameState.hasShieldUnlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                          : gameState.coins >= 300
                            ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {gameState.hasShieldUnlocked ? t.boughtLabel : '300 🪙'}
                    </button>
                  </div>

                  {skillMetaList.map((sk) => {
                    const currentLvl = skills[sk.id] || 0;
                    const isMax = currentLvl >= MAX_SKILL_LEVEL;
                    const price = !isMax ? sk.prices[currentLvl] : 0;
                    const canAfford = gameState.coins >= price;
                    const copy = t.skills[sk.id];

                    return (
                      <div
                        key={sk.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-2xl shrink-0">{sk.icon}</div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{copy.name}</span>
                              <span className="text-xs text-slate-400 tabular-nums font-medium">
                                {currentLvl}/{MAX_SKILL_LEVEL}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{copy.desc}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isMax || !canAfford}
                          onClick={() => handleUpgradeSkill(sk.id)}
                          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                            isMax
                              ? 'bg-slate-800 text-slate-500 cursor-default'
                              : canAfford
                                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isMax ? t.maxLabel : `${price.toLocaleString()} 🪙`}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {activeShopTab === 'evolution' && (
                <>
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-sky-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-sky-300">{t.evolutionTitle}</div>
                      <div className="text-base font-extrabold text-white mt-0.5">
                        {gameState.evolutionName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        {t.chronicleSummary(
                          gameState.totalFishEaten,
                          gameState.totalEnemiesDefeated,
                          gameState.totalBossesDefeated
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold tabular-nums shrink-0">
                      <span className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sky-300">
                        {t.scaleLabel}: {Math.round(gameState.sharkScale * 100)}%
                      </span>
                      <span className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300">
                        {t.mightLabel}: x{gameState.mightFactor.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {EVOLUTION_FORMS.map((form) => {
                    const isOwned = gameState.evolutionOwned >= form.tier;
                    const isActive = gameState.evolutionTier === form.tier;
                    const stageUnlocked = gameState.highestLevel >= form.unlockStage;
                    const canAfford = gameState.coins >= form.cost;
                    const hexColor = `#${form.auraColor.toString(16).padStart(6, '0')}`;

                    return (
                      <div
                        key={form.tier}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-slate-950 border-sky-400'
                            : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 text-sm font-extrabold text-slate-950 shrink-0 tabular-nums"
                            style={{ backgroundColor: hexColor }}
                          >
                            T{form.tier}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                              <span>{form.names[locale] || form.names.ru}</span>
                              <span className="text-[11px] font-semibold text-amber-300 tabular-nums">
                                {t.mightLabel} x{form.mightFactor.toFixed(1)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {form.descs[locale] || form.descs.ru}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isActive || (!isOwned && (!stageUnlocked || !canAfford))}
                          onClick={() => handleEvolveTier(form.tier)}
                          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 tabular-nums flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 cursor-default'
                              : isOwned
                                ? 'bg-slate-700 text-white hover:bg-slate-600 cursor-pointer'
                                : !stageUnlocked
                                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                  : canAfford
                                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {!isOwned && !stageUnlocked && <Lock className="w-3.5 h-3.5" />}
                          <span>
                            {isActive
                              ? t.evolveEquipped
                              : isOwned
                                ? t.selectLabel
                                : !stageUnlocked
                                  ? t.evolveLockedStage(form.unlockStage)
                                  : `${form.cost.toLocaleString()} 🪙`}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {activeShopTab === 'skins' && (
                <>
                  {skinMetaList.map((skin) => {
                    const owned = gameState.skinsOwned.includes(skin.id);
                    const isSelected = currentSkin === skin.id;
                    const canAfford = gameState.coins >= skin.price;
                    const copy = t.skins[skin.id];
                    const perkText = t.skinPerks[skin.id];

                    return (
                      <div
                        key={skin.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 text-xl shrink-0"
                            style={{ backgroundColor: skin.color }}
                          >
                            🦈
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white">{copy.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{copy.desc}</div>
                            {perkText && (
                              <div className="text-[11px] font-semibold text-sky-300 mt-0.5">
                                {perkText}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!owned && !canAfford}
                          onClick={() => handleSelectSkin(skin.id)}
                          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 cursor-default'
                              : owned
                                ? 'bg-slate-700 text-white hover:bg-slate-600 cursor-pointer'
                                : canAfford
                                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isSelected
                            ? t.equippedLabel
                            : owned
                              ? t.selectLabel
                              : `${skin.price} 🪙`}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {activeShopTab === 'ach' && (
                <>
                  {achievementMetaList.map((a) => {
                    const isUnlocked = Boolean(achievements[a.id]);
                    const copy = t.achievements[a.id];
                    return (
                      <div
                        key={a.id}
                        className={`p-4 rounded-2xl border flex items-center gap-3 ${
                          isUnlocked
                            ? 'bg-slate-950/90 border-sky-500/40 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="text-2xl shrink-0">{a.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold flex items-center gap-2">
                            <span>{copy.name}</span>
                            {isUnlocked && (
                              <span className="text-emerald-400 text-xs font-semibold">
                                · {t.completedLabel}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{copy.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {activeShopTab === 'bank' && (
                <>
                  <p className="text-xs text-slate-400 px-1 pb-1">{t.bankIntro}</p>
                  {USD_COIN_PACKS.map((pack) => (
                    <div
                      key={pack.sku}
                      className={`p-4 rounded-2xl bg-slate-950/90 border flex items-center justify-between gap-3 ${
                        pack.highlight === 'best'
                          ? 'border-amber-400/50'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                          🪙
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white tabular-nums flex items-center gap-2">
                            <span>{pack.coins.toLocaleString()} 🪙</span>
                            {pack.bonusPct && (
                              <span className="text-xs font-semibold text-emerald-400">
                                · {t.bonusPercent(pack.bonusPct)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {pack.highlight === 'popular'
                              ? t.popularTag
                              : pack.highlight === 'best'
                                ? t.bestValueTag
                                : pack.sku}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedUsdPack(pack)}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                      >
                        {t.buyUsdBtn} · ${pack.amountUsd.toFixed(2)}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT PREVIEW MODAL (STRIPE / XSOLLA ADAPTER) */}
      {selectedUsdPack && (
        <div className="absolute inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>{t.payModalTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUsdPack(null)}
                className="w-9 h-9 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <div className="text-xs text-slate-400 mb-1.5">{t.payProviderLabel}</div>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {(['stripe', 'xsolla'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setPaymentProvider(prov)}
                      className={`min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer whitespace-nowrap ${
                        paymentProvider === prov
                          ? 'bg-sky-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-3 border-y border-slate-800 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.payCoinsLabel}</span>
                  <span className="font-bold text-amber-300 tabular-nums">
                    +{selectedUsdPack.coins.toLocaleString()} 🪙
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.payAmountLabel}</span>
                  <span className="font-bold text-white tabular-nums">
                    ${selectedUsdPack.amountUsd.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{t.payDisclaimer}</p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleCompleteTestPurchase}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.payTestBtn}
              </button>
              <button
                type="button"
                onClick={() => setSelectedUsdPack(null)}
                className="min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.payCancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 100-STAGE BIOME CHRONICLE MAP MODAL */}
      {isStagesOpen && !adModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl relative max-h-[92dvh] flex flex-col">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <Map className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h2
                    className="text-lg sm:text-xl font-bold text-white truncate"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {t.stagesModalTitle}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">{t.stagesModalSub}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-2 tabular-nums">
                  <span className="text-sky-300 font-semibold">{gameState.evolutionName}</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span>
                    {t.stageCurrentTag}: {gameState.level}/100
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-emerald-300 font-semibold">
                    Max: {gameState.highestLevel}/100
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseStages}
                className="w-11 h-11 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-3">
              {BIOMES.map((biome) => {
                const startStage = biome.eraIndex * 10 + 1;
                const endStage = startStage + 9;
                const glowHex = `#${biome.glow.toString(16).padStart(6, '0')}`;
                const isEraUnlocked = gameState.highestLevel >= startStage;

                return (
                  <div
                    key={biome.id}
                    className={`rounded-2xl border p-3.5 ${
                      isEraUnlocked
                        ? 'bg-slate-950/85 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: glowHex }}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-bold text-white truncate">
                          {biome.eraIndex + 1}. {biome.names[locale] || biome.names.ru}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 tabular-nums shrink-0">
                        {startStage}–{endStage}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                      {Array.from({ length: 10 }, (_, idx) => {
                        const stageNum = startStage + idx;
                        const unlocked = stageNum <= gameState.highestLevel;
                        const isCurrent = stageNum === gameState.level;
                        const isCleared = stageNum < gameState.highestLevel;
                        const isEraBoss = stageNum % 10 === 0;
                        const isMiniBoss = !isEraBoss && stageNum % 5 === 0;

                        return (
                          <button
                            key={stageNum}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => handleSelectStageFromMap(stageNum)}
                            title={getStageDisplayName(stageNum, locale)}
                            className={`min-h-[42px] rounded-xl border text-xs font-bold tabular-nums flex flex-col items-center justify-center transition-colors ${
                              isCurrent
                                ? 'bg-sky-400 text-slate-950 border-sky-200 cursor-pointer'
                                : unlocked
                                  ? isEraBoss
                                    ? 'bg-rose-500/20 border-rose-400/60 text-rose-200 hover:bg-rose-500/35 cursor-pointer'
                                    : isMiniBoss
                                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-200 hover:bg-amber-400/30 cursor-pointer'
                                      : isCleared
                                        ? 'bg-slate-800/90 border-emerald-500/40 text-emerald-200 hover:bg-slate-700 cursor-pointer'
                                        : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 cursor-pointer'
                                  : 'bg-slate-950 border-slate-800/70 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            <span>{stageNum}</span>
                            {isEraBoss ? (
                              <Crown className="w-3 h-3 text-amber-300 mt-0.5" />
                            ) : isMiniBoss ? (
                              <span className="text-[9px] leading-none font-extrabold text-amber-300 mt-0.5">
                                ★
                              </span>
                            ) : !unlocked ? (
                              <Lock className="w-2.5 h-2.5 text-slate-600 mt-0.5" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
